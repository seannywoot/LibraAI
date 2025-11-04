# Brute Force Protection

## Overview
The application includes comprehensive brute force protection to prevent unauthorized access through repeated login attempts. This system automatically locks accounts after multiple failed login attempts and provides progressive delays to slow down attackers.

## Key Features

### 1. Failed Attempt Tracking
- Tracks failed login attempts per email address
- Monitors attempts within a 15-minute rolling window
- Automatically cleans up expired tracking data

### 2. Account Lockout
- **Maximum Attempts**: 5 failed attempts before lockout
- **Lockout Duration**: 15 minutes
- **Automatic Unlock**: Accounts automatically unlock after the lockout period expires

### 3. Progressive Delays
After each failed attempt, the system adds increasing delays:
- 1st attempt: 1 second delay
- 2nd attempt: 2 seconds delay
- 3rd attempt: 4 seconds delay
- 4th attempt: 8 seconds delay
- 5th attempt: 16 seconds delay (then locked)

This makes brute force attacks exponentially slower.

### 4. User Feedback
Users receive clear feedback about:
- Number of remaining attempts before lockout
- Account lockout status
- Time remaining until unlock

### 5. Admin Management
Admins can:
- View all currently locked accounts
- Manually unlock accounts
- Monitor security metrics
- Access security dashboard at `/admin/security`

## Configuration

### Settings (src/lib/brute-force-protection.js)
```javascript
const CONFIG = {
  MAX_ATTEMPTS: 5,                    // Maximum failed attempts
  LOCKOUT_DURATION: 15 * 60 * 1000,   // 15 minutes
  ATTEMPT_WINDOW: 15 * 60 * 1000,     // Track attempts within 15 minutes
  PROGRESSIVE_DELAY: true,            // Enable progressive delays
};
```

## How It Works

### Login Flow
1. **Check Lock Status**: Before authentication, check if account is locked
2. **Authenticate**: Attempt to verify credentials
3. **On Success**: Clear all failed attempts for that account
4. **On Failure**: 
   - Record the failed attempt
   - Check if max attempts reached
   - If locked, return lockout error with time remaining
   - If not locked, return error with remaining attempts
   - Apply progressive delay if configured

### Error Messages
The system provides specific error messages:

**Account Locked:**
```
🔒 Account temporarily locked due to multiple failed login attempts. 
Please try again in X minutes.
```

**Failed Attempt (not locked yet):**
```
❌ Invalid credentials. You have X attempts remaining before your 
account is temporarily locked.
```

## API Endpoints

### GET /api/admin/security/locked-accounts
Get all currently locked accounts (admin only)

**Response:**
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

### POST /api/admin/security/locked-accounts
Manage locked accounts (admin only)

**Unlock Account:**
```json
{
  "action": "unlock",
  "identifier": "user@example.com"
}
```

**Check Attempt Count:**
```json
{
  "action": "check",
  "identifier": "user@example.com"
}
```

## Admin Dashboard

Access the security dashboard at `/admin/security` to:
- View all locked accounts in real-time
- See lockout details (attempts, time remaining)
- Manually unlock accounts
- Monitor security settings

## Security Benefits

### Protection Against:
- **Brute Force Attacks**: Limits attempts and adds delays
- **Credential Stuffing**: Prevents rapid testing of stolen credentials
- **Dictionary Attacks**: Makes automated attacks impractical
- **Distributed Attacks**: Tracks per-account, not per-IP

### Best Practices Implemented:
- ✅ Progressive delays slow down attackers
- ✅ Temporary lockouts prevent unlimited attempts
- ✅ Clear user feedback prevents confusion
- ✅ Admin controls for legitimate lockouts
- ✅ Automatic cleanup of expired data
- ✅ Rolling time window for attempt tracking

## Testing

### Test Account Lockout:
1. Go to the login page
2. Enter an email address
3. Enter incorrect password 5 times
4. Observe the lockout message
5. Wait 15 minutes or have an admin unlock the account

### Test Progressive Delays:
1. Make failed login attempts
2. Notice increasing response times
3. Each attempt takes longer than the previous

### Test Admin Unlock:
1. Lock an account (5 failed attempts)
2. Login as admin
3. Go to `/admin/security`
4. Click "Unlock" on the locked account
5. Verify the account can now login

## Production Considerations

### Current Implementation:
- Uses in-memory storage (Map objects)
- Data is lost on server restart
- Suitable for single-server deployments

### For Production at Scale:
Consider upgrading to Redis or similar for:
- Persistent storage across restarts
- Shared state across multiple servers
- Better performance at scale
- Advanced features (rate limiting, etc.)

### Example Redis Integration:
```javascript
// Replace Map with Redis
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function recordFailedAttempt(identifier) {
  const key = `failed_attempts:${identifier}`;
  await redis.zadd(key, Date.now(), Date.now());
  await redis.expire(key, 900); // 15 minutes
  // ... rest of logic
}
```

## Monitoring

### Metrics to Track:
- Number of locked accounts per day
- Average failed attempts before success
- Most frequently locked accounts
- Peak lockout times

### Alerts to Configure:
- Unusual spike in failed attempts
- Same account locked repeatedly
- Multiple accounts locked from same IP
- Lockout rate exceeding threshold

## Compliance

This implementation helps meet security requirements for:
- **OWASP**: Authentication best practices
- **PCI DSS**: Account lockout requirements
- **NIST**: Password security guidelines
- **GDPR**: Security of processing (Article 32)
