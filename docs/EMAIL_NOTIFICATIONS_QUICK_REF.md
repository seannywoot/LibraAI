# Email Notifications - Quick Reference

## 📧 All Email Notifications

| Type | Trigger | When Sent | Template Variables |
|------|---------|-----------|-------------------|
| **Request Approved** | Admin approves request | Immediate | book_title, book_author, due_date, student_name |
| **Request Denied** | Admin rejects request | Immediate | book_title, book_author, reason, student_name |
| **Return Confirmation** | Admin marks returned | Immediate | book_title, book_author, return_date, borrow_date |
| **Due in 7 Days** | Cron job | Daily 9 AM UTC | book_title, due_date, days_until_due: 7 |
| **Due in 3 Days** | Cron job | Daily 9 AM UTC | book_title, due_date, days_until_due: 3 |
| **Due Tomorrow** | Cron job | Daily 9 AM UTC | book_title, due_date, days_until_due: 1 |
| **Due Today** | Cron job | Daily 9 AM UTC | book_title, due_date, days_until_due: 0 |

## 🎯 Quick Test Commands

```bash
# Test due date reminders (manual trigger)
curl http://localhost:3000/api/cron/due-reminders

# Test approval/rejection/return emails
# 1. Create request as student
# 2. Approve/Reject/Return as admin
# 3. Check email inbox
```

## ⚙️ Environment Variables

```bash
# Required (already set)
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_TEMPLATE_ID=template_n9lg1lh
EMAILJS_DUE_TEMPLATE_ID=template_ta93dtr
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
NEXTAUTH_URL=http://localhost:3000
EMAIL_FROM="LibraAI <libraaismartlibraryassistant@gmail.com>"
```

## 🔧 User Control

Students can enable/disable ALL email notifications:
- Go to **Profile & Settings**
- Toggle **Email notifications**
- Click **Save changes**

When disabled, NO emails are sent (due reminders, approvals, returns, etc.)

## 📁 Key Files

```
src/lib/email-templates.js          → Email content builders
src/lib/email.js                     → EmailJS sender
src/app/api/admin/transactions/route.js  → Approval/rejection/return emails
src/app/api/cron/due-reminders/route.js  → Due date reminder emails
src/app/student/profile/page.js      → Notification toggle UI
```

## 🎨 Email Template Variables

### Common to All:
- `{{to_email}}` - Recipient
- `{{student_name}}` - Student's name
- `{{library_name}}` - "LibraAI Library"
- `{{support_email}}` - Support contact

### Book-Specific:
- `{{book_title}}` - Book title
- `{{book_author}}` - Book author
- `{{due_date}}` - Due date (formatted)
- `{{borrow_date}}` - Borrow date (formatted)
- `{{return_date}}` - Return date (formatted)

### Links:
- `{{view_borrowed_url}}` - My Library page
- `{{view_history_url}}` - Borrowing history
- `{{browse_url}}` - Browse books

## 🚨 Troubleshooting

**No emails sent?**
- Check user has `emailNotifications: true` in database
- Verify EmailJS credentials in `.env.local`
- Check server console for errors

**Wrong content?**
- Update EmailJS template to match variable names
- Use underscores: `{{book_title}}` not `{{bookTitle}}`

**Emails go to spam?**
- Check EmailJS sender reputation
- Verify EMAIL_FROM address
- Add SPF/DKIM records (advanced)

## ✅ Status

- ✅ Due date reminders (7, 3, 1, 0 days)
- ✅ Request approved notifications
- ✅ Request denied notifications
- ✅ Return confirmation emails
- ✅ User preference toggle
- ✅ Respects opt-out settings

## 📚 Documentation

- `docs/DUE_DATE_REMINDERS.md` - Due date system details
- `docs/NEW_EMAIL_NOTIFICATIONS.md` - New notifications overview
- `docs/EMAILJS_TEMPLATES.md` - Template setup guide
- `docs/TESTING_DUE_REMINDERS.md` - Testing procedures

---

**All systems operational!** 🎉
