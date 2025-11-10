# Admin Login Email Fix - MongoDB Persistence

## Problem
The "new admin login detected" email was being sent every time an admin logged in, even from the same device/browser.

## Root Cause
Device tracking and notification deduplication were using **in-memory storage** (JavaScript `Map` objects), which get cleared when:
- The development server restarts
- The application is redeployed
- The Node.js process restarts

This meant every login after a restart was treated as a "new device".

## Solution
Replaced in-memory storage with **MongoDB persistence** for:
1. **Device tracking** (`admin_devices` collection)
2. **Notification deduplication** (`security_notifications` collection)

## Changes Made

### 1. Updated `src/lib/security-notifications.js`
- Removed in-memory `Map` objects for device tracking and notification deduplication
- Implemented MongoDB-backed functions:
  - `wasRecentlySent()` - Now queries MongoDB instead of memory
  - `markAsSent()` - Now stores in MongoDB with timestamps
  - `isNewAdminDevice()` - Now checks/stores devices in MongoDB
  - `cleanupSecurityTracking()` - Now cleans up old MongoDB records

### 2. Updated `src/app/api/auth/[...nextauth]/route.js`
- Changed `isNewAdminDevice()` call to handle async/await properly
- Used `.then()` to avoid blocking the login process

### 3. Created Database Collections

#### `admin_devices` Collection
Stores admin device fingerprints to track known devices.

**Schema:**
```javascript
{
  fingerprint: String,      // Unique: email:ip:browser
  email: String,            // Admin email
  ipAddress: String,        // IP address
  userAgent: String,        // Full user agent string
  firstSeen: Date,          // First login from this device
  lastSeen: Date            // Most recent login
}
```

**Indexes:**
- `fingerprint` (unique)
- `email`
- `lastSeen` (for cleanup)

#### `security_notifications` Collection
Tracks sent notifications to prevent duplicates.

**Schema:**
```javascript
{
  key: String,              // Unique: notification type + identifier
  lastSent: Number,         // Timestamp (milliseconds)
  updatedAt: Date           // Last update time
}
```

**Indexes:**
- `key` (unique)
- `updatedAt` (for cleanup)

## Setup Instructions

### 1. Create Database Indexes
Run the setup script to create necessary indexes:

```bash
node scripts/setup-security-indexes.js
```

This creates optimized indexes for fast lookups and ensures data integrity.

### 2. Test the Fix
1. Login as an admin
2. You should receive a "new admin login detected" email
3. Logout and login again immediately
4. You should NOT receive another email (deduplicated for 24 hours)
5. Restart your dev server
6. Login again - still no email (device is remembered in MongoDB)

## How It Works Now

### Device Detection Flow
```
Admin logs in
  ↓
Generate fingerprint (email + IP + browser)
  ↓
Query MongoDB admin_devices collection
  ↓
If not found → New device
  ├─ Insert into MongoDB
  └─ Send email notification
  
If found → Known device
  └─ Update lastSeen timestamp
```

### Deduplication Flow
```
Before sending email
  ↓
Check MongoDB security_notifications
  ↓
If sent within 24 hours → Skip
If not sent or expired → Send email
  └─ Store timestamp in MongoDB
```

## Cleanup
Old records are automatically cleaned up:
- **Device tracking**: Removed after 30 days of inactivity
- **Notification deduplication**: Removed after 24 hours

Cleanup runs automatically every hour via `setInterval`.

## Benefits
✅ Device tracking persists across server restarts  
✅ No duplicate emails for the same device within 24 hours  
✅ Scalable to multiple server instances (shared MongoDB)  
✅ Automatic cleanup of old data  
✅ Fast lookups with proper indexes  

## Configuration
Adjust deduplication windows in `src/lib/security-notifications.js`:

```javascript
const CONFIG = {
  DEVICE_DEDUPE_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  // ... other settings
};
```

## Monitoring
Check MongoDB collections to see tracked devices:

```javascript
// In MongoDB shell or Compass
db.admin_devices.find().sort({ lastSeen: -1 })
db.security_notifications.find().sort({ updatedAt: -1 })
```
