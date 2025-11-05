# EmailJS Templates for LibraAI

You need to create these templates in your EmailJS dashboard at https://dashboard.emailjs.com/

## Template 1: Request Approved (template_request_approved)

**Template Name**: Request Approved  
**Template ID**: `template_request_approved` (or your choice)

### Subject Line:
```
Request Approved: "{{book_title}}"
```

### Email Body:
```
{{library_name}} — Request Approved

Hi {{student_name}},

Great news! Your borrow request for "{{book_title}}" by {{book_author}} has been approved.

Due Date: {{due_date}}

View My Library: {{view_borrowed_url}}

Please return the book by the due date to avoid any late fees.

Questions? Contact us at {{support_email}}.

---
You're receiving this because you requested to borrow this book.
```

### Variables Used:
- `{{library_name}}` - "LibraAI Library"
- `{{student_name}}` - Student's name
- `{{book_title}}` - Book title
- `{{book_author}}` - Book author
- `{{due_date}}` - Due date (formatted)
- `{{view_borrowed_url}}` - Link to My Library
- `{{support_email}}` - Support email
- `{{to_email}}` - Recipient email (auto-filled)

---

## Template 2: Request Denied (template_request_denied)

**Template Name**: Request Denied  
**Template ID**: `template_request_denied` (or your choice)

### Subject Line:
```
Request Not Approved: "{{book_title}}"
```

### Email Body:
```
{{library_name}} — Request Not Approved

Hi {{student_name}},

Unfortunately, your borrow request for "{{book_title}}" by {{book_author}} was not approved at this time.

{{#if reason}}
Reason: {{reason}}
{{/if}}

Browse Other Books: {{browse_url}}

If you have questions about this decision, please contact us.

Contact: {{support_email}}

---
You're receiving this because you requested to borrow this book.
```

### Variables Used:
- `{{library_name}}` - "LibraAI Library"
- `{{student_name}}` - Student's name
- `{{book_title}}` - Book title
- `{{book_author}}` - Book author
- `{{reason}}` - Reason for denial (optional)
- `{{browse_url}}` - Link to browse books
- `{{support_email}}` - Support email
- `{{to_email}}` - Recipient email (auto-filled)

---

## Template 3: Return Confirmation (template_return_confirmation)

**Template Name**: Return Confirmation  
**Template ID**: `template_return_confirmation` (or your choice)

### Subject Line:
```
Book Returned: "{{book_title}}"
```

### Email Body:
```
{{library_name}} — Book Returned Successfully

Hi {{student_name}},

Thank you for returning "{{book_title}}" by {{book_author}}.

{{#if borrow_date}}
Borrowed: {{borrow_date}}
{{/if}}
Returned: {{return_date}}

View Borrowing History: {{view_history_url}}

We hope you enjoyed the book! Feel free to borrow more anytime.

Questions? Contact us at {{support_email}}.

---
This is a confirmation that your book return was processed.
```

### Variables Used:
- `{{library_name}}` - "LibraAI Library"
- `{{student_name}}` - Student's name
- `{{book_title}}` - Book title
- `{{book_author}}` - Book author
- `{{borrow_date}}` - Borrow date (formatted, optional)
- `{{return_date}}` - Return date (formatted)
- `{{view_history_url}}` - Link to borrowing history
- `{{support_email}}` - Support email
- `{{to_email}}` - Recipient email (auto-filled)

---

## How to Create Templates in EmailJS

1. Go to https://dashboard.emailjs.com/
2. Click on **Email Templates** in the left sidebar
3. Click **Create New Template**
4. Enter the template name and content from above
5. Save the template
6. Copy the **Template ID** (e.g., `template_request_approved`)
7. Add the Template ID to your `.env.local` file

---

## Environment Variables to Add

Add these to your `.env.local` file:

```bash
# Email Templates
EMAILJS_REQUEST_APPROVED_TEMPLATE_ID=template_request_approved
EMAILJS_REQUEST_DENIED_TEMPLATE_ID=template_request_denied
EMAILJS_RETURN_CONFIRMATION_TEMPLATE_ID=template_return_confirmation
```

**Note**: For now, the code uses the default `EMAILJS_TEMPLATE_ID` for all three. If you want separate templates, you'll need to update the code to use these specific template IDs.

---

## Simplified Version (Use Default Template)

If you don't want to create 3 separate templates, you can use the default `EMAILJS_TEMPLATE_ID` (template_n9lg1lh) for all notifications. The code will send the HTML/text content directly, and EmailJS will use the template as a wrapper.

This is the **easiest approach** and requires no additional setup!

---

## Testing

After creating the templates, test them:

```bash
# Test approval email
# 1. Create a borrow request as student
# 2. Approve it as admin
# 3. Check email inbox

# Test rejection email
# 1. Create a borrow request as student
# 2. Reject it as admin
# 3. Check email inbox

# Test return confirmation
# 1. Have an active borrowed book
# 2. Mark it as returned as admin
# 3. Check email inbox
```

---

## Current Status

✅ **Code is ready** - Email notifications are wired into the system  
✅ **Templates provided** - Use the templates above  
⚪ **EmailJS setup** - Create templates in EmailJS dashboard (optional)

The system will work with your existing default template. Creating separate templates is optional but recommended for better organization.
