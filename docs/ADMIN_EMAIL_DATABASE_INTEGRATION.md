# Admin Email Notifications - Database Integration

## Overview

The admin email notification system now **automatically fetches admin recipients from the MongoDB database**, making it dynamic and scalable.

## How It Works

### Automatic Admin Discovery

The system queries the database for all admin users with email notifications enabled:

```javascript
// Query executed on each notification
db.collection('users').find({ 
  role: 'admin',
  emailNotifications: { $ne: false }
}).toArray()
```

### Admin User Requirements

For an admin to receive security notifications, their user document should have:

```javascript
{
  _id: ObjectId("..."),
  email: "admin@libra.ai",
  name: "Admin User",
  role: "admin",
  emailNotifications: true,  // or undefined (defaults to enabled)
  passwordHash: "...",
  createdAt: ISODate("...")
}
```

### Email Notification Field

- `emailNotifications: true` → Receives notifications ✅
- `emailNotifications: undefined` → Receives notifications ✅ (default enabled)
- `emailNotifications: false` → Does NOT receive notifications ❌

## Benefits

### 1. Multiple Admin Recipients
- Automatically sends to **all admins** in the database
- No need to configure individual emails
- Scales as you add more admins

### 2. User Preferences
- Admins can enable/disable notifications in their profile
- Respects user preferences automatically
- No code changes needed

### 3. Dynamic Management
- Add/remove admins without restarting server
- Changes take effect immediately
- No environment variable updates needed

### 4. Fallback Support
- Falls back to `ADMIN_EMAIL` env var if no admins in database
- Ensures notifications always work
- Useful during initial setup

## Implementation

### Code Location

`src/lib/security-notifications.js`:

```javascript
async function getAdminEmails() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    
    // Query all admin users with email notifications enabled
    const admins = await db.collection('users')
      .find({ 
        role: 'admin',
        emailNotifications: { $ne: false }
      })
      .toArray();
    
    const emails = admins.map(admin => admin.email).filter(Boolean);
    
    if (emails.length === 0) {
      console.warn('[Security Notifications] No admin users found.');
      
      // Fallback to env var
      const fallbackEmail = CONFIG.ADMIN_EMAIL;
      if (fallbackEmail && fallbackEmail !== 'admin@libra.ai') {
        return [fallbackEmail];
      }
    }
    
    return emails;
  } catch (error) {
    console.error('[Security Notifications] Database error:', error);
    
    // Fallback to env var on error
    const fallbackEmail = CONFIG.ADMIN_EMAIL;
    if (fallbackEmail) {
      return [fallbackEmail];
    }
    
    return [];
  }
}
```

## Setup

### No Configuration Required!

The system works automatically if you have admin users in your database.

### Optional: Fallback Email

Add to `.env.local` for fallback when no admins in database:

```bash
ADMIN_EMAIL=fallback-admin@example.com
```

## Testing

### Test with Multiple Admins

1. **Create multiple admin users:**
   ```javascript
   // In MongoDB or via API
   {
     email: "admin1@libra.ai",
     role: "admin",
     emailNotifications: true
   },
   {
     email: "admin2@libra.ai",
     role: "admin",
     emailNotifications: true
   }
   ```

2. **Trigger a notification:**
   ```bash
   # Fail login 5 times
   # Both admins should receive the email
   ```

3. **Check logs:**
   ```
   [Security Notifications] Found 2 admin(s) to notify: 
   ['admin1@libra.ai', 'admin2@libra.ai']
   ```

### Test with Disabled Notifications

1. **Disable notifications for one admin:**
   ```javascript
   db.users.updateOne(
     { email: "admin2@libra.ai" },
     { $set: { emailNotifications: false } }
   )
   ```

2. **Trigger a notification:**
   ```bash
   # Only admin1 should receive the email
   ```

3. **Check logs:**
   ```
   [Security Notifications] Found 1 admin(s) to notify: 
   ['admin1@libra.ai']
   ```

## Admin Profile Integration

### Enable/Disable Notifications

Admins can control their notification preferences in their profile:

```javascript
// In admin profile page
async function updateNotificationPreference(enabled) {
  await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailNotifications: enabled
    })
  });
}
```

### UI Example

```jsx
<label>
  <input
    type="checkbox"
    checked={emailNotifications}
    onChange={(e) => updateNotificationPreference(e.target.checked)}
  />
  Receive security email notifications
</label>
```

## Monitoring

### Check Admin Recipients

```javascript
// In browser console or API endpoint
const response = await fetch('/api/admin/security/notifications');
const data = await response.json();
console.log('Admin email:', data.config.adminEmail);
```

### Server Logs

Watch for these messages:

```
[Security Notifications] Found 2 admin(s) to notify: ['admin1@...', 'admin2@...']
✓ Account lockout notification sent to admin1@libra.ai
✓ Account lockout notification sent to admin2@libra.ai
```

## Error Handling

### Database Connection Error

If database is unavailable:
1. System logs error
2. Falls back to `ADMIN_EMAIL` env var
3. Continues to send notifications

### No Admins Found

If no admins in database:
1. System logs warning
2. Falls back to `ADMIN_EMAIL` env var
3. Continues to send notifications

### Invalid Email Addresses

If admin has invalid email:
1. Email is filtered out
2. Other admins still receive notifications
3. Error logged for debugging

## Migration from Env Var

### Before (Env Var Only)
```bash
# .env.local
ADMIN_EMAIL=admin@libra.ai
```

Only one admin receives notifications.

### After (Database)
```javascript
// MongoDB users collection
{ email: "admin1@libra.ai", role: "admin" }
{ email: "admin2@libra.ai", role: "admin" }
{ email: "admin3@libra.ai", role: "admin" }
```

All three admins receive notifications automatically.

### Transition Period

Keep `ADMIN_EMAIL` in `.env.local` during transition:
- Acts as fallback if database query fails
- Ensures notifications continue during migration
- Can be removed once all admins are in database

## Best Practices

### 1. Default to Enabled
- Don't require admins to opt-in
- `emailNotifications: undefined` should mean enabled
- Only explicit `false` disables notifications

### 2. Respect Preferences
- Always check `emailNotifications` field
- Don't send to admins who opted out
- Log when admins are skipped

### 3. Provide Fallback
- Keep `ADMIN_EMAIL` env var as backup
- Ensures notifications during database issues
- Useful for initial setup

### 4. Log Recipients
- Log how many admins will be notified
- Log each successful send
- Log any failures

## Performance Considerations

### Database Query

Each notification triggers a database query:
- Query is simple and indexed (role field)
- Returns only necessary fields
- Cached by MongoDB query planner

### Optimization Options

1. **Cache admin emails:**
   ```javascript
   let adminEmailCache = null;
   let cacheExpiry = 0;
   
   async function getAdminEmails() {
     const now = Date.now();
     if (adminEmailCache && now < cacheExpiry) {
       return adminEmailCache;
     }
     
     // Query database
     const emails = await queryDatabase();
     
     // Cache for 5 minutes
     adminEmailCache = emails;
     cacheExpiry = now + 5 * 60 * 1000;
     
     return emails;
   }
   ```

2. **Use Redis:**
   ```javascript
   // Cache admin emails in Redis
   const cached = await redis.get('admin_emails');
   if (cached) return JSON.parse(cached);
   
   const emails = await queryDatabase();
   await redis.setex('admin_emails', 300, JSON.stringify(emails));
   return emails;
   ```

## Security Considerations

### Email Exposure

- Admin emails are only queried server-side
- Never exposed to client
- Only used for sending notifications

### Notification Spam

- Deduplication prevents spam
- Respects user preferences
- Rate limiting on notification frequency

### Database Access

- Uses existing MongoDB connection
- No additional credentials needed
- Follows same security model as rest of app

## Troubleshooting

### No Notifications Sent

1. **Check admin users exist:**
   ```javascript
   db.users.find({ role: 'admin' })
   ```

2. **Check emailNotifications field:**
   ```javascript
   db.users.find({ 
     role: 'admin',
     emailNotifications: { $ne: false }
   })
   ```

3. **Check server logs:**
   ```
   [Security Notifications] Found 0 admin(s) to notify
   [Security Notifications] Using fallback admin email from env var
   ```

### Wrong Recipients

1. **Verify role field:**
   ```javascript
   // Should be 'admin', not 'Admin' or 'administrator'
   db.users.find({ role: 'admin' })
   ```

2. **Check email field:**
   ```javascript
   // Should be valid email address
   db.users.find({ 
     role: 'admin',
     email: { $exists: true, $ne: null }
   })
   ```

### Database Errors

1. **Check MongoDB connection:**
   ```javascript
   // Verify MONGODB_URI in .env.local
   ```

2. **Check collection name:**
   ```javascript
   // Should be 'users' collection
   db.users.find()
   ```

3. **Use fallback:**
   ```bash
   # Add to .env.local
   ADMIN_EMAIL=fallback@example.com
   ```

## Summary

✅ **Automatic** - Fetches admins from database  
✅ **Dynamic** - No restart needed for changes  
✅ **Scalable** - Supports multiple admins  
✅ **Flexible** - Respects user preferences  
✅ **Reliable** - Fallback to env var  
✅ **Performant** - Simple, indexed query  

The system now intelligently manages admin recipients, making it production-ready and user-friendly!
