# Database Configuration Guide

## Current Setup

Your MongoDB connection is configured to be **flexible** - you can use different databases for different features without changing the connection string.

### Environment Variables

```bash
# Connection string WITHOUT database name
MONGODB_URI=mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/

# Default database name (where your users and main data are)
MONGODB_DB_NAME=test
```

## Why This Approach?

### ❌ Problem with Hardcoded Database in URI
```bash
# If you use this:
MONGODB_URI=...mongodb.net/test

# Then ALL features must use the "test" database
# You can't easily use different databases for different features
```

### ✅ Solution: Flexible Database Selection
```bash
# Connection string without database:
MONGODB_URI=...mongodb.net/

# Default database via environment variable:
MONGODB_DB_NAME=test

# Now you can:
# - Use "test" database for users, auth, main data
# - Use "library" database for books, shelves
# - Use "analytics" database for logs, metrics
# - All with the same connection!
```

## Your Current Database Structure

Based on your MongoDB Atlas screenshot:

### `test` Database (Your Main Database)
Contains:
- **users** collection - Your user accounts (seannpatrick, zaylizbeth)
- **authors** collection
- **books** collection
- **chat_logs** collection
- **faqs** collection
- **password_reset_tokens** collection
- **shelves** collection
- **transactions** collection
- **user_interactions** collection

### `libraai` Database (New/Test Database)
Contains:
- **users** collection - Test users created by scripts

### `library` Database
Contains:
- **books** collection

## How Code Uses Databases

### 1. Authentication (uses `test` database)
```javascript
// src/app/api/auth/[...nextauth]/route.js
const db = client.db(process.env.MONGODB_DB_NAME || "test");
const userDoc = await db.collection("users").findOne({ email });
```

### 2. Other Features (can specify database)
```javascript
// Option 1: Use default database
const client = await clientPromise;
const db = client.db(); // Uses MONGODB_DB_NAME or "test"

// Option 2: Use specific database
const db = client.db("library"); // Use library database

// Option 3: Use helper function
import { getDb, getDefaultDb } from "@/lib/mongodb";
const db = await getDefaultDb(); // Uses "test"
const libraryDb = await getDb("library"); // Uses "library"
```

## Configuration for Different Environments

### Local Development (.env.local)
```bash
MONGODB_URI=mongodb+srv://...mongodb.net/
MONGODB_DB_NAME=test
```

### Production (Vercel)
```bash
MONGODB_URI=mongodb+srv://...mongodb.net/
MONGODB_DB_NAME=test
```

### Staging (if you have one)
```bash
MONGODB_URI=mongodb+srv://...mongodb.net/
MONGODB_DB_NAME=test_staging
```

## Migrating Data Between Databases

If you need to move data from `libraai` to `test`:

### Option 1: MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your cluster
3. Select `libraai` database → `users` collection
4. Export as JSON
5. Select `test` database → `users` collection
6. Import JSON

### Option 2: MongoDB Shell
```javascript
// Connect to your cluster
use libraai
db.users.find().forEach(function(doc) {
  db.getSiblingDB('test').users.insert(doc);
});
```

### Option 3: Script
```javascript
// scripts/migrate-users.js
const clientPromise = require('../src/lib/mongodb').default;

async function migrateUsers() {
  const client = await clientPromise;
  
  // Get users from libraai
  const sourceDb = client.db('libraai');
  const users = await sourceDb.collection('users').find().toArray();
  
  // Insert into test
  const targetDb = client.db('test');
  await targetDb.collection('users').insertMany(users);
  
  console.log(`Migrated ${users.length} users`);
}
```

## Checking Which Database You're Using

### Method 1: Check Environment Variable
```bash
echo $MONGODB_DB_NAME
# Should show: test
```

### Method 2: Run Diagnostic Script
```bash
node scripts/diagnose-auth.js
```

### Method 3: Check in Code
```javascript
const client = await clientPromise;
const db = client.db();
console.log('Using database:', db.databaseName);
```

## Best Practices

### ✅ DO:
- Keep `MONGODB_URI` without database name for flexibility
- Use `MONGODB_DB_NAME` environment variable for default database
- Explicitly specify database when using non-default databases
- Document which database each feature uses

### ❌ DON'T:
- Hardcode database names in the URI
- Assume `client.db()` will use the right database
- Mix data from different databases without clear separation
- Change database names without updating all references

## Troubleshooting

### Issue: "Users not found"
**Check**: Which database are you querying?
```javascript
const db = client.db();
console.log('Database:', db.databaseName); // Should be "test"
```

### Issue: "Data in wrong database"
**Check**: Your environment variable
```bash
# .env.local
MONGODB_DB_NAME=test  # Make sure this matches where your data is
```

### Issue: "Some features work, others don't"
**Check**: Different parts of code might be using different databases
```bash
# Search for all db.collection() calls
grep -r "db.collection" src/
```

## Summary

Your setup is now **flexible and correct**:

1. **Connection string** (`MONGODB_URI`) - No database name, just the cluster
2. **Default database** (`MONGODB_DB_NAME=test`) - Where your main data lives
3. **Code** - Explicitly uses `test` database for authentication
4. **Other features** - Can use `test` or other databases as needed

This gives you the best of both worlds:
- ✅ All your existing data in `test` database works
- ✅ Can use different databases for different features
- ✅ Easy to change default database via environment variable
- ✅ No need to modify connection string for different databases
