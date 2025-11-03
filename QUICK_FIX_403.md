# Quick Fix: EmailJS 403 Error

## Problem
You're getting this error:
```
EmailJS send failed (403): API calls are disabled for non-browser applications
```

## Solution

EmailJS blocks server-side requests by default. You need to enable them:

### Step 1: Go to EmailJS Dashboard
Visit: https://dashboard.emailjs.com/

### Step 2: Enable Server-Side Access
1. Click on your profile/account icon (top right)
2. Go to **Account** > **Security**
3. Find the setting: **"Allow non-browser requests"**
4. **Toggle it ON** (enable it)
5. Click **Save**

### Step 3: Verify Your Private Key
Make sure you're using the **Private Key**, not the Public Key:

1. Go to **Account** > **API Keys**
2. Copy your **Private Key** (it should be a long string)
3. Update your `.env.local`:
   ```env
   EMAILJS_PRIVATE_KEY="your_actual_private_key_here"
   ```

### Step 4: Restart Your Server
```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 5: Test Again
Try sending a password reset email again.

## Still Not Working?

### Double-check these:

1. **Service ID is correct**
   - Go to Email Services in dashboard
   - Copy the exact Service ID

2. **Template ID is correct**
   - Go to Email Templates in dashboard
   - Copy the exact Template ID

3. **All keys are in `.env.local`**
   ```env
   EMAILJS_SERVICE_ID="service_xxxxxxx"
   EMAILJS_TEMPLATE_ID="template_xxxxxxx"
   EMAILJS_PUBLIC_KEY="xxxxxxxxxx"
   EMAILJS_PRIVATE_KEY="xxxxxxxxxx"
   EMAIL_FROM="LibraAI <no-reply@yourdomain.com>"
   ```

4. **No extra spaces or quotes**
   - Don't wrap values in extra quotes
   - No spaces before or after the `=`

5. **Server was restarted**
   - Environment variables only load on server start
   - Always restart after changing `.env.local`

## Visual Guide

```
EmailJS Dashboard
├── Account (top right)
│   ├── General → Get Public Key
│   ├── API Keys → Get Private Key
│   └── Security → ✅ Enable "Allow non-browser requests"
├── Email Services → Get Service ID
└── Email Templates → Get Template ID
```

## Need More Help?

Check the full setup guide: `EMAILJS_SETUP.md`
