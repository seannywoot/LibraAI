# Idle Timeout Feature

## Overview
Automatic logout after 30 minutes of user inactivity with a 2-minute warning before logout.

## User Experience

### Normal Activity
- User logs in and uses the application
- Activity is tracked automatically (mouse, keyboard, touch, scroll)
- Session remains active as long as user interacts with the page
- No interruptions or notifications

### Approaching Idle Timeout
After 28 minutes of inactivity:
1. **Warning Modal Appears**
   - Shows countdown timer (2:00, 1:59, 1:58...)
   - Clear message about inactivity
   - Two action buttons

2. **User Options**
   - **Stay Logged In**: Extends session, dismisses warning, resets idle timer
   - **Log Out Now**: Immediately logs out and redirects to login
   - **Do Nothing**: Automatic logout after countdown reaches 0:00

### After Automatic Logout
- User is redirected to login page
- Blue notification banner explains: "You were logged out due to inactivity for security reasons."
- User can log back in normally

## Technical Implementation

### Activity Tracking
Events monitored:
- `mousedown` - Mouse clicks
- `mousemove` - Mouse movement
- `keypress` - Keyboard input
- `scroll` - Page scrolling
- `touchstart` - Touch interactions
- `click` - Click events

Activity updates are throttled to once per second to prevent performance issues.

### Timing
- **Idle Timeout**: 30 minutes (1,800,000 ms)
- **Warning Display**: 2 minutes before timeout (120,000 ms)
- **Check Interval**: Every 30 seconds
- **Activity Throttle**: 1 second

### Storage
Uses `sessionStorage` to track:
- `session-start`: Timestamp when user logged in
- `last-activity`: Timestamp of last user activity

Data is automatically cleared on logout.

## Configuration

Edit `src/lib/session-handler.js`:

```javascript
const SESSION_CONFIG = {
  MAX_AGE: 24 * 60 * 60 * 1000,           // 24 hours
  IDLE_TIMEOUT: 30 * 60 * 1000,           // 30 minutes
  WARNING_BEFORE_LOGOUT: 2 * 60 * 1000,   // 2 minutes
};
```

### Recommended Settings by Use Case

**High Security (Banking, Healthcare)**
```javascript
IDLE_TIMEOUT: 5 * 60 * 1000,            // 5 minutes
WARNING_BEFORE_LOGOUT: 1 * 60 * 1000,   // 1 minute
```

**Standard Security (Current)**
```javascript
IDLE_TIMEOUT: 30 * 60 * 1000,           // 30 minutes
WARNING_BEFORE_LOGOUT: 2 * 60 * 1000,   // 2 minutes
```

**Low Security (Internal Tools)**
```javascript
IDLE_TIMEOUT: 60 * 60 * 1000,           // 60 minutes
WARNING_BEFORE_LOGOUT: 5 * 60 * 1000,   // 5 minutes
```

## Files Modified

### New Files
- `src/components/idle-timeout-warning.jsx` - Warning modal component
- `scripts/test-idle-timeout.js` - Test simulation script

### Modified Files
- `src/lib/session-handler.js` - Added idle tracking functions
- `src/components/SessionProvider.jsx` - Added activity tracking and idle checks
- `src/app/auth/page.js` - Added logout reason notification
- `docs/SESSION_MANAGEMENT.md` - Updated documentation

## Security Benefits

### Protects Against
- **Unattended Sessions**: Automatically logs out users who leave their computer
- **Shoulder Surfing**: Reduces window of opportunity for unauthorized viewing
- **Session Hijacking**: Limits exposure time of active sessions
- **Compliance Requirements**: Meets security standards for automatic logout

### Best Practices Implemented
- ✅ Clear warning before logout (no surprise logouts)
- ✅ User control (can extend session)
- ✅ Transparent communication (explains why logged out)
- ✅ Configurable timeouts (can adjust per requirements)
- ✅ Activity-based (only logs out truly idle users)
- ✅ Performance optimized (throttled activity tracking)

## Accessibility

### Keyboard Navigation
- Warning modal is keyboard accessible
- Tab through buttons
- Enter/Space to activate buttons
- Escape key could be added to dismiss (extend session)

### Screen Readers
- Modal has proper ARIA labels
- Countdown is announced
- Clear button labels
- Semantic HTML structure

### Visual Design
- High contrast colors
- Large, readable text
- Clear iconography
- Prominent action buttons

## Testing Checklist

- [ ] Login and remain active - no warning appears
- [ ] Login and go idle for 28 minutes - warning appears
- [ ] Click "Stay Logged In" - warning dismisses, session extends
- [ ] Click "Log Out Now" - immediately logs out
- [ ] Do nothing during warning - auto logout after 2 minutes
- [ ] After auto logout - see inactivity message on login page
- [ ] Activity tracking - mouse/keyboard/scroll resets timer
- [ ] Multiple tabs - activity in one tab affects all tabs (same session)
- [ ] Browser refresh - session persists, activity tracking continues
- [ ] Close browser - session ends (sessionStorage cleared)

## Troubleshooting

### Warning appears too frequently
- Increase `IDLE_TIMEOUT` value
- Check if activity events are being captured
- Verify throttling is working correctly

### Warning never appears
- Check browser console for errors
- Verify `SessionProvider` is wrapping the app
- Check if `sessionStorage` is available
- Ensure user is authenticated

### Activity not being tracked
- Check if event listeners are attached
- Verify events are firing (browser DevTools)
- Check throttling timeout
- Ensure `updateLastActivity()` is being called

### Session extends but warning reappears
- Check if `last-activity` is being updated in sessionStorage
- Verify `handleExtendSession` is calling `updateLastActivity()`
- Check for race conditions in interval timing

## Future Enhancements

### Potential Improvements
1. **Server-side validation**: Validate idle timeout on server
2. **Cross-tab synchronization**: Use BroadcastChannel API
3. **Configurable per user role**: Different timeouts for admin vs student
4. **Activity heatmap**: Track which features keep users active
5. **Smart timeout**: Adjust based on user behavior patterns
6. **Remember preference**: Let users set their preferred timeout
7. **Pause timeout**: Allow users to pause timeout for specific tasks
8. **Mobile optimization**: Different timeouts for mobile devices

### Analytics to Track
- Average idle time before warning
- Percentage of users who extend vs logout
- Most common time of day for idle timeouts
- Correlation between idle timeouts and user satisfaction

## Compliance

This feature helps meet requirements for:
- **HIPAA**: Automatic logoff (§164.312(a)(2)(iii))
- **PCI DSS**: Session timeout (Requirement 8.1.8)
- **NIST**: Session management (SP 800-63B)
- **SOC 2**: Access control and session management
- **GDPR**: Security of processing (Article 32)
