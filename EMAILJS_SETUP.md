# EmailJS Setup Guide

This project uses EmailJS for sending password reset emails. Follow these steps to configure it.

## 1. Create an EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for a free account (300 emails/month)
3. Verify your email address

## 2. Add an Email Service

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the provider-specific setup instructions
5. Note your **Service ID** (e.g., `service_abc123`)

## 3. Create an Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use this template structure:

### Template Variables

Your template should include these variables:

```
To: {{to_email}}
From: {{from_name}} <{{reply_to}}>
Subject: {{subject}}

Body (HTML):
{{{message_html}}}

Or plain text:
{{message}}
```

### Example Template for Password Reset

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>{{app_name}} Password Reset</h2>
    <p>You requested a password reset for your {{app_name}} account.</p>
    <p>
      <a href="{{reset_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Your Password
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">
      This link expires in {{expires_minutes}} minutes. If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
```

4. Save the template and note your **Template ID** (e.g., `template_xyz789`)

## 4. Enable Server-Side Access (CRITICAL)

**This step is required for server-side email sending:**

1. Go to **Account** > **Security** in the EmailJS dashboard
2. Find the **"Allow non-browser requests"** option
3. **Enable it** - This allows your Next.js server to send emails
4. Save the changes

Without this setting enabled, you'll get a 403 error: "API calls are disabled for non-browser applications"

## 5. Get Your API Keys

1. Go to **Account** > **General**
   - Copy your **Public Key** (e.g., `abcdefghij123456`)

2. Go to **Account** > **API Keys**
   - Click **Create New Private Key** if you don't have one
   - Copy the **Private Key** (e.g., `xxxxxxxxxxxxxxxxxx`)
   - Keep this secret - never commit it to version control

## 6. Configure Environment Variables

Add these to your `.env.local` file:

```env
EMAILJS_SERVICE_ID="service_abc123"
EMAILJS_TEMPLATE_ID="template_xyz789"
EMAILJS_PUBLIC_KEY="abcdefghij123456"
EMAILJS_PRIVATE_KEY="pr_live_xxxxxxxxxx"
EMAIL_FROM="LibraAI <no-reply@yourdomain.com>"
PASSWORD_RESET_EXP_MIN="15"
```

## 7. Test Your Setup

1. Start your development server: `npm run dev`
2. Try the password reset flow
3. Check the EmailJS dashboard for sent emails

## Troubleshooting

### Getting 403 Error: "API calls are disabled for non-browser applications"?

**This is the most common issue!** You need to enable server-side access:

1. Go to EmailJS dashboard > **Account** > **Security**
2. Enable **"Allow non-browser requests"**
3. Save and try again

### Email not sending?

- ✅ Check that all environment variables are set correctly
- ✅ Verify your EmailJS service is active
- ✅ Ensure "Allow non-browser requests" is enabled in Security settings
- ✅ Check the EmailJS dashboard for error logs
- ✅ Ensure your template variables match the ones used in the code
- ✅ Verify your Private Key is correct (not the Public Key)

### Rate limits?

- Free tier: 300 emails/month
- Upgrade to a paid plan for higher limits

### Template not rendering?

- Use `{{{message_html}}}` (triple braces) for HTML content
- Use `{{message}}` (double braces) for plain text
- Test your template in the EmailJS dashboard

## Security Notes

- Never commit your `.env.local` file
- Keep your private key secret
- The private key is only used server-side
- EmailJS credentials are never exposed to the client
