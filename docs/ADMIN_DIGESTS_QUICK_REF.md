# Admin Daily Digests - Quick Reference

## What You Get

### 📚 Overdue Books Digest
- Daily email with all overdue books
- Shows: book title, borrower, days overdue
- Sorted by urgency (most overdue first)
- Direct link to transactions dashboard

### 📋 Pending Requests Digest
- Daily email with all pending borrow requests
- Shows: book title, requester, days waiting
- Sorted by wait time (oldest first)
- Direct link to approve requests

## Quick Setup

### 1. Test Locally

```bash
# Start dev server
npm run dev

# Trigger digest (in another terminal)
curl http://localhost:3000/api/cron/admin-digests
```

### 2. Deploy to Production

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/admin-digests",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 3. Verify Admin Users

Admins must have:
- `role: "admin"`
- `emailNotifications: true` (or undefined)

```javascript
// Check in MongoDB
db.users.find({ role: 'admin' })
```

## Common Schedules

```
0 8 * * *     - Daily at 8:00 AM
0 9 * * 1-5   - Weekdays at 9:00 AM
0 */6 * * *   - Every 6 hours
0 0 * * *     - Daily at midnight
```

## Troubleshooting

### No emails received?

1. **Check admin users:**
   ```javascript
   db.users.find({ role: 'admin', emailNotifications: { $ne: false } })
   ```

2. **Check EmailJS config:**
   ```bash
   # Verify env vars are set
   echo $EMAILJS_SERVICE_ID
   echo $EMAILJS_TEMPLATE_ID
   ```

3. **Check server logs:**
   ```
   [Admin Digests] Found X admin(s) to notify
   ✅ Overdue digest sent to admin@example.com
   ```

### Wrong data in digest?

1. **Check overdue books:**
   ```javascript
   db.transactions.find({ 
     status: "borrowed",
     dueDate: { $lt: new Date() }
   })
   ```

2. **Check pending requests:**
   ```javascript
   db.transactions.find({ status: "pending-approval" })
   ```

## Files Created

```
src/lib/admin-email-templates.js          (updated)
  ├─ buildOverdueBooksDigestEmail()
  └─ buildPendingRequestsDigestEmail()

src/app/api/cron/admin-digests/route.js   (new)
  └─ GET endpoint for cron job

docs/ADMIN_DAILY_DIGESTS.md               (new)
  └─ Complete documentation

docs/ADMIN_DIGESTS_QUICK_REF.md           (new)
  └─ This quick reference
```

## API Endpoint

```bash
# Test endpoint
curl http://localhost:3000/api/cron/admin-digests

# With authentication
curl -H "Authorization: Bearer your-secret" \
  http://localhost:3000/api/cron/admin-digests
```

**Response:**
```json
{
  "ok": true,
  "results": {
    "admins": 2,
    "overdueBooks": 3,
    "pendingRequests": 2,
    "overdueDigest": { "sent": 2, "errors": [] },
    "pendingDigest": { "sent": 2, "errors": [] }
  }
}
```

## Email Examples

### Overdue Books (3 overdue)
```
Subject: [Daily Digest] 3 overdue books

📚 Overdue Books Daily Digest

┌─────────┐
│    3    │
│ Overdue │
└─────────┘

📕 "Introduction to Algorithms"
   Jane Doe (jane@example.com)
   7 days overdue • Due: Oct 28, 2025

[View All Transactions]
```

### Pending Requests (2 pending)
```
Subject: [Daily Digest] 2 pending borrow requests

📋 Pending Borrow Requests Digest

┌──────────┐
│    2     │
│ Pending  │
└──────────┘

📘 "Design Patterns"
   Alice Johnson (alice@example.com)
   Waiting 3 days • Requested: Nov 2, 2025

[Review & Approve Requests]
```

### No Issues
```
Subject: [Daily Digest] No overdue books

✅ No overdue books at this time. Great job!
```

## Next Steps

1. ✅ Test locally with `curl`
2. ✅ Verify emails arrive
3. ✅ Add to `vercel.json` for production
4. ✅ Deploy and monitor logs

## Support

- Full docs: `docs/ADMIN_DAILY_DIGESTS.md`
- Email templates: `src/lib/admin-email-templates.js`
- Cron job: `src/app/api/cron/admin-digests/route.js`


## Authentication & Links

### Email Links Behavior

When admins click links in digest emails:

**If logged in:**
- ✅ Goes directly to the transactions page
- ✅ Filters applied automatically (overdue or pending)

**If NOT logged in:**
- ✅ Redirects to login page: `/auth?redirect=/admin/transactions?status=...`
- ✅ After successful login, automatically redirects to the original page
- ✅ Filters preserved in the redirect

**Security:**
- ✅ Middleware validates authentication
- ✅ Auth page validates admin role
- ✅ Only admins can access `/admin/*` routes
- ✅ Redirect parameter is validated (must start with `/admin`)

This is handled automatically by your existing middleware and auth system!
