# Admin Daily Digests - Testing Guide

## Quick Test (5 minutes)

### Step 1: Start Dev Server

```bash
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

### Step 2: Test the Endpoint

Open a new terminal and run:

```bash
curl http://localhost:3000/api/cron/admin-digests
```

Or use the test script:

```bash
node scripts/test-admin-digests.js
```

### Step 3: Check Results

**Expected Response:**
```json
{
  "ok": true,
  "results": {
    "admins": 1,
    "overdueBooks": 0,
    "pendingRequests": 0,
    "overdueDigest": { "sent": 1, "errors": [] },
    "pendingDigest": { "sent": 1, "errors": [] }
  }
}
```

### Step 4: Check Email

Check your admin email inbox for two emails:
1. `[Daily Digest] No overdue books`
2. `[Daily Digest] No pending borrow requests`

✅ **If you received both emails, it works!**

---

## Detailed Testing (15 minutes)

### Test 1: Verify Admin Users

```javascript
// In MongoDB Compass or shell
db.users.find({ role: 'admin' })
```

**Expected:**
- At least one user with `role: "admin"`
- User has valid email address
- `emailNotifications` is `true` or `undefined`

**Fix if needed:**
```javascript
db.users.updateOne(
  { email: "your-admin@email.com" },
  { 
    $set: { 
      role: "admin",
      emailNotifications: true 
    } 
  }
)
```

### Test 2: Create Test Overdue Book

```javascript
// In MongoDB
db.transactions.insertOne({
  userId: "student@example.com",
  bookId: ObjectId("673b4e8f9e7c8d1234567890"), // Use a real book ID
  status: "borrowed",
  borrowedAt: new Date("2025-10-15"),
  dueDate: new Date("2025-10-29"), // Past date
  requestedAt: new Date("2025-10-15")
})
```

**Verify:**
```javascript
db.transactions.find({ 
  status: "borrowed",
  dueDate: { $lt: new Date() }
})
```

### Test 3: Create Test Pending Request

```javascript
// In MongoDB
db.transactions.insertOne({
  userId: "student@example.com",
  bookId: ObjectId("673b4e8f9e7c8d1234567891"), // Use a real book ID
  status: "pending-approval",
  requestedAt: new Date("2025-11-02"),
  requestedDueDate: new Date("2025-11-16")
})
```

**Verify:**
```javascript
db.transactions.find({ status: "pending-approval" })
```

### Test 4: Trigger Digest Again

```bash
curl http://localhost:3000/api/cron/admin-digests
```

**Expected Response:**
```json
{
  "ok": true,
  "results": {
    "admins": 1,
    "overdueBooks": 1,
    "pendingRequests": 1,
    "overdueDigest": { "sent": 1, "errors": [] },
    "pendingDigest": { "sent": 1, "errors": [] }
  }
}
```

### Test 5: Check Emails

Check your inbox for:

**Email 1: Overdue Books**
- Subject: `[Daily Digest] 1 overdue book`
- Shows book title, borrower, days overdue
- Has "View All Transactions" button
- Shows recommendations

**Email 2: Pending Requests**
- Subject: `[Daily Digest] 1 pending borrow request`
- Shows book title, requester, days waiting
- Has "Review & Approve Requests" button
- Shows recommendations

### Test 6: Check Server Logs

Look for these messages in your terminal:

```
[Admin Digests] Found 1 admin(s) to notify
[Admin Digests] Found 1 overdue books
[Admin Digests] Found 1 pending requests
✅ Overdue digest sent to your-admin@email.com
✅ Pending requests digest sent to your-admin@email.com
```

---

## Test Multiple Admins

### Step 1: Create Second Admin

```javascript
db.users.insertOne({
  email: "admin2@example.com",
  name: "Second Admin",
  role: "admin",
  emailNotifications: true,
  passwordHash: "...", // Use a real hash
  createdAt: new Date()
})
```

### Step 2: Trigger Digest

```bash
curl http://localhost:3000/api/cron/admin-digests
```

### Step 3: Verify

**Expected Response:**
```json
{
  "results": {
    "admins": 2,
    "overdueDigest": { "sent": 2, "errors": [] },
    "pendingDigest": { "sent": 2, "errors": [] }
  }
}
```

**Expected Logs:**
```
[Admin Digests] Found 2 admin(s) to notify
✅ Overdue digest sent to admin1@example.com
✅ Overdue digest sent to admin2@example.com
✅ Pending requests digest sent to admin1@example.com
✅ Pending requests digest sent to admin2@example.com
```

---

## Test Email Preferences

### Test 1: Disable Notifications

```javascript
db.users.updateOne(
  { email: "admin2@example.com" },
  { $set: { emailNotifications: false } }
)
```

### Test 2: Trigger Digest

```bash
curl http://localhost:3000/api/cron/admin-digests
```

### Test 3: Verify

**Expected:**
- Only 1 admin receives emails (admin1)
- admin2 is skipped

**Expected Response:**
```json
{
  "results": {
    "admins": 1,
    "overdueDigest": { "sent": 1, "errors": [] },
    "pendingDigest": { "sent": 1, "errors": [] }
  }
}
```

---

## Test Error Handling

### Test 1: Invalid Email

```javascript
db.users.updateOne(
  { email: "admin1@example.com" },
  { $set: { email: "invalid-email" } }
)
```

Trigger digest and check for errors in response.

### Test 2: Missing Book

Create transaction with non-existent book ID:

```javascript
db.transactions.insertOne({
  userId: "student@example.com",
  bookId: ObjectId("000000000000000000000000"),
  status: "borrowed",
  dueDate: new Date("2025-10-29")
})
```

Digest should skip this transaction gracefully.

### Test 3: Database Connection Error

Stop MongoDB and trigger digest:

```bash
curl http://localhost:3000/api/cron/admin-digests
```

Should return error response but not crash.

---

## Test with CRON_SECRET

### Step 1: Add Secret

```bash
# Add to .env.local
CRON_SECRET=test-secret-123
```

### Step 2: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 3: Test Without Auth

```bash
curl http://localhost:3000/api/cron/admin-digests
```

**Expected:**
```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

### Step 4: Test With Auth

```bash
curl -H "Authorization: Bearer test-secret-123" \
  http://localhost:3000/api/cron/admin-digests
```

**Expected:**
```json
{
  "ok": true,
  "results": { ... }
}
```

---

## Test Email Content

### Check HTML Rendering

1. Open received email
2. Verify:
   - ✅ Proper formatting
   - ✅ Colors display correctly
   - ✅ Buttons are clickable
   - ✅ Links work
   - ✅ Mobile responsive

### Check Text Version

1. View email source
2. Find text/plain part
3. Verify readable without HTML

### Check Links

Click these links in email:
- "View All Transactions" → Should go to `/admin/transactions?status=borrowed`
- "Review & Approve Requests" → Should go to `/admin/transactions?status=pending-approval`

---

## Performance Testing

### Test with Many Items

Create 25 overdue books and 25 pending requests:

```javascript
// Create 25 overdue books
for (let i = 0; i < 25; i++) {
  db.transactions.insertOne({
    userId: `student${i}@example.com`,
    bookId: ObjectId("673b4e8f9e7c8d1234567890"),
    status: "borrowed",
    borrowedAt: new Date("2025-10-15"),
    dueDate: new Date("2025-10-29"),
    requestedAt: new Date("2025-10-15")
  })
}
```

**Expected:**
- Email shows first 20 items
- Message: "...and 5 more. View all in the dashboard."
- Response time < 10 seconds

---

## Troubleshooting Tests

### Problem: No emails received

**Check 1: EmailJS Configuration**
```bash
curl http://localhost:3000/api/test-email
```

**Check 2: Admin Users**
```javascript
db.users.find({ 
  role: 'admin',
  emailNotifications: { $ne: false }
})
```

**Check 3: Server Logs**
Look for error messages in terminal.

### Problem: Wrong data in digest

**Check 1: Transactions**
```javascript
// Overdue
db.transactions.find({ 
  status: "borrowed",
  dueDate: { $lt: new Date() }
})

// Pending
db.transactions.find({ 
  status: "pending-approval"
})
```

**Check 2: Books**
```javascript
db.books.find({ _id: ObjectId("...") })
```

**Check 3: Users**
```javascript
db.users.find({ email: "student@example.com" })
```

### Problem: Digest not running on schedule

**Vercel:**
1. Check `vercel.json` has cron config
2. Verify deployment includes cron
3. Check Vercel dashboard > Cron Jobs

**External:**
1. Verify cron service is active
2. Check service logs
3. Test endpoint manually

---

## Cleanup After Testing

### Remove Test Data

```javascript
// Remove test transactions
db.transactions.deleteMany({
  userId: { $regex: /^student.*@example\.com$/ }
})

// Remove test admin
db.users.deleteOne({
  email: "admin2@example.com"
})

// Reset admin1 email if changed
db.users.updateOne(
  { email: "invalid-email" },
  { $set: { email: "admin1@example.com" } }
)
```

### Reset Email Preferences

```javascript
db.users.updateMany(
  { role: "admin" },
  { $set: { emailNotifications: true } }
)
```

---

## Production Testing Checklist

Before deploying to production:

- [ ] Tested locally with real data
- [ ] Verified emails arrive and look correct
- [ ] Tested with multiple admins
- [ ] Tested email preferences
- [ ] Tested error handling
- [ ] Verified dashboard links work
- [ ] Checked mobile email rendering
- [ ] Tested with CRON_SECRET
- [ ] Verified cron schedule in vercel.json
- [ ] Reviewed server logs for errors
- [ ] Tested with 20+ items
- [ ] Confirmed EmailJS rate limits

---

## Success Criteria

✅ **Basic Functionality**
- Endpoint returns 200 OK
- Admins receive both digest emails
- Email content is accurate
- Dashboard links work

✅ **Data Accuracy**
- Overdue books count is correct
- Pending requests count is correct
- Book and user details are accurate
- Days overdue/waiting are calculated correctly

✅ **Email Quality**
- Professional formatting
- Mobile responsive
- All links work
- Text version readable
- No broken images

✅ **Error Handling**
- Graceful handling of missing data
- Continues on individual failures
- Logs errors appropriately
- Returns useful error messages

✅ **Performance**
- Completes in < 10 seconds
- Handles 20+ items smoothly
- No memory leaks
- Efficient database queries

✅ **Security**
- CRON_SECRET works (if configured)
- No PII in logs
- Respects email preferences
- Admin emails not exposed

---

## Next Steps

After successful testing:

1. ✅ Deploy to production
2. ✅ Monitor first few runs
3. ✅ Verify emails arrive on schedule
4. ✅ Check Vercel function logs
5. ✅ Gather admin feedback
6. ✅ Adjust schedule if needed

---

## Support

If you encounter issues:

1. Check server logs
2. Review troubleshooting section
3. Verify environment variables
4. Test EmailJS configuration
5. Check database connections

For detailed documentation:
- Full docs: `docs/ADMIN_DAILY_DIGESTS.md`
- Quick ref: `docs/ADMIN_DIGESTS_QUICK_REF.md`
- Implementation: `docs/ADMIN_DIGESTS_IMPLEMENTATION.md`
