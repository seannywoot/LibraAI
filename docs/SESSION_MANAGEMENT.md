# Session Management

## Overview
The application includes comprehensive session management with automatic logout after inactivity, session expiration, and proper cleanup to ensure security.

## Key Features

### 1. Session Expiration
- Sessions expire after **24 hours** from login
- JWT tokens are configured with a 24-hour maximum age
- Session cookies are set to expire after 24 hours

### 2. Idle Timeout (NEW)
- Users are automatically logged out after **30 minutes of inactivity**
- Activity is tracked through mouse, keyboard, touch, and scroll events
- Warning shown **2 minutes before** automatic logout
- Users can extend their session by clicking "Stay Logged In"

### 3. Automatic Session Validation
- Sessions are validated every 30 seconds on the client side
- Expired sessions trigger automatic logout
- Idle sessions trigger automatic logout
- Session age and activity are tracked in sessionStorage

### 4. Session Cleanup
- Session storage is cleared on logout
- Auth-related localStorage items are removed
- Cookies are properly invalidated

## Configuration

### NextAuth Settings (src/app/api/auth/[...nextauth]/route.js)
```javascript
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours
  updateAge: 60 * 60, // Update session every 1 hour
}
```

### Cookie Settings
- `httpOnly: true` - Prevents JavaScript access to cookies
- `sameSite: 'lax'` - CSRF protection
- `secure: true` (in production) - HTTPS only
- `maxAge: 24 hours` - Cookie expiration

## Components

### SessionProvider (src/components/SessionProvider.jsx)
Wraps the application and provides:
- Session validation every 30 seconds
- Activity tracking (mouse, keyboard, touch, scroll)
- Automatic logout on expiration or idle timeout
- Idle warning modal display
- Session storage cleanup

### IdleTimeoutWarning (src/components/idle-timeout-warning.jsx)
Modal component that:
- Shows countdown timer before logout
- Allows users to extend their session
- Provides option to logout immediately
- Displays clear messaging about inactivity

### Session Handler (src/lib/session-handler.js)
Utility functions for:
- `clearSessionStorage()` - Clears session data
- `markSessionStart()` - Tracks session start time
- `isSessionExpired()` - Checks if session is expired (24 hours)
- `getSessionAge()` - Returns session age in milliseconds
- `updateLastActivity()` - Updates last activity timestamp
- `getLastActivity()` - Gets last activity timestamp
- `getIdleTime()` - Returns time since last activity
- `isIdle()` - Checks if user has been idle too long (30 minutes)
- `shouldShowIdleWarning()` - Checks if warning should be shown (2 minutes before timeout)
- `getTimeUntilIdleLogout()` - Returns milliseconds until idle logout
- `getIdleTimeoutConfig()` - Returns configuration values

## How It Works

### Session Lifecycle

1. **On Login**: 
   - Session start time is recorded in sessionStorage
   - Last activity timestamp is initialized
   - Activity tracking begins

2. **During Active Session**: 
   - User activity (mouse, keyboard, touch, scroll) updates the last activity timestamp
   - Activity updates are throttled to once per second to avoid performance issues
   - Every 30 seconds, the system checks:
     - Has the session expired (24 hours)?
     - Has the user been idle too long (30 minutes)?
     - Should we show an idle warning (2 minutes before timeout)?

3. **Idle Warning**:
   - Modal appears 2 minutes before automatic logout
   - Shows countdown timer
   - User can click "Stay Logged In" to extend session
   - User can click "Log Out Now" to logout immediately
   - If no action taken, automatic logout occurs

4. **On Expiration/Idle Timeout**: 
   - User is automatically logged out
   - Redirected to login with reason parameter
   - Notification explains why they were logged out

5. **On Logout**: 
   - All session data is cleared from storage and cookies
   - Activity tracking stops

## Configuration

You can adjust the timeout values in `src/lib/session-handler.js`:

```javascript
const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000,           // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000,           // 30 minutes of inactivity
  WARNING_BEFORE_LOGOUT: 2 * 60 * 1000,   // Show warning 2 minutes before
};
```

## Testing

### Test Session Expiration (24 hours):
1. Login to the application
2. Wait 24 hours (or modify `MAX_AGE` to a shorter duration for testing)
3. The system will automatically log you out
4. You'll see "Your session has expired" message on login page

### Test Idle Timeout (30 minutes):
1. Login to the application
2. Don't interact with the page for 28 minutes
3. A warning modal will appear with a 2-minute countdown
4. Options:
   - Click "Stay Logged In" to extend session
   - Click "Log Out Now" to logout immediately
   - Do nothing and be automatically logged out after 2 minutes
5. After logout, you'll see "You were logged out due to inactivity" message

### Test Activity Tracking:
1. Login to the application
2. Move your mouse, type, scroll, or touch the screen
3. These activities reset the idle timer
4. Open browser console and check sessionStorage for `last-activity` timestamp
5. It should update as you interact with the page

### Quick Testing (Development):
For faster testing, temporarily modify the config:
```javascript
const SESSION_CONFIG = {
  MAX_AGE: 5 * 60 * 1000,                 // 5 minutes
  IDLE_TIMEOUT: 2 * 60 * 1000,            // 2 minutes
  WARNING_BEFORE_LOGOUT: 30 * 1000,       // 30 seconds warning
};
```

## Security Benefits

- Prevents indefinite session persistence
- Reduces risk of unauthorized access from abandoned sessions
- Ensures sessions don't survive PC restarts beyond the expiration time
- Protects against session hijacking with proper cookie settings

## Related Security Features

This session management system works alongside other security features:
- **Brute Force Protection**: See [BRUTE_FORCE_PROTECTION.md](./BRUTE_FORCE_PROTECTION.md) for details on login attempt limiting and account lockouts
