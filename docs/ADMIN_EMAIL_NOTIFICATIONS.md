# Admin Email Notifications - Security Alerts

## Overview

The admin email notification system sends real-time security alerts to administrators for critical events like account lockouts, failed login spikes, and new device logins.

## Features

### 1. Account Lockout Notifications

**Trigger**: When an account is locked after 5 failed login attempts

**Subject**: `[Security] Account locked after failed logins`

**Information Included**:
- Account email and role
- Number of failed attempts
- Lock duration (15 minutes)
- Direct link to security dashboard

**Deduplication**: One email per account per lock window (15 minutes)

**Example Scenario**:
```
User: student@demo.edu
Role: student
Failed Attempts: 5
Lock Duration: 15 minutes
```

### 2. Failed Login Spike Detection

**Trigger**: When failed login attempts exceed threshold (default: 100/hour)

**Subject**: `[Security] Spike in failed logins (X/hour)`

**Information Included**:
- Total failed attempts in the time window
- Top 5 targeted accounts with attempt counts
- Top 5 source IP addresses with attempt counts
- Direct link to security dashboard

**Deduplication**: One email per hour

**Threshold**: Configurable (default: 100 attempts per hour)

**Example Scenario**:
```
Failed Attempts: 150 in 1 hour
Top Accounts:
  - student@demo.edu (45)
  - admin@libra.ai (30)
  - test@example.com (25)
Top IPs:
  - 192.168.1.100 (60)
  - 10.0.0.50 (40)
```

### 3. New Admin Login Environment

**Trigger**: Admin login from new device/IP/browser combination

**Subject**: `[Security] New admin login environment detected`

**Information Included**:
- Admin account email
- Login timestamp
- IP address
- Browser and operating system
- Approximate location (if available)
- Approve/Report links

**Deduplication**: One email per device per day

**Device Fingerprint**: Combination of email + IP + browser family

**Example Scenario**:
```
Account: admin@libra.ai
Time: Nov 6, 2025, 2:30 PM
IP: 203.0.113.45
Browser: Chrome
OS: Windows
Location: Unknown
```

## Configuration

### Environment Variables

Add to your `.env.local` file:

```bash
# Base URL for links in emails
NEXTAUTH_URL=http://localhost:3000

# EmailJS configuration (already set)
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_TEMPLATE_ID=template_n9lg1lh
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
EMAIL_FROM="LibraAI <libraaismartlibraryassistant@gmail.com>"

# Optional: Fallback admin email if no admins in database
ADMIN_EMAIL=admin@libra.ai
```

### Admin Recipients

The system automatically sends notifications to **all admin users** in the database who have email notifications enabled.

**How it works:**
1. Queries `users` collection for `role: 'admin'`
2. Filters for users with `emailNotifications: true` (or undefined, which defaults to enabled)
3. Sends notification to all matching admin emails
4. Falls back to `ADMIN_EMAIL` env var if no admins found in database

### Notification Settings

Default configuration (can be modified in `src/lib/security-notifications.js`):

```javascript
const CONFIG = {
  // Account lockout
  LOCKOUT_DEDUPE_WINDOW: 15 * 60 * 1000, // 15 minutes
  
  // Failed login spike
  SPIKE_THRESHOLD: 100, // Attempts per hour
  SPIKE_TIME_WINDOW: 60 * 60 * 1000, // 1 hour
  SPIKE_CHECK_INTERVAL: 5 * 60 * 1000, // Check every 5 minutes
  SPIKE_DEDUPE_WINDOW: 60 * 60 * 1000, // One alert per hour
  
  // New device
  DEVICE_DEDUPE_WINDOW: 24 * 60 * 60 * 1000, // One email per day
};
```

## API Endpoints

### Get Locked Accounts

```bash
GET /api/admin/security/locked-accounts
```

**Response**:
```json
{
  "success": true,
  "lockedAccounts": [
    {
      "identifier": "user@example.com",
      "lockedAt": 1699564800000,
      "lockedUntil": 1699565700000,
      "attempts": 5,
      "remainingTime": 900
    }
  ],
  "count": 1
}
```

### Unlock Account

```bash
POST /api/admin/security/locked-accounts
Content-Type: application/json

{
  "action": "unlock",
  "identifier": "user@example.com"
}
```

### Check Failed Login Spike

```bash
GET /api/admin/security/check-spike
```

**Response**:
```json
{
  "success": true,
  "spike": true,
  "count": 150,
  "sent": true
}
```

### Get Notification Config

```bash
GET /api/admin/security/notifications
```

**Response**:
```json
{
  "success": true,
  "config": {
    "adminEmail": "admin@libra.ai",
    "spikeThreshold": 100,
    "spikeTimeWindow": 60,
    "lockoutDedupeWindow": 15,
    "deviceDedupeWindow": 24
  }
}
```

### Update Notification Config

```bash
POST /api/admin/security/notifications
Content-Type: application/json

{
  "adminEmail": "security@libra.ai",
  "spikeThreshold": 150
}
```

## Email Templates

All email templates are defined in `src/lib/admin-email-templates.js`:

1. **Account Lockout Email** - Red theme, urgent tone
2. **Failed Login Spike Email** - Orange theme, warning tone
3. **New Admin Login Email** - Blue theme, informational tone

Each template includes:
- HTML version with styled layout
- Plain text version for email clients
- Template parameters for EmailJS

## Testing

### Test Account Lockout Notification

1. Set your admin email in `.env.local`:
   ```bash
   ADMIN_EMAIL=your-email@example.com
   ```

2. Attempt to login with wrong password 5 times:
   ```bash
   # Use any email address
   Email: test@example.com
   Password: wrong (5 times)
   ```

3. Check your email inbox for lockout notification

### Test Failed Login Spike

1. Simulate multiple failed logins:
   ```bash
   # Run this script or use a tool to make 100+ failed login attempts
   for i in {1..110}; do
     curl -X POST http://localhost:3000/api/auth/callback/credentials \
       -d "email=test$i@example.com&password=wrong"
   done
   ```

2. Wait up to 5 minutes for automatic spike check

3. Or manually trigger:
   ```bash
   curl http://localhost:3000/api/admin/security/check-spike
   ```

4. Check your email for spike notification

### Test New Admin Device Login

1. Login as admin from a new browser or clear cookies:
   ```bash
   Email: admin@libra.ai
   Password: ManageStacks!
   ```

2. Check admin email for new device notification

3. Subsequent logins from same device won't trigger notification for 24 hours

## Deduplication Logic

### Why Deduplication?

Prevents email spam by limiting notification frequency:

- **Account Lockout**: One email per account per lock window
  - Prevents multiple emails if user keeps trying
  - Resets after lock expires (15 minutes)

- **Failed Login Spike**: One email per hour
  - Prevents flooding during sustained attacks
  - Admins get hourly updates during ongoing attacks

- **New Device Login**: One email per device per day
  - Prevents notification on every login
  - Allows admins to track new devices without spam

### How It Works

Uses in-memory Map to track sent notifications:

```javascript
const sentNotifications = new Map();

function wasRecentlySent(key, dedupeWindow) {
  const lastSent = sentNotifications.get(key);
  if (!lastSent) return false;
  
  const now = Date.now();
  return (now - lastSent < dedupeWindow);
}
```

**Keys**:
- Lockout: `lockout:${email}`
- Spike: `spike:global`
- Device: `newdevice:${email}:${ip}:${browser}`

## Security Dashboard Integration

The security dashboard at `/admin/security` provides:

- List of currently locked accounts
- Manual unlock functionality
- Security metrics and statistics
- Links from email notifications

**Note**: Security dashboard page needs to be created separately.

## Production Considerations

### Current Implementation

- Uses in-memory storage (Map objects)
- Data lost on server restart
- Suitable for single-server deployments

### For Production at Scale

Consider upgrading to Redis:

```javascript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Store sent notifications
await redis.setex(`notification:${key}`, dedupeWindow / 1000, '1');

// Check if sent
const exists = await redis.exists(`notification:${key}`);
```

### Multiple Admin Recipients

To send to multiple admins, modify `getAdminEmails()` in `src/lib/security-notifications.js`:

```javascript
async function getAdminEmails() {
  const client = await clientPromise;
  const db = client.db();
  
  const admins = await db.collection('users')
    .find({ 
      role: 'admin',
      emailNotifications: true 
    })
    .toArray();
  
  return admins.map(admin => admin.email);
}
```

## File Structure

```
src/
├── lib/
│   ├── admin-email-templates.js      # Email HTML/text templates
│   ├── security-notifications.js     # Notification logic & tracking
│   ├── email.js                      # EmailJS sender (existing)
│   └── brute-force-protection.js     # Lockout logic (existing)
├── app/
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.js          # Auth with notifications
│       └── admin/
│           └── security/
│               ├── locked-accounts/
│               │   └── route.js      # Locked accounts API
│               ├── check-spike/
│               │   └── route.js      # Manual spike check
│               └── notifications/
│                   └── route.js      # Config management
docs/
└── ADMIN_EMAIL_NOTIFICATIONS.md     # This file
```

## Troubleshooting

### No Emails Sent

1. **Check admin email configuration**:
   ```bash
   # Verify ADMIN_EMAIL is set
   echo $ADMIN_EMAIL
   ```

2. **Check EmailJS credentials**:
   ```bash
   # All should be set
   echo $EMAILJS_SERVICE_ID
   echo $EMAILJS_TEMPLATE_ID
   echo $EMAILJS_PRIVATE_KEY
   ```

3. **Check server logs**:
   ```bash
   # Look for notification messages
   [Security Notifications] Lockout notification sent to admin@libra.ai
   ```

### Emails Go to Spam

- Verify EmailJS sender reputation
- Check EMAIL_FROM address matches EmailJS config
- Add SPF/DKIM records (advanced)

### Too Many Notifications

- Adjust deduplication windows in config
- Increase spike threshold
- Review notification triggers

### Missing IP Address/User Agent

The auth flow needs to pass these from the client. Update your login form to include:

```javascript
await signIn('credentials', {
  email,
  password,
  expectedRole,
  ipAddress: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip),
  userAgent: navigator.userAgent,
});
```

## Monitoring

### Metrics to Track

- Number of lockout notifications sent per day
- Failed login spike frequency
- New device login rate
- Email delivery success rate

### Recommended Alerts

- Spike threshold exceeded multiple times per day
- Same account locked repeatedly
- Multiple new device logins for same admin
- Email delivery failures

## Compliance

This implementation helps meet security requirements:

- **OWASP**: Security logging and monitoring
- **PCI DSS**: Security event notification
- **NIST**: Incident response procedures
- **GDPR**: Security breach notification (Article 33)

## Next Steps

1. ✅ Email templates created
2. ✅ Notification system implemented
3. ✅ Auth integration complete
4. ✅ API endpoints created
5. ⏳ Create security dashboard UI
6. ⏳ Add IP geolocation service
7. ⏳ Implement Redis for production
8. ⏳ Add multiple admin recipient support

---

**All systems ready!** Configure `ADMIN_EMAIL` and test the notifications. 🎉
