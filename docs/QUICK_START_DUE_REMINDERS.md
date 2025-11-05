# Quick Start: Due Date Reminders

## What's New
Students now receive automatic email reminders for borrowed books at:
- 7 days before due
- 3 days before due  
- 1 day before due / due today

## For Students

### Enable/Disable Notifications
1. Go to **Student Dashboard**
2. Click **Profile & Settings** in sidebar
3. Toggle **Email notifications** checkbox
4. Click **Save changes**

Your preference is saved and the system will respect it.

## For Developers

### Test the System
```bash
# 1. Check current state
node scripts/test-due-reminders.js

# 2. Manually trigger reminders (local)
curl http://localhost:3000/api/cron/due-reminders

# 3. Check response
# Should see: { "ok": true, "results": { "sent": X, ... } }
```

### Create Test Data
To test reminders, create borrowed books with specific due dates:

```javascript
// In MongoDB or via admin panel
// Set dueDate to one of these:
const today = new Date();
const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);
```

### Automated Scheduling
The system is configured to run daily at 9 AM UTC via Vercel Cron (see `vercel.json`).

For other platforms, see `docs/DUE_DATE_REMINDERS.md` for setup instructions.

## Files Changed
- ✅ `src/app/api/user/profile/route.js` - Save/load email preferences
- ✅ `src/app/student/profile/page.js` - Profile toggle UI
- ✅ `src/app/api/cron/due-reminders/route.js` - Cron job endpoint
- ✅ `vercel.json` - Automated scheduling
- ✅ `.env.local` - Already has EMAILJS_DUE_TEMPLATE_ID

## Troubleshooting

**No emails received?**
- Check user has `emailNotifications: true` in database
- Verify due date is exactly 7, 3, 1, or 0 days from today
- Check EmailJS credentials in `.env.local`
- Run test script to diagnose: `node scripts/test-due-reminders.js`

**Cron not running?**
- Vercel: Check deployment logs
- Local: Run manually with curl command above
- Production: Verify CRON_SECRET if configured

## Next Steps
1. Test locally with curl
2. Create test borrowed books with appropriate due dates
3. Verify emails are sent
4. Deploy to production
5. Monitor Vercel cron logs

For detailed documentation, see `docs/DUE_DATE_REMINDERS.md`.
