# Due Date Reminders System

## Overview
The due date reminders system automatically sends email notifications to students about their borrowed books at strategic intervals before the due date.

## Reminder Schedule
- **7 days before due**: Week reminder
- **3 days before due**: Three-day reminder  
- **1 day before due**: Tomorrow reminder
- **0 days (due date)**: Due today reminder

## Student Profile Toggle
Students can enable/disable email notifications in their profile settings:
- Navigate to **Student Dashboard → Profile & Settings**
- Toggle the **Email notifications** checkbox
- Click **Save changes**

The preference is stored in the database and respected by the cron job.

## Environment Variables
Required in `.env.local`:
```
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_DUE_TEMPLATE_ID=template_ta93dtr
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
NEXTAUTH_URL=http://localhost:3000
EMAIL_FROM="LibraAI <libraaismartlibraryassistant@gmail.com>"
CRON_SECRET=your-secret-here (optional, for production security)
```

## Cron Job Endpoint
**Endpoint**: `GET /api/cron/due-reminders`

### Local Testing
```bash
curl http://localhost:3000/api/cron/due-reminders
```

### With Authorization (Production)
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/due-reminders
```

### Response Format
```json
{
  "ok": true,
  "message": "Due reminders processed",
  "results": {
    "processed": 10,
    "sent": 5,
    "skipped": 3,
    "errors": []
  },
  "timestamp": "2025-11-05T10:00:00.000Z"
}
```

## Setting Up Automated Scheduling

### Option 1: Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/due-reminders",
    "schedule": "0 9 * * *"
  }]
}
```
This runs daily at 9:00 AM UTC.

### Option 2: External Cron Service
Use services like:
- **cron-job.org**: Free, reliable cron service
- **EasyCron**: Simple scheduling interface
- **GitHub Actions**: Free for public repos

Example GitHub Actions workflow (`.github/workflows/due-reminders.yml`):
```yaml
name: Due Date Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron Job
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/due-reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 3: Server Cron (Linux)
```bash
# Edit crontab
crontab -e

# Add line (runs daily at 9 AM)
0 9 * * * curl -H "Authorization: Bearer YOUR_SECRET" https://your-domain.com/api/cron/due-reminders
```

## Email Template Structure
The system uses the EmailJS template `template_ta93dtr` with these variables:
- `to_email`: Recipient email
- `student_name`: Student's name
- `book_title`: Book title
- `book_author`: Book author
- `borrow_date`: When book was borrowed
- `due_date`: When book is due
- `days_until_due`: Number of days (7, 3, 1, or 0)
- `phase`: Reminder phase (week, three_days, one_day_or_due)
- `phase_label`: Human-readable label
- `view_borrowed_url`: Link to My Library page
- `library_name`: "LibraAI Library"
- `support_email`: Support contact

## Database Schema

### Users Collection
```javascript
{
  email: "student@demo.edu",
  name: "John Doe",
  emailNotifications: true,  // New field
  // ... other fields
}
```

### Transactions Collection
```javascript
{
  userId: "student@demo.edu",
  bookId: ObjectId("..."),
  status: "borrowed",
  borrowedAt: ISODate("2025-10-29T00:00:00Z"),
  dueDate: ISODate("2025-11-12T00:00:00Z"),
  // ... other fields
}
```

## Testing

### Manual Test
1. Create a borrowed book with due date 7 days from today
2. Run the cron job: `curl http://localhost:3000/api/cron/due-reminders`
3. Check email inbox for reminder

### Test Different Phases
```javascript
// In MongoDB or via admin panel, set due dates:
// Week reminder: today + 7 days
// Three-day reminder: today + 3 days
// Tomorrow reminder: today + 1 day
// Due today: today
```

## Troubleshooting

### No emails sent
- Check `emailNotifications` is `true` in user document
- Verify EmailJS credentials in `.env.local`
- Check transaction has `status: "borrowed"`
- Ensure `dueDate` matches reminder window (exactly 7, 3, 1, or 0 days from today)

### Wrong reminder phase
- The system uses date-only comparison (ignores time)
- Due date must match exactly (not within range)

### Cron job not running
- Verify deployment platform supports cron jobs
- Check cron schedule syntax
- Review platform logs for errors
- Test endpoint manually first

## Security Notes
- Set `CRON_SECRET` in production to prevent unauthorized access
- The endpoint checks `Authorization: Bearer <CRON_SECRET>` header
- Only processes transactions with `status: "borrowed"`
- Respects user's `emailNotifications` preference
