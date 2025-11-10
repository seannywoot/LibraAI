# Rejection Email with Reason - Test Guide

## Feature Overview
When an admin rejects a borrow request, the rejection reason is automatically included in the email notification sent to the student.

## How It Works

### Admin Workflow
1. Admin navigates to Admin > Transactions
2. Finds a "Pending Approval" transaction
3. Clicks "Reject" button
4. Dialog appears asking for rejection reason
5. Admin enters reason (e.g., "Book is currently being repaired")
6. Admin clicks "Submit Reason"
7. System sends email to student with the rejection reason

### Email Content
The rejection email includes:
- **Subject:** "Request Not Approved: [Book Title]"
- **Body:** Notification that request was not approved
- **Reason Box:** Red-bordered box displaying the admin's rejection reason
- **Browse Books Link:** Link to browse other available books
- **Support Contact:** Library support email

## Test Scenarios

### Test 1: Reject with Reason
**Steps:**
1. As admin, reject a pending borrow request
2. Enter reason: "This book is currently reserved for a class"
3. Submit the rejection
4. Check student's email inbox

**Expected Result:**
- Student receives email with subject "Request Not Approved: [Book Title]"
- Email body contains red box with text: "Reason: This book is currently reserved for a class"
- Email includes link to browse other books

### Test 2: Reject with Short Reason
**Steps:**
1. As admin, reject a pending borrow request
2. Enter reason: "Unavailable"
3. Submit the rejection
4. Check student's email

**Expected Result:**
- Email displays: "Reason: Unavailable"
- No formatting issues with short text

### Test 3: Reject with Maximum Length Reason
**Steps:**
1. As admin, reject a pending borrow request
2. Enter 100 character reason (max length)
3. Submit the rejection
4. Check student's email

**Expected Result:**
- Full reason is displayed in email
- Text wraps properly in the reason box
- No truncation occurs

### Test 4: Email Notifications Disabled
**Steps:**
1. Student has `emailNotifications: false` in their user profile
2. Admin rejects their borrow request with a reason
3. Check email inbox

**Expected Result:**
- No email is sent (respects user preference)
- Rejection is still recorded in database
- Reason is visible in admin panel

## Email Template Preview

### HTML Version
```
Request Not Approved
LibraAI Library

Hi [Student Name],

Your borrow request for [Book Title] by [Author] was not approved at this time.

┌─────────────────────────────────────┐
│ Reason: [Admin's rejection reason]  │
└─────────────────────────────────────┘
(Red background box)

[Browse Other Books] (Button)

If you have questions about this decision, please contact us.
Have questions? Contact us at support@libra.ai.
```

### Text Version
```
LibraAI Library — Request Not Approved

Hi [Student Name],

Unfortunately, your borrow request for "[Book Title]" by [Author] was not approved at this time.

Reason: [Admin's rejection reason]

Browse Other Books: [URL]

If you have questions about this decision, please contact us.
Contact: support@libra.ai.
```

## Code Flow

1. **UI:** `src/app/admin/transactions/page.js`
   - Admin enters reason in textarea
   - Reason validated (min 3 chars, max 100 chars)
   - Sent to API via `handleAction()`

2. **API:** `src/app/api/admin/transactions/route.js`
   - Receives `reason` parameter
   - Validates and trims reason
   - Stores as `rejectionReason` in transaction
   - Calls `buildRequestDeniedEmail()` with reason

3. **Email Template:** `src/lib/email-templates.js`
   - `buildRequestDeniedEmail()` function
   - Creates HTML with red reason box
   - Creates text version with reason line
   - Returns formatted email

4. **Email Service:** `src/lib/email.js`
   - Sends email via configured service
   - Includes both HTML and text versions

## Database Verification

After rejection, check the transaction document:
```javascript
{
  _id: ObjectId("..."),
  status: "rejected",
  rejectionReason: "Book is currently being repaired",
  rejectedAt: ISODate("..."),
  rejectedBy: "admin@example.com",
  // ... other fields
}
```

## Troubleshooting

### Reason Not Showing in Email
- Check that reason was provided (not empty)
- Verify email template includes `reason` parameter
- Check email service logs for errors

### Email Not Received
- Verify student's email address is correct
- Check student's `emailNotifications` setting
- Review email service configuration
- Check spam/junk folder

### Validation Errors
- Reason must be at least 3 characters
- Reason must be 100 characters or less
- Reason is required (cannot be empty)

## Related Files
- `src/app/admin/transactions/page.js` - Admin UI
- `src/app/api/admin/transactions/route.js` - API endpoint
- `src/lib/email-templates.js` - Email template
- `src/lib/email.js` - Email sending service
