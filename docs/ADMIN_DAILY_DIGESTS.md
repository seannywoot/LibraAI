# Admin Daily Digest Email Notifications

## Overview

The admin daily digest system sends automated email summaries to all administrators, helping them stay on top of critical library operations without constantly checking the dashboard.

## Features

### 1. Overdue Books Daily Digest
**Critical for library operations** - Helps admins track and follow up on overdue books.

**What it includes:**
- Total count of overdue books
- List of overdue books with details:
  - Book title
  - Borrower name and email
  - Days overdue
  - Original due date
- Books sorted by urgency (most overdue first)
- Direct link to transactions dashboard
- Actionable recommendations

**When it's sent:**
- Daily at 8:00 AM (configurable via cron schedule)
- Sent even if there are no overdue books (with success message)

### 2. Pending Borrow Requests Digest
**Helps admins stay on top of approvals** - Ensures students don't wait too long for book approvals.

**What it includes:**
- Total count of pending requests
- List of pending requests with details:
  - Book title
  - Requester name and email
  - Days waiting
  - Request date
- Requests sorted by wait time (oldest first)
- Direct link to transactions dashboard
- Actionable recommendations

**When it's sent:**
- Daily at 8:00 AM (configurable via cron schedule)
- Sent even if there are no pending requests (with success message)

## Setup

### 1. Environment Variables

Already configured in your `.env.local`:

```bash
# Email configuration (already set)
EMAIL_FROM="LibraAI <libraaismartlibraryassistant@gmail.com>"
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_TEMPLATE_ID=template_n9lg1lh
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e

# Base URL (already set)
NEXTAUTH_URL=http://localhost:3000

# Optional: Cron job security
CRON_SECRET=your-secret-here
```

### 2. Cron Job Configuration

#### Local Development (Manual Testing)

Test the digest manually:

```bash
# Test locally
curl http://localhost:3000/api/cron/admin-digests

# With cron secret (if configured)
curl -H "Authorization: Bearer your-secret-here" http://localhost:3000/api/cron/admin-digests
```

#### Production (Vercel Cron Jobs)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/due-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/admin-digests",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Schedule format:** `0 8 * * *` = Every day at 8:00 AM UTC

**Common schedules:**
- `0 8 * * *` - Daily at 8:00 AM
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight

#### Alternative: External Cron Service

Use services like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (free for public repos)

Example GitHub Actions workflow (`.github/workflows/admin-digests.yml`):

```yaml
name: Admin Daily Digests
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8:00 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-digests:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Admin Digests
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-app.vercel.app/api/cron/admin-digests
```

### 3. Admin User Configuration

Admins automatically receive digests if:
1. They have `role: "admin"` in the database
2. They have `emailNotifications: true` (or undefined, which defaults to enabled)

**Enable notifications for an admin:**

```javascript
// In MongoDB or via API
db.users.updateOne(
  { email: "admin@libra.ai" },
  { $set: { emailNotifications: true } }
)
```

**Disable notifications for an admin:**

```javascript
db.users.updateOne(
  { email: "admin@libra.ai" },
  { $set: { emailNotifications: false } }
)
```

## Email Templates

### Overdue Books Digest

**Subject:** `[Daily Digest] X overdue book(s)` or `[Daily Digest] No overdue books`

**Content:**
- Header with count
- Visual summary box
- List of overdue books (up to 20 shown)
- Color-coded urgency:
  - Red: 7+ days overdue
  - Orange: 3-7 days overdue
  - Light red: 1-3 days overdue
- Action button to view dashboard
- Recommended actions list

**Example:**

```
📚 Overdue Books Daily Digest
LibraAI Library

Your daily summary of overdue books.

┌─────────────────┐
│       3         │
│ Overdue books   │
└─────────────────┘

📕 "Introduction to Algorithms"
   Borrowed by: Jane Doe (jane@example.com)
   7 days overdue • Due: Oct 28, 2025

📕 "Clean Code"
   Borrowed by: John Smith (john@example.com)
   3 days overdue • Due: Nov 1, 2025

[View All Transactions]

Recommended Actions:
• Contact students with overdue books
• Send reminder emails for books overdue more than 3 days
• Review late fee policies if applicable
```

### Pending Requests Digest

**Subject:** `[Daily Digest] X pending borrow request(s)` or `[Daily Digest] No pending borrow requests`

**Content:**
- Header with count
- Visual summary box
- List of pending requests (up to 20 shown)
- Color-coded urgency:
  - Red: Waiting 3+ days
  - Orange: Waiting 1-3 days
  - Blue: Waiting less than 1 day
- Action button to review requests
- Recommended actions list

**Example:**

```
📋 Pending Borrow Requests Digest
LibraAI Library

Your daily summary of pending borrow requests awaiting approval.

┌─────────────────┐
│       2         │
│ Pending requests│
└─────────────────┘

📘 "Design Patterns"
   Requested by: Alice Johnson (alice@example.com)
   Waiting 3 days • Requested: Nov 2, 2025

📘 "The Pragmatic Programmer"
   Requested by: Bob Wilson (bob@example.com)
   Waiting 1 day • Requested: Nov 4, 2025

[Review & Approve Requests]

Recommended Actions:
• Review and approve/reject pending requests
• Prioritize requests that have been waiting longer
• Check book availability before approving
```

## Email Link Authentication

### How Links Work

When admins click links in digest emails (e.g., "Review & Approve Requests"):

**If admin is logged in:**
- ✅ Goes directly to `/admin/transactions?status=pending-approval`
- ✅ Filters applied automatically
- ✅ Ready to take action immediately

**If admin is NOT logged in:**
- ✅ Middleware detects no authentication
- ✅ Redirects to `/auth?redirect=/admin/transactions?status=pending-approval`
- ✅ Admin logs in
- ✅ Automatically redirected back to the original page with filters intact

**Security:**
- ✅ Middleware validates authentication on all `/admin/*` routes
- ✅ Auth page validates admin role before redirect
- ✅ Redirect parameter is validated (must start with `/admin`)
- ✅ Non-admins cannot access admin routes

This authentication flow is handled automatically by your existing middleware (`middleware.js`) and auth page (`src/app/auth/page.js`). No additional configuration needed!

## API Endpoint

### GET `/api/cron/admin-digests`

Sends both overdue books and pending requests digests to all admins.

**Authentication:**
- Optional: Bearer token via `Authorization` header
- Token must match `CRON_SECRET` environment variable

**Request:**

```bash
curl -X GET \
  -H "Authorization: Bearer your-secret-here" \
  https://your-app.vercel.app/api/cron/admin-digests
```

**Response:**

```json
{
  "ok": true,
  "message": "Admin digests processed",
  "results": {
    "admins": 2,
    "overdueBooks": 3,
    "pendingRequests": 2,
    "overdueDigest": {
      "sent": 2,
      "errors": []
    },
    "pendingDigest": {
      "sent": 2,
      "errors": []
    }
  },
  "timestamp": "2025-11-06T08:00:00.000Z"
}
```

**Error Response:**

```json
{
  "ok": false,
  "error": "Unauthorized"
}
```

## Testing

### 1. Manual Testing

Test the endpoint directly:

```bash
# Start your dev server
npm run dev

# In another terminal, trigger the cron job
curl http://localhost:3000/api/cron/admin-digests
```

### 2. Create Test Data

**Create overdue books:**

```javascript
// In MongoDB
db.transactions.insertOne({
  userId: "student@example.com",
  bookId: ObjectId("..."),
  status: "borrowed",
  borrowedAt: new Date("2025-10-01"),
  dueDate: new Date("2025-10-28"), // Past date
  requestedAt: new Date("2025-10-01")
})
```

**Create pending requests:**

```javascript
db.transactions.insertOne({
  userId: "student@example.com",
  bookId: ObjectId("..."),
  status: "pending-approval",
  requestedAt: new Date("2025-11-02"),
  requestedDueDate: new Date("2025-11-16")
})
```

### 3. Check Logs

Monitor the server logs for:

```
[Admin Digests] Found 2 admin(s) to notify
[Admin Digests] Found 3 overdue books
[Admin Digests] Found 2 pending requests
✅ Overdue digest sent to admin1@libra.ai
✅ Overdue digest sent to admin2@libra.ai
✅ Pending requests digest sent to admin1@libra.ai
✅ Pending requests digest sent to admin2@libra.ai
```

### 4. Verify Emails

Check admin inboxes for:
- Two emails per admin (overdue + pending)
- Correct counts and data
- Working dashboard links
- Proper formatting

## Troubleshooting

### No Emails Received

**Check admin users:**

```javascript
// Verify admins exist with notifications enabled
db.users.find({ 
  role: 'admin',
  emailNotifications: { $ne: false }
})
```

**Check email configuration:**

```bash
# Verify EmailJS credentials are set
echo $EMAILJS_SERVICE_ID
echo $EMAILJS_TEMPLATE_ID
echo $EMAILJS_PRIVATE_KEY
```

**Check server logs:**

```
[Admin Digests] No admin users found with email notifications enabled.
```

### Wrong Data in Digest

**Verify transaction statuses:**

```javascript
// Check overdue books
db.transactions.find({ 
  status: "borrowed",
  dueDate: { $lt: new Date() }
})

// Check pending requests
db.transactions.find({ 
  status: "pending-approval"
})
```

### Cron Job Not Running

**Vercel:**
1. Check `vercel.json` configuration
2. Verify deployment includes cron config
3. Check Vercel dashboard > Project > Cron Jobs

**External service:**
1. Verify cron schedule is active
2. Check service logs
3. Test endpoint manually

### Email Sending Errors

**Check EmailJS configuration:**

```bash
# Test email endpoint
curl http://localhost:3000/api/test-email
```

**Common errors:**
- `403 Forbidden` - Enable "Allow non-browser requests" in EmailJS dashboard
- `Invalid credentials` - Check EmailJS keys
- `Rate limit exceeded` - Add delays between emails (already implemented)

## Customization

### Change Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/admin-digests",
      "schedule": "0 9 * * 1-5"  // Weekdays at 9 AM
    }
  ]
}
```

### Customize Email Content

Edit `src/lib/admin-email-templates.js`:

```javascript
// Change library name
const DEFAULT_LIBRARY_NAME = 'Your Library Name';

// Modify email templates
export function buildOverdueBooksDigestEmail(input) {
  // Customize subject, HTML, text
}
```

### Add More Digest Types

Create new template functions in `admin-email-templates.js`:

```javascript
export function buildNewBooksDigestEmail(input) {
  // Your custom digest
}
```

Add to cron job in `src/app/api/cron/admin-digests/route.js`:

```javascript
// Add new digest logic
const newBooks = await books.find({ 
  createdAt: { $gte: yesterday } 
}).toArray();

// Send digest
```

### Filter Recipients

Modify `getAdminEmails()` in `route.js`:

```javascript
// Only send to specific admins
const admins = await db.collection('users')
  .find({ 
    role: 'admin',
    emailNotifications: { $ne: false },
    receiveDigests: true  // Add custom field
  })
  .toArray();
```

## Best Practices

### 1. Timing
- Send digests at the start of the workday (8-9 AM)
- Avoid weekends if library is closed
- Consider timezone of admins

### 2. Content
- Keep digests concise (show top 20 items)
- Use color coding for urgency
- Include actionable recommendations
- Provide direct links to dashboard

### 3. Frequency
- Daily for critical items (overdue, pending)
- Weekly for summaries (statistics, trends)
- Immediate for urgent alerts (security)

### 4. Performance
- Limit database queries
- Batch email sending
- Add delays to avoid rate limits
- Cache admin list if needed

### 5. Monitoring
- Log all digest sends
- Track email delivery success
- Monitor for errors
- Alert if digests fail

## Integration with Existing Features

### Works with:
- ✅ Security notifications (separate system)
- ✅ Due date reminders (separate cron job)
- ✅ Admin dashboard (links to transactions)
- ✅ Email notification preferences (respects user settings)
- ✅ Multiple admin support (sends to all admins)

### Database Collections Used:
- `users` - Admin emails and preferences
- `transactions` - Overdue and pending data
- `books` - Book details

### Email System:
- Uses same EmailJS configuration
- Same email templates system
- Same notification preferences

## Security

### Cron Job Protection

**Use CRON_SECRET:**

```bash
# .env.local
CRON_SECRET=your-random-secret-here
```

**Verify in requests:**

```javascript
const authHeader = request.headers.get("authorization");
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
```

### Data Privacy

- Admin emails never exposed to clients
- Only server-side processing
- No PII in logs (use IDs only)
- Respect email notification preferences

### Rate Limiting

- Built-in delays between emails (1 second)
- EmailJS has rate limits (check your plan)
- Consider queuing for large admin lists

## Monitoring & Analytics

### Track Metrics

Add logging to track:
- Digest send success rate
- Average overdue days
- Average pending wait time
- Admin engagement (click-through rates)

### Example Logging

```javascript
console.log(`[Admin Digests] Summary:
  - Admins notified: ${admins.length}
  - Overdue books: ${overdueBooks.length}
  - Pending requests: ${pendingRequests.length}
  - Emails sent: ${results.overdueDigest.sent + results.pendingDigest.sent}
  - Errors: ${results.overdueDigest.errors.length + results.pendingDigest.errors.length}
`);
```

### Dashboard Integration

Consider adding:
- Digest history page
- Email delivery status
- Admin engagement metrics
- Trend charts

## Summary

✅ **Implemented:**
- Overdue books daily digest
- Pending borrow requests digest
- Automatic admin discovery from database
- Email notification preferences support
- Multiple admin support
- Cron job endpoint
- Comprehensive error handling
- Professional email templates

✅ **Ready for:**
- Local testing
- Production deployment
- Vercel cron jobs
- External cron services

✅ **Benefits:**
- Admins stay informed without checking dashboard
- Critical issues highlighted daily
- Actionable recommendations included
- Scalable to multiple admins
- Respects user preferences

The admin daily digest system is now fully implemented and ready to help admins manage the library more efficiently! 📚✨
