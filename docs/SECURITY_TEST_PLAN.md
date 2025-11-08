# Route Security Test Plan

## Pre-Test Setup
1. Ensure the application is running
2. Open browser DevTools (F12)
3. Open Console tab to see protection logs
4. Have two browser windows ready (one for student, one for admin)

## Test Suite 1: Basic Authentication

### Test 1.1: Unauthenticated Access
**Steps:**
1. Logout if logged in
2. Navigate to `http://localhost:3000/admin/dashboard`

**Expected:**
- Redirects to `/auth`
- Console shows: `[MIDDLEWARE] No token and route requires auth, redirecting to auth`

### Test 1.2: Unauthenticated Student Route
**Steps:**
1. Logout if logged in
2. Navigate to `http://localhost:3000/student/library`

**Expected:**
- Redirects to `/auth`
- URL includes redirect parameter: `/auth?redirect=/student/library`

### Test 1.3: Auth Page When Authenticated
**Steps:**
1. Login as student
2. Navigate to `http://localhost:3000/auth`

**Expected:**
- Immediately redirects to `/student/dashboard`
- Console shows: `[AUTH PAGE] User already authenticated, redirecting to: /student/dashboard`

---

## Test Suite 2: Role-Based Access Control

### Test 2.1: Student Accessing Admin Route
**Steps:**
1. Login as student (`student@demo.edu`)
2. Navigate to `http://localhost:3000/admin/dashboard`

**Expected:**
- Redirects to `/student/dashboard`
- Console shows: `[MIDDLEWARE] Non-admin trying to access admin route`

### Test 2.2: Admin Accessing Student Route
**Steps:**
1. Login as admin (`admin@libra.ai`)
2. Navigate to `http://localhost:3000/student/library`

**Expected:**
- Redirects to `/admin/dashboard`
- Console shows: `[MIDDLEWARE] Admin trying to access student route`

### Test 2.3: Student Accessing Multiple Admin Routes
**Steps:**
1. Login as student
2. Try accessing:
   - `/admin/books`
   - `/admin/transactions`
   - `/admin/settings`

**Expected:**
- All redirect to `/student/dashboard`
- No admin content visible at any point

### Test 2.4: Admin Accessing Multiple Student Routes
**Steps:**
1. Login as admin
2. Try accessing:
   - `/student/books`
   - `/student/borrowed`
   - `/student/chat`

**Expected:**
- All redirect to `/admin/dashboard`
- No student content visible at any point

---

## Test Suite 3: Back Button Protection

### Test 3.1: Back Button After Login (Student)
**Steps:**
1. Logout completely
2. Login as student
3. Wait for redirect to `/student/dashboard`
4. Press browser back button

**Expected:**
- Should NOT return to login page
- Should stay on dashboard OR go to page before login
- Console may show: `[AUTH PAGE] Back button pressed while authenticated`

### Test 3.2: Back Button After Login (Admin)
**Steps:**
1. Logout completely
2. Login as admin
3. Wait for redirect to `/admin/dashboard`
4. Press browser back button

**Expected:**
- Should NOT return to login page
- Should stay on dashboard OR go to page before login

### Test 3.3: Back Button After Navigation (Student)
**Steps:**
1. Login as student
2. Navigate: Dashboard → Books → Library
3. Press back button twice

**Expected:**
- Goes: Library → Books → Dashboard
- Never shows login page

### Test 3.4: Back Button After Navigation (Admin)
**Steps:**
1. Login as admin
2. Navigate: Dashboard → Books → Transactions
3. Press back button twice

**Expected:**
- Goes: Transactions → Books → Dashboard
- Never shows login page

### Test 3.5: Rapid Back Button Clicking
**Steps:**
1. Login as student
2. Navigate through several pages
3. Rapidly click back button multiple times

**Expected:**
- No errors in console
- Never shows login page
- Never shows admin pages
- Stays within student panel

---

## Test Suite 4: Forward Button Protection

### Test 4.1: Forward Button After Back
**Steps:**
1. Login as student
2. Navigate: Dashboard → Books
3. Press back button (now on Dashboard)
4. Press forward button

**Expected:**
- Returns to Books page
- Stays within student panel

### Test 4.2: Cannot Forward to Wrong Panel
**Steps:**
1. Login as student
2. Try to access `/admin/dashboard` (gets redirected)
3. Press back button
4. Press forward button

**Expected:**
- Does NOT go to admin panel
- Stays in student panel

---

## Test Suite 5: URL Manipulation

### Test 5.1: Direct URL Entry (Student → Admin)
**Steps:**
1. Login as student
2. Manually type in address bar: `http://localhost:3000/admin/books`
3. Press Enter

**Expected:**
- Redirects to `/student/dashboard`
- Never shows admin content

### Test 5.2: Direct URL Entry (Admin → Student)
**Steps:**
1. Login as admin
2. Manually type in address bar: `http://localhost:3000/student/library`
3. Press Enter

**Expected:**
- Redirects to `/admin/dashboard`
- Never shows student content

### Test 5.3: URL with Query Parameters
**Steps:**
1. Login as student
2. Navigate to: `http://localhost:3000/admin/books?search=test`

**Expected:**
- Redirects to `/student/dashboard`
- Query parameters are ignored

---

## Test Suite 6: Edge Cases

### Test 6.1: Multiple Tabs
**Steps:**
1. Login as student in Tab 1
2. Open Tab 2, navigate to `/admin/dashboard`

**Expected:**
- Tab 2 redirects to `/student/dashboard`
- Both tabs show student panel

### Test 6.2: Session Expiry
**Steps:**
1. Login as student
2. Wait for session to expire (or manually clear session cookie)
3. Try to navigate to any protected route

**Expected:**
- Redirects to `/auth`
- Shows appropriate error message

### Test 6.3: Logout and Back Button
**Steps:**
1. Login as student
2. Navigate to Books page
3. Logout
4. Press back button

**Expected:**
- Redirects to `/auth`
- Does NOT show protected content

### Test 6.4: Browser Refresh on Protected Page
**Steps:**
1. Login as student
2. Navigate to `/student/books`
3. Press F5 to refresh

**Expected:**
- Page reloads successfully
- Stays on `/student/books`
- No redirect occurs

### Test 6.5: Opening Protected Link in New Tab
**Steps:**
1. Login as student in Tab 1
2. Right-click a link to `/student/books`
3. Select "Open in new tab"

**Expected:**
- New tab opens with Books page
- No authentication required (session shared)

---

## Test Suite 7: Performance & UX

### Test 7.1: No UI Flash
**Steps:**
1. Login as student
2. Try to access `/admin/dashboard`

**Expected:**
- Should NOT see any admin UI before redirect
- Loading spinner may appear briefly
- Smooth transition to student dashboard

### Test 7.2: Fast Redirects
**Steps:**
1. Login as student
2. Navigate to `/admin/books`

**Expected:**
- Redirect happens in < 100ms
- No noticeable delay

### Test 7.3: Console Logs
**Steps:**
1. Open DevTools Console
2. Perform various navigation actions

**Expected:**
- Clear, informative log messages
- No error messages
- Logs show protection working

---

## Test Results Template

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Unauthenticated Access | ⬜ Pass / ❌ Fail | |
| 1.2 | Unauthenticated Student Route | ⬜ Pass / ❌ Fail | |
| 1.3 | Auth Page When Authenticated | ⬜ Pass / ❌ Fail | |
| 2.1 | Student Accessing Admin Route | ⬜ Pass / ❌ Fail | |
| 2.2 | Admin Accessing Student Route | ⬜ Pass / ❌ Fail | |
| 2.3 | Student Multiple Admin Routes | ⬜ Pass / ❌ Fail | |
| 2.4 | Admin Multiple Student Routes | ⬜ Pass / ❌ Fail | |
| 3.1 | Back Button After Login (Student) | ⬜ Pass / ❌ Fail | |
| 3.2 | Back Button After Login (Admin) | ⬜ Pass / ❌ Fail | |
| 3.3 | Back Button After Navigation (Student) | ⬜ Pass / ❌ Fail | |
| 3.4 | Back Button After Navigation (Admin) | ⬜ Pass / ❌ Fail | |
| 3.5 | Rapid Back Button Clicking | ⬜ Pass / ❌ Fail | |
| 4.1 | Forward Button After Back | ⬜ Pass / ❌ Fail | |
| 4.2 | Cannot Forward to Wrong Panel | ⬜ Pass / ❌ Fail | |
| 5.1 | Direct URL Entry (Student → Admin) | ⬜ Pass / ❌ Fail | |
| 5.2 | Direct URL Entry (Admin → Student) | ⬜ Pass / ❌ Fail | |
| 5.3 | URL with Query Parameters | ⬜ Pass / ❌ Fail | |
| 6.1 | Multiple Tabs | ⬜ Pass / ❌ Fail | |
| 6.2 | Session Expiry | ⬜ Pass / ❌ Fail | |
| 6.3 | Logout and Back Button | ⬜ Pass / ❌ Fail | |
| 6.4 | Browser Refresh | ⬜ Pass / ❌ Fail | |
| 6.5 | Opening Link in New Tab | ⬜ Pass / ❌ Fail | |
| 7.1 | No UI Flash | ⬜ Pass / ❌ Fail | |
| 7.2 | Fast Redirects | ⬜ Pass / ❌ Fail | |
| 7.3 | Console Logs | ⬜ Pass / ❌ Fail | |

---

## Critical Tests (Must Pass)

These tests are critical for security:

1. ✅ Test 2.1: Student cannot access admin routes
2. ✅ Test 2.2: Admin cannot access student routes
3. ✅ Test 3.1: Back button after login doesn't show auth page
4. ✅ Test 5.1: URL manipulation doesn't bypass security
5. ✅ Test 6.3: Logout prevents back button access

If any critical test fails, the security implementation needs immediate attention.

---

## Automated Testing (Future)

Consider adding E2E tests using Playwright or Cypress:

```javascript
// Example test
test('student cannot access admin routes', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[name="email"]', 'student@demo.edu');
  await page.fill('[name="password"]', 'ReadSmart123');
  await page.click('button[type="submit"]');
  
  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL('/student/dashboard');
});
```
