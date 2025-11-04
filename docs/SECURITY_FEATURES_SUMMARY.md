# Security Features Summary

## Quick Reference

### 1. Session Management
**Location**: `src/lib/session-handler.js`, `src/components/SessionProvider.jsx`

| Feature | Setting | Description |
|---------|---------|-------------|
| Session Expiration | 24 hours | Maximum session lifetime |
| Idle Timeout | 30 minutes | Auto-logout after inactivity |
| Idle Warning | 2 minutes | Warning before idle logout |
| Validation Check | 30 seconds | How often to check session status |

**User Impact**: 
- Logged out after 24 hours regardless of activity
- Logged out after 30 minutes of inactivity
- Warning shown 2 minutes before idle logout

**Documentation**: [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md), [IDLE_TIMEOUT_FEATURE.md](./IDLE_TIMEOUT_FEATURE.md)

---

### 2. Brute Force Protection
**Location**: `src/lib/brute-force-protection.js`, `src/app/api/auth/[...nextauth]/route.js`

| Feature | Setting | Description |
|---------|---------|-------------|
| Max Attempts | 5 attempts | Failed logins before lockout |
| Lockout Duration | 15 minutes | How long account stays locked |
| Attempt Window | 15 minutes | Time window for tracking attempts |
| Progressive Delays | Enabled | Increasing delays after each failure |

**User Impact**:
- Account locked after 5 failed login attempts
- Must wait 15 minutes or contact admin to unlock
- Each failed attempt adds delay (1s, 2s, 4s, 8s, 16s)
- Clear feedback on remaining attempts

**Admin Tools**: `/admin/security` - View and unlock accounts

**Documentation**: [BRUTE_FORCE_PROTECTION.md](./BRUTE_FORCE_PROTECTION.md)

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Login                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  Brute Force Check     │◄─── Track failed attempts
         │  - Account locked?     │     per email address
         │  - Too many attempts?  │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Authenticate          │
         │  - Verify credentials  │
         │  - Check role match    │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Create Session        │
         │  - JWT token (24h)     │
         │  - Session cookie      │
         │  - Track start time    │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Active Session        │
         │  - Track activity      │◄─── Mouse, keyboard,
         │  - Check idle time     │     touch, scroll events
         │  - Validate every 30s  │
         └────────┬───────────────┘
                  │
                  ├─── Idle 28 min ──► Show Warning ──┬─► Stay Logged In
                  │                                     │
                  ├─── Idle 30 min ──► Auto Logout ────┤
                  │                                     │
                  └─── Age 24 hours ─► Auto Logout ────┤
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  Cleanup        │
                                              │  - Clear tokens │
                                              │  - Clear storage│
                                              └─────────────────┘
```

---

## Configuration Files

### Session Timeouts
**File**: `src/lib/session-handler.js`
```javascript
const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000,           // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000,           // 30 minutes
  WARNING_BEFORE_LOGOUT: 2 * 60 * 1000,   // 2 minutes
};
```

### Brute Force Settings
**File**: `src/lib/brute-force-protection.js`
```javascript
const CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000,       // 15 minutes
  ATTEMPT_WINDOW: 15 * 60 * 1000,         // 15 minutes
  PROGRESSIVE_DELAY: true,
};
```

### NextAuth Session
**File**: `src/app/api/auth/[...nextauth]/route.js`
```javascript
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60,                   // 24 hours
  updateAge: 60 * 60,                     // 1 hour
}
```

---

## API Endpoints

### Session Management
- No public API endpoints (client-side only)

### Brute Force Protection
- `GET /api/admin/security/locked-accounts` - List locked accounts (admin)
- `POST /api/admin/security/locked-accounts` - Unlock account (admin)

---

## Testing Commands

```bash
# Test brute force protection
node scripts/test-brute-force.js

# Test idle timeout (simulation)
node scripts/test-idle-timeout.js
```

---

## User-Facing Messages

### Session Expiration
> "Your session has expired. Please sign in again."

### Idle Timeout
> "You were logged out due to inactivity for security reasons."

### Account Locked
> "🔒 Account temporarily locked due to multiple failed login attempts. Please try again in X minutes."

### Failed Login (with attempts remaining)
> "❌ Invalid credentials. You have X attempts remaining before your account is temporarily locked."

### Idle Warning
> "Your session will expire in 2:00"
> "Click 'Stay Logged In' to continue your session, or you'll be automatically logged out for security."

---

## Security Best Practices Implemented

✅ **Session Management**
- Automatic expiration after 24 hours
- Idle timeout after 30 minutes
- Activity-based session extension
- Secure cookie configuration (httpOnly, sameSite, secure)
- Client-side validation with server-side enforcement

✅ **Brute Force Protection**
- Account lockout after failed attempts
- Progressive delays to slow attacks
- Time-based attempt tracking
- Admin unlock capability
- Clear user feedback

✅ **User Experience**
- Warning before automatic logout
- Clear error messages
- Transparent security measures
- User control (extend session)
- Accessibility compliant

✅ **Compliance**
- HIPAA automatic logoff
- PCI DSS session timeout
- NIST session management
- SOC 2 access control
- GDPR security of processing

---

## Monitoring Recommendations

### Metrics to Track
1. **Session Management**
   - Average session duration
   - Idle timeout frequency
   - Warning dismissal rate
   - Session extension frequency

2. **Brute Force Protection**
   - Failed login attempts per day
   - Account lockouts per day
   - Most targeted accounts
   - Attack patterns and timing

### Alerts to Configure
1. **High Priority**
   - Unusual spike in failed logins (>100/hour)
   - Same account locked repeatedly (>3 times/day)
   - Multiple accounts locked from same IP

2. **Medium Priority**
   - Lockout rate exceeding 5% of login attempts
   - Average idle timeout rate increasing
   - Session expiration complaints

3. **Low Priority**
   - Weekly security metrics summary
   - Monthly compliance report
   - Quarterly security review

---

## Production Considerations

### Current Implementation
- ✅ In-memory storage for brute force tracking
- ✅ SessionStorage for client-side tracking
- ✅ JWT tokens for authentication
- ✅ Single-server deployment ready

### For Scale (Future)
- 🔄 Redis for distributed brute force tracking
- 🔄 Database-backed session management
- 🔄 Load balancer session affinity
- 🔄 Centralized logging and monitoring
- 🔄 Rate limiting at API gateway level

---

## Quick Troubleshooting

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Users logged out too frequently | Idle timeout too short | Increase `IDLE_TIMEOUT` |
| Warning appears during active use | Activity not tracked | Check event listeners |
| Account stays locked after 15 min | Server restart | Use Redis for persistence |
| Session persists after PC restart | Cookie not expiring | Check cookie `maxAge` setting |
| Brute force not working | In-memory data lost | Implement Redis storage |

---

## Related Documentation

- [SESSION_MANAGEMENT.md](./SESSION_MANAGEMENT.md) - Detailed session management
- [IDLE_TIMEOUT_FEATURE.md](./IDLE_TIMEOUT_FEATURE.md) - Idle timeout specifics
- [BRUTE_FORCE_PROTECTION.md](./BRUTE_FORCE_PROTECTION.md) - Brute force details

---

**Last Updated**: November 5, 2025
**Version**: 1.0.0
