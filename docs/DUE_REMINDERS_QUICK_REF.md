# Due Date Reminders - Quick Reference Card

## 🎯 What It Does
Automatically sends email reminders to students at **7 days, 3 days, 1 day, and 0 days** before borrowed books are due.

## 🔑 Key Files
```
src/app/student/profile/page.js          → Student toggle UI
src/app/api/user/profile/route.js        → Save/load preferences
src/app/api/cron/due-reminders/route.js  → Cron job logic
vercel.json                               → Automated scheduling
scripts/test-due-reminders.js            → Testing script
```

## ⚡ Quick Commands

```bash
# Test system status
node scripts/test-due-reminders.js

# Trigger manually (local)
curl http://localhost:3000/api/cron/due-reminders

# Trigger manually (production)
curl https://your-domain.com/api/cron/due-reminders

# With authorization
curl -H "Authorization: Bearer YOUR_SECRET" \
     https://your-domain.com/api/cron/due-reminders
```

## 📧 Email Template
**Template ID**: `template_ta93dtr` (already in `.env.local`)

## 🔄 Reminder Schedule
| Days Before Due | Phase | Subject Example |
|----------------|-------|-----------------|
| 7 days | `week` | "Reminder: Book is due in 7 days" |
| 3 days | `three_days` | "Reminder: Book is due in 3 days" |
| 1 day | `one_day_or_due` | "Urgent: Book is due tomorrow" |
| 0 days | `one_day_or_due` | "Due today: Book" |

## 🎛️ Student Controls
1. Go to **Profile & Settings**
2. Toggle **Email notifications**
3. Click **Save changes**

## 🔍 Troubleshooting

### No emails?
```bash
# Check status
node scripts/test-due-reminders.js

# Verify user preference
db.users.findOne({ email: "student@demo.edu" })
# Should show: emailNotifications: true

# Check due dates
db.transactions.find({ status: "borrowed" })
# Due date must be EXACTLY 7, 3, 1, or 0 days from today
```

### Cron not running?
- Check `vercel.json` is deployed
- View Vercel dashboard → Cron Jobs
- Test endpoint manually

## 📊 Response Format
```json
{
  "ok": true,
  "results": {
    "processed": 10,  // Books checked
    "sent": 7,        // Emails sent
    "skipped": 3,     // Users opted out
    "errors": []      // Any errors
  }
}
```

## ✅ Testing Checklist
- [ ] Profile toggle works
- [ ] Preference saves to database
- [ ] Diagnostic script runs
- [ ] Cron job returns success
- [ ] Emails received
- [ ] Opt-out respected

## 🚀 Production Setup
1. Deploy to Vercel
2. Set `CRON_SECRET` (optional)
3. Verify cron runs at 9 AM UTC
4. Monitor logs

## 📚 Full Documentation
- `docs/DUE_DATE_REMINDERS.md` - Complete guide
- `docs/TESTING_DUE_REMINDERS.md` - Testing procedures
- `docs/DUE_REMINDERS_COMPLETE.md` - Full overview

---
**Status**: ✅ Ready | **Environment**: Configured | **Schedule**: Daily 9 AM UTC
