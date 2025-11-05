# Testing Guide: Due Date Reminders

## Pre-Testing Checklist

### ✅ Environment Setup
```bash
# Verify all required environment variables are set
cat .env.local | grep EMAILJS
# Should show:
# EMAILJS_SERVICE_ID=service_wj7439o
# EMAILJS_TEMPLATE_ID=template_n9lg1lh
# EMAILJS_DUE_TEMPLATE_ID=template_ta93dtr
# EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
# EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
```

### ✅ Database Connection
```bash
# Run the test script to verify database access
node scripts/test-due-reminders.js
```

## Test 1: Student Profile Toggle

### Steps
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Login as a student:
   - Email: `student@demo.edu`
   - Password: (your demo password)

3. Navigate to **Profile & Settings**

4. Verify the "Email notifications" toggle:
   - Should be checked by default
   - Toggle it off
   - Click "Save changes"
   - Should see success toast

5. Refresh the page:
   - Toggle should remain in the state you saved

6. Check database:
   ```javascript
   // In MongoDB Compass or shell
   db.users.findOne({ email: "student@demo.edu" })
   // Should show: emailNotifications: false (or true)
   ```

### Expected Results
- ✅ Toggle state persists after save
- ✅ Toast notification appears
- ✅ Database field updates correctly
- ✅ Page reload shows saved state

## Test 2: Create Test Borrowed Books

### Option A: Via Admin Panel
1. Login as admin
2. Go to **Transactions**
3. Approve a pending request or create a new borrow
4. Set due date to one of:
   - 7 days from today
   - 3 days from today
   - Tomorrow
   - Today

### Option B: Via MongoDB
```javascript
// Connect to your database
const today = new Date();
today.setHours(0, 0, 0, 0);

// Calculate target dates
const weekFromNow = new Date(today);
weekFromNow.setDate(weekFromNow.getDate() + 7);

const threeDaysFromNow = new Date(today);
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// Update a transaction
db.transactions.updateOne(
  { _id: ObjectId("YOUR_TRANSACTION_ID") },
  { 
    $set: { 
      status: "borrowed",
      dueDate: weekFromNow,  // or threeDaysFromNow, tomorrow, today
      borrowedAt: new Date()
    }
  }
);
```

## Test 3: Run Diagnostic Script

```bash
node scripts/test-due-reminders.js
```

### Expected Output
```
🔍 Testing Due Date Reminders System

═══════════════════════════════════════════════════════════

1️⃣  Checking user email notification preferences...
   ✅ Total users: 5
   📧 Email notifications enabled: 4
   🔕 Email notifications disabled: 1

2️⃣  Checking borrowed books...
   📚 Total borrowed books: 3

3️⃣  Analyzing due dates for reminder windows...
   📅 Due in 7 days (week reminder): 1
      - student@demo.edu | Due: 2025-11-12 | Notifications: ✅
   📅 Due in 3 days (three-day reminder): 1
      - student2@demo.edu | Due: 2025-11-08 | Notifications: ✅
   📅 Due tomorrow (tomorrow reminder): 0
   📅 Due today (due today reminder): 1
      - student3@demo.edu | Due: 2025-11-05 | Notifications: ❌
   ⚠️  Overdue: 0
   📆 Other due dates: 0

4️⃣  Checking environment variables...
   ✅ EMAILJS_SERVICE_ID: Set
   ✅ EMAILJS_DUE_TEMPLATE_ID: Set
   ✅ EMAILJS_PUBLIC_KEY: Set
   ✅ EMAILJS_PRIVATE_KEY: Set
   ✅ NEXTAUTH_URL: Set

═══════════════════════════════════════════════════════════

📊 Summary:
   • Books in reminder windows: 3
   • Will receive reminders: 2
   • Environment configured: ✅ Yes

✅ Ready to send reminders! Run the cron job:
   curl http://localhost:3000/api/cron/due-reminders
```

## Test 4: Manually Trigger Cron Job

### Local Testing
```bash
# Make sure dev server is running
npm run dev

# In another terminal, trigger the cron job
curl http://localhost:3000/api/cron/due-reminders
```

### Expected Response
```json
{
  "ok": true,
  "message": "Due reminders processed",
  "results": {
    "processed": 3,
    "sent": 2,
    "skipped": 1,
    "errors": []
  },
  "timestamp": "2025-11-05T09:00:00.000Z"
}
```

### Verify Emails
1. Check the inbox for `student@demo.edu`
2. Should receive email with:
   - Subject: "Reminder: [Book Title] is due in X days"
   - Body: Personalized reminder with book details
   - Link to "View borrowed books"

## Test 5: Test Different Reminder Phases

### Week Reminder (7 days)
```bash
# Create book due in 7 days
# Run cron job
# Check email subject contains "due in 7 days"
```

### Three-Day Reminder
```bash
# Create book due in 3 days
# Run cron job
# Check email subject contains "due in 3 days"
```

### Tomorrow Reminder
```bash
# Create book due tomorrow
# Run cron job
# Check email subject contains "due tomorrow"
```

### Due Today Reminder
```bash
# Create book due today
# Run cron job
# Check email subject contains "Due today"
```

## Test 6: Test User Opt-Out

### Steps
1. Login as student
2. Go to Profile & Settings
3. Uncheck "Email notifications"
4. Save changes
5. Create a borrowed book due in 7 days for this user
6. Run cron job
7. Verify NO email is sent to this user

### Expected Results
- ✅ Cron job response shows `skipped: 1`
- ✅ No email received
- ✅ Other users with notifications enabled still receive emails

## Test 7: Production Deployment Test

### After Deploying to Vercel

1. **Check Vercel Cron Configuration**
   ```bash
   # In Vercel dashboard
   # Go to Project → Settings → Cron Jobs
   # Should see: /api/cron/due-reminders running daily at 9 AM UTC
   ```

2. **Manual Trigger (Production)**
   ```bash
   curl https://your-domain.com/api/cron/due-reminders
   ```

3. **With Authorization**
   ```bash
   # If CRON_SECRET is set
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
        https://your-domain.com/api/cron/due-reminders
   ```

4. **Check Logs**
   - Go to Vercel dashboard
   - View function logs
   - Look for cron execution logs

## Troubleshooting

### No Emails Sent
**Check:**
- [ ] User has `emailNotifications: true` in database
- [ ] Due date is EXACTLY 7, 3, 1, or 0 days from today (not approximate)
- [ ] Transaction status is "borrowed"
- [ ] EmailJS credentials are correct
- [ ] Book exists in database

**Debug:**
```bash
# Run diagnostic script
node scripts/test-due-reminders.js

# Check specific user
db.users.findOne({ email: "student@demo.edu" })

# Check specific transaction
db.transactions.findOne({ userId: "student@demo.edu", status: "borrowed" })
```

### Wrong Reminder Phase
**Issue:** Book due in 7 days but received 3-day reminder

**Cause:** Date comparison uses date-only (ignores time)

**Fix:**
```javascript
// Ensure due dates are set to midnight
const dueDate = new Date("2025-11-12");
dueDate.setHours(0, 0, 0, 0);
```

### Cron Job Not Running
**Check:**
- [ ] `vercel.json` is committed and deployed
- [ ] Vercel plan supports cron jobs (Hobby plan: yes)
- [ ] Check Vercel dashboard for cron job status
- [ ] Review deployment logs

**Manual Test:**
```bash
# Test endpoint directly
curl https://your-domain.com/api/cron/due-reminders
```

### EmailJS Errors
**Common Issues:**
- Invalid template ID
- Incorrect public/private keys
- Template variables mismatch
- Rate limiting (free tier: 200 emails/month)

**Debug:**
```javascript
// Check EmailJS dashboard
// Verify template exists: template_ta93dtr
// Check template variables match code
```

## Success Criteria

### ✅ All Tests Pass When:
1. Profile toggle saves and loads correctly
2. Diagnostic script shows books in reminder windows
3. Cron job returns successful response
4. Emails are received with correct content
5. Users with notifications disabled don't receive emails
6. All 4 reminder phases work (7, 3, 1, 0 days)
7. Production cron runs automatically daily

## Next Steps After Testing
1. Monitor first few days of production cron runs
2. Check email delivery rates
3. Gather user feedback on reminder timing
4. Consider adding more reminder preferences (e.g., custom intervals)
5. Add analytics/logging for sent reminders

## Quick Test Commands

```bash
# Full test sequence
npm run dev                                    # Start server
node scripts/test-due-reminders.js            # Check status
curl http://localhost:3000/api/cron/due-reminders  # Trigger
# Check email inbox

# Production test
curl https://your-domain.com/api/cron/due-reminders
```

Happy testing! 🎉
