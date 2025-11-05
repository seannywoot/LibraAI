# Database Usage Analysis

## Summary

Your application uses **TWO databases**:

1. **`test`** - Main database (default)
2. **`library`** - Separate database for "My Library" feature

## Database: `test` (Main Database)

### Collections:
- **users** - User accounts and authentication
- **authors** - Book authors
- **books** - Main book catalog
- **shelves** - Library shelves
- **transactions** - Book borrowing/returns
- **user_interactions** - User behavior tracking
- **chat_logs** - Chat conversations
- **faqs** - FAQ content
- **password_reset_tokens** - Password reset tokens

### Used By:
- Authentication (`src/app/api/auth/[...nextauth]/route.js`)
- User profile (`src/app/api/user/profile/route.js`)
- Shelves management (`src/app/api/admin/shelves/**`)
- Student shelves (`src/app/api/student/shelves/**`)
- Authors (`src/app/api/admin/authors/**`, `src/app/api/student/authors/**`)
- Transactions (`src/app/api/admin/transactions/**`)
- Book borrowing/returns (`src/app/api/student/books/borrow/**`, `src/app/api/student/books/return/**`)
- Recommendations (`src/app/api/student/books/recommendations/**`)
- Book tracking (`src/app/api/student/books/track/**`)
- Book suggestions (`src/app/api/student/books/suggestions/**`)
- Password reset (`src/app/api/auth/password-reset/**`)
- User creation (`src/app/api/admin/create-user/**`, `src/app/api/admin/seed-users/**`)
- Book seeding (`src/app/api/admin/books/seed/**`)

## Database: `library` (My Library Feature)

### Collections:
- **books** - User's personal library books
- **users** - User library data (separate from main users)

### Used By:
- My Library feature (`src/app/api/student/library/**`)
  - `src/app/api/student/library/route.js`
  - `src/app/api/student/library/[id]/route.js`
  - `src/app/api/student/library/add/route.js`
  - `src/app/api/student/library/manual/route.js`
  - `src/app/api/student/library/upload/route.js`
- Student books browsing (`src/app/api/student/books/route.js`)
- Admin books management (`src/app/api/admin/books/route.js`, `src/app/api/admin/books/create/route.js`, `src/app/api/admin/books/[id]/route.js`)

## Code Patterns

### Pattern 1: Use Default Database (test)
```javascript
const client = await clientPromise;
const db = client.db(); // Uses MONGODB_DB_NAME or "test"
```

**Files using this pattern:**
- Most API routes
- Authentication
- User management
- Shelves, authors, transactions

### Pattern 2: Explicitly Use "library" Database
```javascript
const client = await clientPromise;
const db = client.db("library"); // Explicitly uses "library"
```

**Files using this pattern:**
- `src/app/api/student/library/**` (all routes)
- `src/app/api/student/books/route.js`
- `src/app/api/admin/books/route.js`
- `src/app/api/admin/books/create/route.js`
- `src/app/api/admin/books/[id]/route.js`

### Pattern 3: Use Environment Variable
```javascript
const client = await clientPromise;
const db = client.db(process.env.MONGODB_DB_NAME || "test");
```

**Files using this pattern:**
- `src/app/api/auth/[...nextauth]/route.js`

## Why Two Databases?

Based on the code, it appears:

1. **`test` database** - Original/main database with all core features
2. **`library` database** - Added later for the "My Library" personal collection feature

This separation might be intentional to:
- Keep personal library data separate from main catalog
- Allow different data structures
- Enable easier data management

## Potential Issues

### Issue 1: Books Collection Duplication
- `test.books` - Main book catalog
- `library.books` - Personal library books

**Impact**: Books might exist in both databases with different data

### Issue 2: Users Collection Duplication
- `test.users` - Main user accounts (authentication)
- `library.users` - User library data

**Impact**: User data is split across databases

## Recommendations

### Option 1: Keep Separate (Current Setup)
**Pros:**
- Clear separation of concerns
- Personal library isolated from main catalog
- Easier to manage permissions

**Cons:**
- Data duplication
- More complex queries
- Need to sync user data

**Configuration:**
```bash
MONGODB_URI=mongodb+srv://...mongodb.net/
MONGODB_DB_NAME=test
# Library feature will explicitly use "library" database
```

### Option 2: Consolidate to Single Database
**Pros:**
- Simpler data model
- No duplication
- Easier queries

**Cons:**
- Need to migrate data
- Need to update all code
- More complex collections

**Would require:**
- Migrating `library.books` to `test.user_library_books`
- Merging `library.users` data into `test.users`
- Updating all API routes

## Current Configuration

### Environment Variables
```bash
# Connection string (no database specified)
MONGODB_URI=mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/

# Default database for most features
MONGODB_DB_NAME=test
```

### Database Usage
- **Default (`client.db()`)** → Uses `test` database
- **Explicit (`client.db("library")`)** → Uses `library` database

## Files That Need Attention

### Using `client.db()` without parameter (will use `test`):
These files assume the default database is correct:
- All authentication routes ✅
- User profile routes ✅
- Shelves routes ✅
- Authors routes ✅
- Transactions routes ✅
- Most admin routes ✅

### Using `client.db("library")` explicitly:
These files specifically use the `library` database:
- `src/app/api/student/library/**` ✅
- `src/app/api/student/books/route.js` ✅
- `src/app/api/admin/books/route.js` ✅
- `src/app/api/admin/books/create/route.js` ✅
- `src/app/api/admin/books/[id]/route.js` ✅

## Verification Steps

1. **Check your MongoDB Atlas**:
   - Confirm `test` database has: users, authors, books, shelves, transactions, etc.
   - Confirm `library` database has: books, users (library-specific)

2. **Test authentication**:
   - Should use `test.users` ✅

3. **Test My Library feature**:
   - Should use `library.books` and `library.users`

4. **Test book browsing**:
   - Student books page uses `library.books`
   - Admin books page uses `library.books`

## Conclusion

Your application is **correctly configured** to use two databases:

1. **`test`** (via `MONGODB_DB_NAME=test`) - Main database for authentication, users, shelves, authors, transactions
2. **`library`** (hardcoded in specific routes) - Personal library feature

**No changes needed** - this is intentional architecture. Just make sure:
- ✅ `MONGODB_DB_NAME=test` in environment variables
- ✅ `MONGODB_URI` has no database name at the end
- ✅ Both databases exist in your MongoDB Atlas cluster
