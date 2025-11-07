/**
 * Brute Force Protection
 * Tracks failed login attempts and implements account lockout
 */

// In-memory store for failed attempts (use Redis in production)
const failedAttempts = new Map();
const lockedAccounts = new Map();

const CONFIG = {
  MAX_ATTEMPTS: 5, // Maximum failed attempts before lockout
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in milliseconds
  ATTEMPT_WINDOW: 15 * 60 * 1000, // Track attempts within 15 minutes
  PROGRESSIVE_DELAY: true, // Add delays after each failed attempt
};

/**
 * Get delay time based on number of attempts
 */
function getProgressiveDelay(attempts) {
  if (!CONFIG.PROGRESSIVE_DELAY) return 0;
  
  // Progressive delays: 1s, 2s, 4s, 8s, 16s
  return Math.min(Math.pow(2, attempts - 1) * 1000, 16000);
}

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(identifier) {
  const lockInfo = lockedAccounts.get(identifier);
  
  if (!lockInfo) return { locked: false };
  
  const now = Date.now();
  if (now < lockInfo.lockedUntil) {
    const remainingTime = Math.ceil((lockInfo.lockedUntil - now) / 1000);
    return {
      locked: true,
      remainingTime,
      lockedUntil: lockInfo.lockedUntil,
      attempts: lockInfo.attempts,
      reasonCode: lockInfo.reasonCode || null,
    };
  }
  
  // Lock expired, clean up
  lockedAccounts.delete(identifier);
  failedAttempts.delete(identifier);
  return { locked: false };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(identifier, options = {}) {
  const { reasonCode = null } = options;
  const now = Date.now();
  let attempts = failedAttempts.get(identifier) || [];
  
  // Remove attempts outside the window
  attempts = attempts.filter(timestamp => now - timestamp < CONFIG.ATTEMPT_WINDOW);
  
  // Add new attempt
  attempts.push(now);
  failedAttempts.set(identifier, attempts);
  
  // Check if account should be locked
  if (attempts.length >= CONFIG.MAX_ATTEMPTS) {
    const lockedUntil = now + CONFIG.LOCKOUT_DURATION;
    lockedAccounts.set(identifier, {
      lockedUntil,
      attempts: attempts.length,
      lockedAt: now,
      reasonCode,
    });
    
    return {
      locked: true,
      attempts: attempts.length,
      lockedUntil,
      remainingTime: Math.ceil(CONFIG.LOCKOUT_DURATION / 1000),
      reasonCode,
    };
  }
  
  return {
    locked: false,
    attempts: attempts.length,
    remainingAttempts: CONFIG.MAX_ATTEMPTS - attempts.length,
    delay: getProgressiveDelay(attempts.length),
    reasonCode,
  };
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(identifier) {
  failedAttempts.delete(identifier);
  lockedAccounts.delete(identifier);
}

/**
 * Get current attempt count
 */
export function getAttemptCount(identifier) {
  const attempts = failedAttempts.get(identifier) || [];
  const now = Date.now();
  
  // Filter to only recent attempts
  const recentAttempts = attempts.filter(
    timestamp => now - timestamp < CONFIG.ATTEMPT_WINDOW
  );
  
  return {
    count: recentAttempts.length,
    remaining: Math.max(0, CONFIG.MAX_ATTEMPTS - recentAttempts.length),
  };
}

/**
 * Manually unlock an account (for admin use)
 */
export function unlockAccount(identifier) {
  failedAttempts.delete(identifier);
  lockedAccounts.delete(identifier);
  return { success: true, message: 'Account unlocked' };
}

/**
 * Get all locked accounts (for monitoring)
 */
export function getLockedAccounts() {
  const now = Date.now();
  const locked = [];
  
  for (const [identifier, lockInfo] of lockedAccounts.entries()) {
    if (now < lockInfo.lockedUntil) {
      locked.push({
        identifier,
        lockedAt: lockInfo.lockedAt,
        lockedUntil: lockInfo.lockedUntil,
        attempts: lockInfo.attempts,
        remainingTime: Math.ceil((lockInfo.lockedUntil - now) / 1000),
      });
    }
  }
  
  return locked;
}

/**
 * Clean up expired locks (run periodically)
 */
export function cleanupExpiredLocks() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [identifier, lockInfo] of lockedAccounts.entries()) {
    if (now >= lockInfo.lockedUntil) {
      lockedAccounts.delete(identifier);
      failedAttempts.delete(identifier);
      cleaned++;
    }
  }
  
  return { cleaned };
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredLocks, 5 * 60 * 1000);
}
