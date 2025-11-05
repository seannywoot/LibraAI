# Test Login Credentials

## 🎭 Demo Accounts (Always Available)

### Student Demo
- **Email**: `student@demo.edu`
- **Password**: `ReadSmart123`
- **Role**: Student
- **Dashboard**: `/student/dashboard`

### Admin Demo
- **Email**: `admin@libra.ai`
- **Password**: `ManageStacks!`
- **Role**: Admin
- **Dashboard**: `/admin/dashboard`

## 👤 Database Test Users (Created)

### Test Student
- **Email**: `test@example.com`
- **Password**: `TestPassword123`
- **Role**: Student
- **Dashboard**: `/student/dashboard`
- **ID**: 690af850964fa424e010a9cd

### Test Admin
- **Email**: `testadmin@example.com`
- **Password**: `AdminPassword123`
- **Role**: Admin
- **Dashboard**: `/admin/dashboard`
- **ID**: 690af851964fa424e010a9ce

## 🧪 Testing Instructions

### Test Demo Accounts
1. Go to http://localhost:3000/auth
2. Use demo credentials above
3. Should redirect to appropriate dashboard

### Test Database Users
1. Go to http://localhost:3000/auth
2. Use test user credentials above
3. Should redirect to appropriate dashboard
4. Verify it's using database (not demo fallback)

### Test Password Toggle
1. On login page, look for eye icon in password field
2. Click eye icon
3. Password should become visible
4. Click again to hide

### Test Brute Force Protection
1. Try logging in with wrong password 5 times
2. Should get locked out for 15 minutes
3. Error message should show remaining time

## 🔍 How to Tell Which Account Type You're Using

### Demo Account Signs:
- Console log: "DB authorize fallback" (if DB is checked first)
- User ID: "student-demo" or "admin-demo"
- Not stored in database

### Database User Signs:
- No fallback warning in console
- User ID: MongoDB ObjectId (24 character hex)
- Stored in database with hashed password

## 📊 Verification Checklist

- [ ] Demo student account works
- [ ] Demo admin account works
- [ ] Database test student works
- [ ] Database test admin works
- [ ] Password toggle shows/hides password
- [ ] Wrong password shows error
- [ ] Brute force protection activates after 5 attempts
- [ ] Successful login redirects to dashboard
- [ ] Dashboard loads correctly
- [ ] User can access appropriate features

## 🚨 Troubleshooting

### "Invalid credentials" for test users
```bash
# Check if users exist and have valid hashes
node scripts/test-db-user-auth.js

# Recreate test users if needed
node scripts/create-test-user.js
```

### Demo accounts work but test users don't
- Database connection issue
- Password hash format issue
- Run: `node scripts/test-db-user-auth.js`

### Can't see password toggle
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors

### Redirect not working
- Check browser console for "SignIn result" log
- Check Network tab for /api/auth/callback/credentials
- Should see "Redirecting to: /student/dashboard" in console

## 🎯 Expected Behavior

### Successful Login Flow:
1. Enter credentials
2. Click "Sign in"
3. Console shows: `SignIn result: { ok: true, ... }`
4. Console shows: `Redirecting to: /student/dashboard`
5. Browser navigates to dashboard
6. Dashboard loads with user data

### Failed Login Flow:
1. Enter wrong credentials
2. Click "Sign in"
3. Console shows: `Login failed: { error: "..." }`
4. Error message appears on page
5. Stays on login page
6. Failed attempt is recorded

## 📝 Notes

- Demo accounts are hardcoded and always available
- Database users take precedence over demo accounts
- If email matches database user, demo accounts are ignored
- Password visibility toggle works on both student and admin tabs
- All passwords are hashed with bcrypt (12 rounds)
- Session lasts 24 hours with 30-minute idle timeout
