# Route Security Quick Reference

## Protection Layers

### 🛡️ Layer 1: Middleware (Server-Side)
**File:** `middleware.js`
- Runs on EVERY request
- Primary security enforcement
- Redirects before page loads

### 🔒 Layer 2: Layout Protection (Client-Side)
**Files:** 
- `src/app/admin/layout.js`
- `src/app/student/layout.js`

Uses `RoleProtection` component to wrap entire sections

### 🚪 Layer 3: Auth Page Protection
**File:** `src/app/auth/page.js`
- Prevents returning to login after authentication
- Uses `window.location.replace()` to control history
- Handles back button via `popstate` events

## Quick Implementation

### Protect a New Admin Route
1. Create route under `src/app/admin/`
2. Protection is automatic via `src/app/admin/layout.js`
3. No additional code needed

### Protect a New Student Route
1. Create route under `src/app/student/`
2. Protection is automatic via `src/app/student/layout.js`
3. No additional code needed

### Protect a Custom Route
```javascript
import RoleProtection from "@/components/RoleProtection";

export default function CustomPage() {
  return (
    <RoleProtection requiredRole="admin">
      {/* Your content */}
    </RoleProtection>
  );
}
```

## Common Scenarios

| Scenario | What Happens |
|----------|--------------|
| Student → `/admin/books` | Redirects to `/student/dashboard` |
| Admin → `/student/library` | Redirects to `/admin/dashboard` |
| Unauthenticated → `/admin/*` | Redirects to `/auth` |
| Authenticated → `/auth` | Redirects to dashboard |
| Login → Back button | Stays on dashboard |
| Fresh login → Back button | Goes to page before login |

## Testing Commands

```bash
# Test as student
1. Login with student@demo.edu
2. Try accessing /admin/dashboard
3. Should redirect to /student/dashboard

# Test as admin
1. Login with admin@libra.ai
2. Try accessing /student/library
3. Should redirect to /admin/dashboard

# Test back button
1. Login
2. Navigate to any page
3. Press back button
4. Should NOT see login page
```

## Key Files

```
middleware.js                      # Server-side protection
src/components/RoleProtection.jsx  # Client-side protection component
src/app/admin/layout.js           # Admin section wrapper
src/app/student/layout.js         # Student section wrapper
src/app/auth/page.js              # Auth page with back button protection
```

## Security Checklist

- ✅ Middleware protects all routes
- ✅ Client-side protection in layouts
- ✅ Auth page prevents back navigation
- ✅ No-cache headers prevent stale redirects
- ✅ Loading states prevent UI flash
- ✅ Popstate handlers catch browser navigation
- ✅ Role-based access control enforced
- ✅ Session monitoring in real-time

## Troubleshooting

**Problem:** User sees wrong page briefly
**Solution:** Check RoleProtection loading state

**Problem:** Back button shows login
**Solution:** Verify `window.location.replace()` is used

**Problem:** Can access wrong panel
**Solution:** Check middleware matcher includes the route

**Problem:** Redirect loop
**Solution:** Ensure role checks are consistent across layers
