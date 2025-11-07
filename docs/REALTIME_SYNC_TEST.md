# Real-Time Sync Testing Checklist

## ✅ Implementation Status

All components are properly implemented for real-time sync of:
- Theme (dark/light mode)
- Profile name
- Email notifications

## Test Scenarios

### 1. Same Browser - Instant Sync (0ms delay)

#### Test Theme Sync
- [ ] Open two tabs with the app
- [ ] Toggle dark mode in Tab 1
- [ ] Verify Tab 2 updates instantly (within 100ms)
- [ ] Toggle back to light mode in Tab 1
- [ ] Verify Tab 2 updates instantly

#### Test Name Sync
- [ ] Open two tabs with the app
- [ ] Go to Profile page in Tab 1
- [ ] Change name and click "Save changes"
- [ ] Check Tab 2 sidebar - name should update instantly
- [ ] Check Tab 2 dashboard header - name should update instantly

#### Test Email Notifications Sync
- [ ] Open two tabs with the app
- [ ] Go to Profile page in Tab 1
- [ ] Toggle email notifications and click "Save changes"
- [ ] Go to Profile page in Tab 2
- [ ] Verify checkbox reflects the new state instantly

### 2. Cross-Browser Sync (15 second delay)

#### Test Theme Sync Across Browsers
- [ ] Open app in Chrome
- [ ] Open app in Firefox (or another browser)
- [ ] Toggle dark mode in Chrome
- [ ] Wait 15 seconds
- [ ] Verify Firefox updates to dark mode
- [ ] Toggle back to light in Chrome
- [ ] Wait 15 seconds
- [ ] Verify Firefox updates to light mode

#### Test Name Sync Across Browsers
- [ ] Open app in Chrome
- [ ] Open app in Firefox
- [ ] Change name in Chrome profile page
- [ ] Wait 15 seconds
- [ ] Check Firefox sidebar - name should update
- [ ] Check Firefox dashboard - name should update

#### Test Email Notifications Sync Across Browsers
- [ ] Open app in Chrome
- [ ] Open app in Firefox
- [ ] Toggle email notifications in Chrome
- [ ] Wait 15 seconds
- [ ] Open Firefox profile page
- [ ] Verify checkbox reflects the new state

### 3. Visibility Optimization

#### Test Polling Stops in Background
- [ ] Open app in browser
- [ ] Open DevTools Network tab
- [ ] Switch to another tab (make app tab hidden)
- [ ] Wait 10 seconds
- [ ] Verify no `/api/user/profile` requests in Network tab
- [ ] Switch back to app tab
- [ ] Verify immediate sync request appears

### 4. Persistence After Logout/Login

#### Test Theme Persistence
- [ ] Toggle to dark mode
- [ ] Sign out
- [ ] Sign back in
- [ ] Verify dark mode is still active

#### Test Name Persistence
- [ ] Change name in profile
- [ ] Sign out
- [ ] Sign back in
- [ ] Verify name is updated in sidebar

#### Test Email Notifications Persistence
- [ ] Toggle email notifications off
- [ ] Sign out
- [ ] Sign back in
- [ ] Open profile page
- [ ] Verify checkbox is unchecked

## Implementation Details

### Components Involved

1. **UserPreferencesContext** (`src/contexts/UserPreferencesContext.js`)
   - ✅ Manages name and emailNotifications state
   - ✅ Listens to localStorage storage events
   - ✅ Provides updatePreferences() method

2. **ThemeContext** (`src/contexts/ThemeContext.js`)
   - ✅ Manages dark mode state
   - ✅ Listens to localStorage storage events
   - ✅ Provides setDarkModePreference() and toggleDarkMode()

3. **SessionProvider** (`src/components/SessionProvider.jsx`)
   - ✅ Polls `/api/user/profile` every 15 seconds
   - ✅ Only polls when tab is visible
   - ✅ Syncs theme, name, and emailNotifications
   - ✅ Updates both contexts

4. **Profile Pages** (`src/app/student/profile/page.js`, `src/app/admin/profile/page.js`)
   - ✅ Use useUserPreferences() to receive updates
   - ✅ Broadcast changes via updatePreferences()
   - ✅ Store in localStorage for same-browser sync
   - ✅ Save to database for cross-browser sync

5. **DashboardSidebar** (`src/components/dashboard-sidebar.jsx`)
   - ✅ Uses useUserPreferences() for name
   - ✅ Updates avatar initial automatically

6. **ClientUserName** (`src/components/ClientUserName.jsx`)
   - ✅ Uses useUserPreferences() for name
   - ✅ Used in dashboard headers

7. **Root Layout** (`src/app/layout.js`)
   - ✅ Wraps app with UserPreferencesProvider
   - ✅ Proper provider hierarchy

### API Endpoint

**`/api/user/profile`** (`src/app/api/user/profile/route.js`)
- ✅ GET: Returns user preferences (name, emailNotifications, theme)
- ✅ PUT: Accepts partial updates (any combination of fields)
- ✅ Validates name only if provided
- ✅ Returns updated values

## Expected Behavior

### Same Browser
- **Instant sync** via localStorage storage events
- All tabs update within 100ms
- No server requests needed

### Different Browsers
- **15-second sync** via database polling
- Only polls when tab is visible
- Syncs immediately when tab becomes visible
- Minimal server load

### Performance
- ~15 requests/second with 100 concurrent users
- Simple indexed MongoDB queries
- Minimal response payload
- Efficient localStorage caching

## Troubleshooting

### Name not updating in sidebar
- Check browser console for errors
- Verify UserPreferencesProvider is in layout.js
- Check localStorage has "userPreferences" key
- Verify SessionProvider is polling (Network tab)

### Theme not syncing
- Check localStorage has "theme" key
- Verify ThemeProvider is in layout.js
- Check SessionProvider is running
- Verify /api/user/profile returns theme field

### Cross-browser sync not working
- Verify both browsers are logged in as same user
- Check Network tab for /api/user/profile requests
- Verify tab is visible (not in background)
- Wait full 15 seconds for sync

### Polling not stopping in background
- Check document.hidden in console
- Verify visibilitychange event listener is attached
- Check SessionProvider implementation
