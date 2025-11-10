/**
 * Security Notification System
 * Handles tracking and sending security-related email notifications to admins
 * with deduplication to prevent spam
 */

import { sendMail } from './email';
import {
  buildAccountLockoutEmail,
  buildFailedLoginSpikeEmail,
  buildNewAdminLoginEmail,
} from './admin-email-templates';
import clientPromise from './mongodb';

// In-memory store for failed login tracking (temporary, cleared on restart)
const failedLoginTracking = new Map();

const CONFIG = {
  // Account lockout settings
  LOCKOUT_DEDUPE_WINDOW: 15 * 60 * 1000, // 15 minutes - one email per lock window
  
  // Failed login spike settings
  SPIKE_THRESHOLD: 100, // Number of failed logins per hour to trigger alert
  SPIKE_TIME_WINDOW: 60 * 60 * 1000, // 1 hour
  SPIKE_CHECK_INTERVAL: 5 * 60 * 1000, // Check every 5 minutes
  SPIKE_DEDUPE_WINDOW: 60 * 60 * 1000, // One alert per hour
  
  // New device settings
  DEVICE_DEDUPE_WINDOW: 24 * 60 * 60 * 1000, // One email per device per day
  
  // Admin email (from env or default)
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@libra.ai',
  
  // Base URL for links
  BASE_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};

/**
 * Check if a notification was recently sent (deduplication) - using MongoDB
 */
async function wasRecentlySent(key, dedupeWindow) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    const collection = db.collection('security_notifications');
    
    const record = await collection.findOne({ key });
    
    if (!record) return false;
    
    const now = Date.now();
    if (now - record.lastSent < dedupeWindow) {
      return true;
    }
    
    // Expired, clean up
    await collection.deleteOne({ key });
    return false;
  } catch (error) {
    console.error('[Security Notifications] Error checking deduplication:', error);
    // Fail open - allow notification if database check fails
    return false;
  }
}

/**
 * Mark a notification as sent - using MongoDB
 */
async function markAsSent(key) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    const collection = db.collection('security_notifications');
    
    await collection.updateOne(
      { key },
      { 
        $set: { 
          key,
          lastSent: Date.now(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('[Security Notifications] Error marking as sent:', error);
  }
}

/**
 * Get admin email addresses from database
 */
async function getAdminEmails() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    
    // Query all admin users with email notifications enabled
    const admins = await db.collection('users')
      .find({ 
        role: 'admin',
        emailNotifications: { $ne: false } // Include if true or undefined (default enabled)
      })
      .toArray();
    
    const emails = admins.map(admin => admin.email).filter(Boolean);
    
    if (emails.length === 0) {
      console.warn('[Security Notifications] No admin users found with email notifications enabled.');
      
      // Fallback to env var if no admins in database
      const fallbackEmail = CONFIG.ADMIN_EMAIL;
      if (fallbackEmail && fallbackEmail !== 'admin@libra.ai') {
        console.log('[Security Notifications] Using fallback admin email from env var.');
        return [fallbackEmail];
      }
    }
    
    console.log(`[Security Notifications] Found ${emails.length} admin(s) to notify:`, emails);
    return emails;
  } catch (error) {
    console.error('[Security Notifications] Error fetching admin emails from database:', error);
    
    // Fallback to env var on database error
    const fallbackEmail = CONFIG.ADMIN_EMAIL;
    if (fallbackEmail && fallbackEmail !== 'admin@libra.ai') {
      console.log('[Security Notifications] Using fallback admin email from env var due to database error.');
      return [fallbackEmail];
    }
    
    return [];
  }
}

/**
 * Send account lockout notification
 * @param {Object} params
 * @param {string} params.lockedEmail - Email of locked account
 * @param {string} params.role - Role of locked account
 * @param {number} params.attempts - Number of failed attempts
 * @param {number} params.lockWindowMinutes - Lock duration in minutes
 */
export async function notifyAccountLockout({ lockedEmail, role, attempts, lockWindowMinutes = 15 }) {
  try {
    // Deduplication: one email per identifier per lock window
    const dedupeKey = `lockout:${lockedEmail}`;
    if (await wasRecentlySent(dedupeKey, CONFIG.LOCKOUT_DEDUPE_WINDOW)) {
      console.log(`[Security Notifications] Lockout notification for ${lockedEmail} already sent recently`);
      return { sent: false, reason: 'deduplicated' };
    }

    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      console.log('[Security Notifications] No admin emails configured');
      return { sent: false, reason: 'no_recipients' };
    }

    const unlockUrl = `${CONFIG.BASE_URL}/admin/security`;
    const results = [];

    for (const adminEmail of adminEmails) {
      const emailContent = buildAccountLockoutEmail({
        adminEmail,
        lockedEmail,
        role,
        attempts,
        lockWindowMinutes,
        unlockUrl,
      });

      try {
        await sendMail({
          to: adminEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          templateParams: emailContent.templateParams,
        });

        console.log(`✓ Account lockout notification sent to ${adminEmail}`);
        results.push({ email: adminEmail, sent: true });
      } catch (error) {
        console.error(`✗ Failed to send lockout notification to ${adminEmail}:`, error);
        results.push({ email: adminEmail, sent: false, error: error.message });
      }
    }

    // Mark as sent if at least one succeeded
    if (results.some(r => r.sent)) {
      await markAsSent(dedupeKey);
    }

    return { sent: true, results };
  } catch (error) {
    console.error('[Security Notifications] Error sending lockout notification:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Track failed login attempt for spike detection
 * @param {Object} params
 * @param {string} params.email - Email that failed
 * @param {string} params.ipAddress - Source IP
 * @param {number} params.timestamp - Timestamp of attempt
 */
export function trackFailedLogin({ email, ipAddress, timestamp = Date.now() }) {
  const now = timestamp;
  
  // Get or create tracking array
  let attempts = failedLoginTracking.get('global') || [];
  
  // Remove old attempts outside the window
  attempts = attempts.filter(attempt => now - attempt.timestamp < CONFIG.SPIKE_TIME_WINDOW);
  
  // Add new attempt
  attempts.push({ email, ipAddress, timestamp: now });
  
  failedLoginTracking.set('global', attempts);
  
  return attempts.length;
}

/**
 * Check for failed login spike and send notification if threshold exceeded
 */
export async function checkFailedLoginSpike() {
  try {
    const attempts = failedLoginTracking.get('global') || [];
    const now = Date.now();
    
    // Filter to recent attempts
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < CONFIG.SPIKE_TIME_WINDOW
    );
    
    if (recentAttempts.length < CONFIG.SPIKE_THRESHOLD) {
      return { spike: false, count: recentAttempts.length };
    }

    // Spike detected! Check deduplication
    const dedupeKey = 'spike:global';
    if (await wasRecentlySent(dedupeKey, CONFIG.SPIKE_DEDUPE_WINDOW)) {
      console.log('[Security Notifications] Spike notification already sent recently');
      return { spike: true, count: recentAttempts.length, sent: false, reason: 'deduplicated' };
    }

    // Analyze the spike
    const emailCounts = {};
    const ipCounts = {};
    
    recentAttempts.forEach(attempt => {
      emailCounts[attempt.email] = (emailCounts[attempt.email] || 0) + 1;
      ipCounts[attempt.ipAddress] = (ipCounts[attempt.ipAddress] || 0) + 1;
    });

    // Get top 5 targeted accounts and IPs
    const topAccounts = Object.entries(emailCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([email, count]) => `${email} (${count})`);

    const topIPs = Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ip, count]) => `${ip} (${count})`);

    const adminEmails = await getAdminEmails();
    if (adminEmails.length === 0) {
      return { spike: true, count: recentAttempts.length, sent: false, reason: 'no_recipients' };
    }

    const dashboardUrl = `${CONFIG.BASE_URL}/admin/security`;
    const results = [];

    for (const adminEmail of adminEmails) {
      const emailContent = buildFailedLoginSpikeEmail({
        adminEmail,
        failedCount: recentAttempts.length,
        timeWindow: '1 hour',
        topAccounts,
        topIPs,
        dashboardUrl,
      });

      try {
        await sendMail({
          to: adminEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          templateParams: emailContent.templateParams,
        });

        console.log(`✓ Failed login spike notification sent to ${adminEmail}`);
        results.push({ email: adminEmail, sent: true });
      } catch (error) {
        console.error(`✗ Failed to send spike notification to ${adminEmail}:`, error);
        results.push({ email: adminEmail, sent: false, error: error.message });
      }
    }

    // Mark as sent if at least one succeeded
    if (results.some(r => r.sent)) {
      await markAsSent(dedupeKey);
    }

    return { spike: true, count: recentAttempts.length, sent: true, results };
  } catch (error) {
    console.error('[Security Notifications] Error checking failed login spike:', error);
    return { spike: false, error: error.message };
  }
}

/**
 * Track device login for new device detection
 * @param {Object} params
 * @param {string} params.email - Email that logged in
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent string
 */
function getDeviceFingerprint({ email, ipAddress, userAgent }) {
  // Simple fingerprint: email + IP + browser family
  const browserFamily = userAgent.includes('Chrome') ? 'chrome' :
                       userAgent.includes('Firefox') ? 'firefox' :
                       userAgent.includes('Safari') ? 'safari' :
                       userAgent.includes('Edge') ? 'edge' : 'other';
  
  return `${email}:${ipAddress}:${browserFamily}`;
}

/**
 * Check if this is a new device/environment for admin login - using MongoDB
 * @param {Object} params
 * @param {string} params.email - Admin email
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent
 * @returns {Promise<boolean>} True if this is a new device
 */
export async function isNewAdminDevice({ email, ipAddress, userAgent }) {
  try {
    const fingerprint = getDeviceFingerprint({ email, ipAddress, userAgent });
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    const collection = db.collection('admin_devices');
    
    const device = await collection.findOne({ fingerprint });
    
    if (!device) {
      // New device - store it
      await collection.insertOne({
        fingerprint,
        email,
        ipAddress,
        userAgent,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
      return true;
    }
    
    // Update last seen
    await collection.updateOne(
      { fingerprint },
      { 
        $set: { 
          lastSeen: new Date(),
          ipAddress, // Update in case IP changed
          userAgent, // Update in case UA changed
        }
      }
    );
    return false;
  } catch (error) {
    console.error('[Security Notifications] Error checking device:', error);
    // Fail safe - treat as not new to avoid spam on errors
    return false;
  }
}

/**
 * Send new admin login notification
 * @param {Object} params
 * @param {string} params.loginEmail - Email that logged in
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent
 * @param {string} params.location - Approximate location
 */
export async function notifyNewAdminLogin({ loginEmail, ipAddress, userAgent, location = 'Unknown' }) {
  try {
    // Deduplication: one email per device per day
    const fingerprint = getDeviceFingerprint({ email: loginEmail, ipAddress, userAgent });
    const dedupeKey = `newdevice:${fingerprint}`;
    
    if (await wasRecentlySent(dedupeKey, CONFIG.DEVICE_DEDUPE_WINDOW)) {
      console.log(`[Security Notifications] New device notification for ${loginEmail} already sent recently`);
      return { sent: false, reason: 'deduplicated' };
    }

    // Send to the admin who logged in
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const approveUrl = `${CONFIG.BASE_URL}/admin/security?action=approve`;
    const reportUrl = `${CONFIG.BASE_URL}/admin/security?action=report`;

    const emailContent = buildNewAdminLoginEmail({
      adminEmail: loginEmail,
      loginEmail,
      ipAddress,
      userAgent,
      location,
      timestamp,
      approveUrl,
      reportUrl,
    });

    try {
      await sendMail({
        to: loginEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        templateParams: emailContent.templateParams,
      });

      console.log(`✓ New admin login notification sent to ${loginEmail}`);
      await markAsSent(dedupeKey);
      
      return { sent: true };
    } catch (error) {
      console.error(`✗ Failed to send new device notification to ${loginEmail}:`, error);
      return { sent: false, error: error.message };
    }
  } catch (error) {
    console.error('[Security Notifications] Error sending new device notification:', error);
    return { sent: false, error: error.message };
  }
}

/**
 * Clean up old tracking data (run periodically) - using MongoDB
 */
export async function cleanupSecurityTracking() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    const now = new Date();
    
    // Clean up sent notifications older than 24 hours
    const notificationsResult = await db.collection('security_notifications').deleteMany({
      updatedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    });
    
    // Clean up device tracking older than 30 days
    const devicesResult = await db.collection('admin_devices').deleteMany({
      lastSeen: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const cleaned = notificationsResult.deletedCount + devicesResult.deletedCount;
    console.log(`[Security Notifications] Cleaned up ${cleaned} old tracking entries (${notificationsResult.deletedCount} notifications, ${devicesResult.deletedCount} devices)`);
    return { cleaned, notifications: notificationsResult.deletedCount, devices: devicesResult.deletedCount };
  } catch (error) {
    console.error('[Security Notifications] Error during cleanup:', error);
    return { cleaned: 0, error: error.message };
  }
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupSecurityTracking, 60 * 60 * 1000);
  
  // Check for failed login spikes every 5 minutes
  setInterval(checkFailedLoginSpike, CONFIG.SPIKE_CHECK_INTERVAL);
}

export { CONFIG as SECURITY_NOTIFICATION_CONFIG };
