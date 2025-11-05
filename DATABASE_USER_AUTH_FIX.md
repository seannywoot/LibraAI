# Database User Authentication Fix

## Issues Fixed

### 1. Database Users Couldn't Login
**Problem**: Real database users were getting "Invalid credentials" even with correct passwords.

**Root Cause**: The authentication logic was throwing an error when a database user's password was wrong, which was being caught and causing the system to fall through to demo accounts. This meant:
- Database users with wrong passwords would try demo account credentials
- Database users with correct passwords would fail if they didn't match demo credentials

**Fix**: 
- Added `dbUserExists` flag to track if user is in database
- Only try demo accounts if user is NOT in database
- Properly handle password verification for database users

### 2. Password Visibility Toggle
**Added**: Eye icon to show/hide password in login form

**Features**:
- Click eye icon to toggle password visibility
- Shows "eye" icon when password is hidden
- Shows "eye-slash" icon when password is visible
- Separate state for student and admin password fields
- Accessible with proper aria-labels

## How It Works Now

### Authentication Flow:

1. **Check if account is locked** (brute force protection)
   - If locked → Show lockout message

2. **Try to find user in database**
   - Query MongoDB for user by email
   - If found → Set `dbUserExists = true`
   - Verify password with bcrypt
   - If password correct → Login successful
   - If password wrong → Continue to step 3

3. **Try demo accounts (only if user NOT in database)**
   - If `dbUserExists = false`:
     - Check if email/password match student demo
     - Check if email/password match admin demo
   - If `dbUserExists = true`:
     - Skip demo accounts (user exists in DB but password was wrong)

4. **Handle failed login**
   - Record failed attempt
   - Check if account should be locked
   - Show appropriate error message

## Testing Your Database Users

### Step 1: Check if you have users in database

```bash
node scripts/test-db-user-auth.js
```

This will show:
- How many users are in your database
- Each user's email, name, and role
- Whether their password hashes are valid
- If there are any issues

### Step 2: Create test users (if needed)

```bash
node scripts/create-test-user.js
```

This creates:
- **Student test user**:
  - Email: `test@example.com`
  - Password: `TestPassword123`
  - Role: student

- **Admin test user**:
  - Email: `testadmin@example.com`
  - Password: `AdminPassword123`
  - Role: admin

### Step 3: Test login

1. Go to http://localhost:3000/auth
2. Try logging in with your database user credentials
3. Should successfully redirect to dashboard

## Common Issues

### Issue 1: "Invalid credentials" for database user

**Possible causes**:
1. Password hash is not in bcrypt format
2. Password was stored in plain text
3. Wrong password being used

**Check**:
```bash
node scripts/test-db-user-auth.js
```

Look for:
- "Valid bcrypt format: ✅ Yes" - Good!
- "Valid bcrypt format: ❌ No" - Problem!

**Fix**:
- Use password reset feature
- Or recreate user with proper hashing
- Or run: `node scripts/create-test-user.js`

### Issue 2: Database user tries demo credentials

**Before fix**: If your database user had wrong password, it would try demo account credentials

**After fix**: Database users are kept separate from demo accounts

### Issue 3: Can't see what I'm typing

**Fixed**: Added eye icon to toggle password visibility

## Password Hash Requirements

For database users to work, their `passwordHash` field must:

1. **Exist** - Field must be present
2. **Be bcrypt format** - Must start with `$2a$`, `$2b$`, or `$2y$`
3. **Be 60 characters** - Standard bcrypt hash length
4. **Be properly generated** - Use `hashPassword()` function from `src/lib/passwords.js`

### Example of valid hash:
```
$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.8YvQu6
```

### Example of invalid hash:
```
password123  ❌ Plain text
md5hash123   ❌ Wrong algorithm
```

## Creating New Users Programmatically

```javascript
const { hashPassword } = require('./src/lib/passwords');
const clientPromise = require('./src/lib/mongodb').default;

async function createUser(email, password, name, role = 'student') {
  const client = await clientPromise;
  const db = client.db();
  
  // Hash the password
  const passwordHash = await hashPassword(password);
  
  // Create user document
  const userDoc = {
    email,
    name,
    role,
    passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Insert into database
  const result = await db.collection('users').insertOne(userDoc);
  
  return result.insertedId;
}

// Usage:
await createUser('user@example.com', 'SecurePassword123', 'John Doe', 'student');
```

## Demo Accounts vs Database Users

### Demo Accounts (Hardcoded)
- **Student**: `student@demo.edu` / `ReadSmart123`
- **Admin**: `admin@libra.ai` / `ManageStacks!`
- Always available as fallback
- Don't require database
- Defined in `src/app/api/auth/[...nextauth]/route.js`

### Database Users
- Stored in MongoDB `users` collection
- Require proper password hashing
- Can be created/updated/deleted
- Take precedence over demo accounts
- If email matches a database user, demo accounts are ignored

## Verification Checklist

After deploying these changes:

- [ ] Run `node scripts/test-db-user-auth.js` to check database users
- [ ] Verify password hashes are in bcrypt format
- [ ] Test login with database user credentials
- [ ] Test login with demo account credentials
- [ ] Verify eye icon appears on password field
- [ ] Verify clicking eye icon toggles password visibility
- [ ] Test that wrong password shows proper error message
- [ ] Test that brute force protection still works

## Files Changed

1. **src/app/api/auth/[...nextauth]/route.js**
   - Added `dbUserExists` flag
   - Fixed demo account fallback logic
   - Improved password verification flow

2. **src/app/auth/page.js**
   - Added password visibility toggle state
   - Added eye icon button
   - Added proper password type switching
   - Added accessibility labels

3. **scripts/test-db-user-auth.js** (new)
   - Tests database user authentication
   - Checks password hash validity
   - Reports issues

4. **scripts/create-test-user.js** (new)
   - Creates test users with proper hashing
   - Useful for testing and development

## Next Steps

1. **Deploy the changes** to production
2. **Test with your actual user account**
3. **If you don't have users yet**, create them using:
   - The create-test-user script
   - A user registration feature (if you have one)
   - Manual database insertion with proper hashing

4. **Verify the password visibility toggle works**
5. **Check that demo accounts still work** as fallback
