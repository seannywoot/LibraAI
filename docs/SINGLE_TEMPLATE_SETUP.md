# Single EmailJS Template Setup ✅

## Overview

All email notifications now use **ONE EmailJS template** (`template_n9lg1lh`) with dynamic content. This solves the free tier template limit and simplifies maintenance.

---

## 📧 All Emails Using One Template

| Email Type | Subject | Content | Status |
|------------|---------|---------|--------|
| Request Approved | "Request Approved: [Book]" | Approval message | ✅ Working |
| Request Denied | "Request Not Approved: [Book]" | Denial message | ✅ Working |
| Return Confirmation | "Book Returned: [Book]" | Return receipt | ✅ Working |
| Due in 7 Days | "Reminder: [Book] due in 7 days" | Week reminder | ✅ Working |
| Due in 3 Days | "Reminder: [Book] due in 3 days" | 3-day reminder | ✅ Working |
| Due Tomorrow | "Urgent: [Book] due tomorrow" | Tomorrow reminder | ✅ Working |
| Due Today | "Due today: [Book]" | Due today reminder | ✅ Working |
| Password Reset | "Password Reset" | Reset link | ✅ Working |

---

## 🎯 EmailJS Template Setup

### Template ID: `template_n9lg1lh`

**Subject:**
```
{{subject}}
```

**Content:**
```
{{{message_html}}}
```

**Important:** Use **triple curly braces** `{{{ }}}` to render HTML properly!

---

## ✅ Benefits

### 1. **No Template Limit Issues**
- Free tier allows 2-3 templates
- We only use 1 template for everything
- No need to upgrade EmailJS plan

### 2. **Consistent Styling**
- All emails have the same wrapper
- Professional and cohesive look
- Easy to update branding

### 3. **Easier Maintenance**
- Update one template, affects all emails
- No need to sync multiple templates
- Less room for errors

### 4. **Production Ready**
- Works perfectly in production
- No configuration changes needed
- Scales with your application

### 5. **No Interference**
- Cron job works exactly the same
- Real-time emails work the same
- All emails respect user preferences

---

## 🔧 How It Works

### Code Side:
```javascript
// Every email sends:
await sendMail({
  to: "student@example.com",
  subject: "Request Approved: Book Title",  // Dynamic subject
  html: "<div>Full HTML content...</div>",   // Dynamic HTML
  text: "Plain text version...",             // Dynamic text
  templateParams: { /* variables */ }
});
```

### EmailJS Side:
```
Template receives:
- {{subject}} → "Request Approved: Book Title"
- {{{message_html}}} → Renders the full HTML content
```

### Result:
- ✅ Dynamic subject line
- ✅ Dynamic HTML content
- ✅ Proper formatting and styling
- ✅ Clickable links
- ✅ Mobile responsive

---

## 🧪 Testing

All email types work with the same template:

```bash
# Test approval email
1. Request book as student
2. Approve as admin
3. Check email ✅

# Test due date reminder
1. Set book due in 1 day
2. Run: curl http://localhost:3000/api/cron/due-reminders
3. Check email ✅

# Test return confirmation
1. Have borrowed book
2. Mark as returned as admin
3. Check email ✅
```

---

## 📋 Environment Variables

### Required:
```bash
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_TEMPLATE_ID=template_n9lg1lh  # ← Only template needed!
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
```

### No Longer Needed:
```bash
# EMAILJS_DUE_TEMPLATE_ID=template_ta93dtr  # ← Not used anymore
```

You can keep `EMAILJS_DUE_TEMPLATE_ID` in your `.env.local` (it won't hurt), but it's not used by the code anymore.

---

## 🚀 Production Deployment

### Vercel Environment Variables:
Set these in Vercel dashboard:
- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID` (template_n9lg1lh)
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `NEXTAUTH_URL` (your production URL)
- `EMAIL_FROM`

### No Special Configuration:
- ✅ Cron job runs automatically at 9 AM UTC
- ✅ Real-time emails send immediately
- ✅ All emails use the same template
- ✅ No template switching logic needed

---

## 🎨 Customizing the Template

If you want to add branding or styling to ALL emails:

1. Go to EmailJS dashboard
2. Edit `template_n9lg1lh`
3. Add header/footer around `{{{message_html}}}`:

```html
<div style="background:#f5f5f5;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:white;padding:20px;">
    {{{message_html}}}
  </div>
  <div style="text-align:center;color:#999;font-size:12px;margin-top:20px;">
    © 2025 LibraAI Library
  </div>
</div>
```

This wrapper will apply to ALL emails automatically!

---

## 🔒 Security & Privacy

- ✅ Respects user's `emailNotifications` preference
- ✅ Only sends to verified email addresses
- ✅ No sensitive data in email content
- ✅ Secure EmailJS API communication

---

## 📊 Email Flow Diagram

```
┌─────────────────────────────────────────┐
│  Any Email Notification Triggered       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Code generates:                         │
│  - Dynamic subject                       │
│  - Dynamic HTML content                  │
│  - Dynamic text content                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  sendMail() function                     │
│  - Packages everything                   │
│  - Sends to EmailJS API                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  EmailJS Template (template_n9lg1lh)     │
│  - Uses {{subject}} for subject          │
│  - Uses {{{message_html}}} for body      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Email Delivered to Student              │
│  ✅ Correct subject                      │
│  ✅ Correct content                      │
│  ✅ Proper formatting                    │
└─────────────────────────────────────────┘
```

---

## ✨ Summary

**Before:**
- ❌ Needed multiple templates
- ❌ Hit free tier limit
- ❌ Complex template management

**After:**
- ✅ One template for everything
- ✅ No template limit issues
- ✅ Simple and maintainable
- ✅ Production ready
- ✅ Works in local and production

---

## 🎉 Ready to Use!

The system is fully configured and ready for production. All emails will:
- Use the same template
- Have dynamic content
- Respect user preferences
- Work in local and production
- Scale with your application

No additional setup required!
