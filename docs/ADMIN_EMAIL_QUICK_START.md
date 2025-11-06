# Admin Email Notifications - Quick Start

## 🚀 Setup (2 minutes)

### 1. Ensure Admin Users Exist

The system automatically sends notifications to all admin users in the database with email notifications enabled.

**Check your database:**
```javascript
// Admin users should have:
{
  email: "admin@libra.ai",
  role: "admin",
  emailNotifications: true  // or undefined (defaults to enabled)
}
```

**Optional fallback:** Add to `.env.local` if no admins in database:
```bash
ADMIN_EMAIL=fallback-admin@example.com
```

### 2. Verify EmailJS Config

These should already be set:

```bash
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_TEMPLATE_ID=template_n9lg1lh
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
EMAIL_FROM="LibraAI <libraaismartlibraryassistant@gmail.com>"
```

### 3. Restart Server

```bash
npm run dev
```

## 📧 What You'll Receive

### 1. Account Lockout (Real-time)

**When**: User fails login 5 times

**Subject**: `[Security] Account locked after failed logins`

**Contains**:
- Locked account email
- Number of attempts
- Lock duration
- Unlock link

### 2. Failed Login Spike (Every 5 min check)

**When**: >100 failed logins per hour

**Subject**: `[Security] Spike in failed logins (X/hour)`

**Contains**:
- Total failed attempts
- Top targeted accounts
- Top source IPs
- Dashboard link

### 3. New Admin Device (Real-time)

**When**: Admin logs in from new device/IP/browser

**Subject**: `[Security] New admin login environment detected`

**Contains**:
- Login timestamp
- IP address
- Browser & OS
- Approve/Report links

## 🧪 Quick Tests

### Test 1: Account Lockout

```bash
# Try wrong password 5 times at login page
Email: test@example.com
Password: wrong (x5)

# Check your ADMIN_EMAIL inbox
```

### Test 2: Failed Login Spike

```bash
# Make 110 failed login attempts
curl http://localhost:3000/api/admin/security/check-spike

# Check your ADMIN_EMAIL inbox
```

### Test 3: New Admin Device

```bash
# Login as admin from new browser (or clear cookies)
Email: admin@libra.ai
Password: ManageStacks!

# Check admin@libra.ai inbox
```

## ⚙️ Configuration

### Change Spike Threshold

Edit `src/lib/security-notifications.js`:

```javascript
const CONFIG = {
  SPIKE_THRESHOLD: 150, // Change from 100 to 150
};
```

### Add Multiple Admins

Currently sends to one admin email. To add more, modify `getAdminEmails()` in `src/lib/security-notifications.js` to query database for all admins.

## 🔗 API Endpoints

```bash
# View locked accounts
GET /api/admin/security/locked-accounts

# Unlock account
POST /api/admin/security/locked-accounts
{"action": "unlock", "identifier": "user@example.com"}

# Check spike manually
GET /api/admin/security/check-spike

# View config
GET /api/admin/security/notifications
```

## 📊 Deduplication

Prevents email spam:

| Event | Frequency |
|-------|-----------|
| Account Lockout | Once per 15 min per account |
| Failed Login Spike | Once per hour |
| New Admin Device | Once per day per device |

## 🎯 Key Features

✅ Real-time account lockout alerts  
✅ Automatic spike detection (every 5 min)  
✅ New device tracking for admins  
✅ Smart deduplication (no spam)  
✅ HTML + plain text emails  
✅ Direct action links in emails  

## 📁 Files Created

```
src/lib/admin-email-templates.js       # Email templates
src/lib/security-notifications.js      # Notification logic
src/app/api/admin/security/
  ├── check-spike/route.js             # Manual spike check
  └── notifications/route.js           # Config management
```

## 🔧 Troubleshooting

**No emails?**
- Check `ADMIN_EMAIL` is set
- Verify EmailJS credentials
- Check server console for errors

**Wrong email address?**
- Update `ADMIN_EMAIL` in `.env.local`
- Restart server

**Too many emails?**
- Adjust deduplication windows in config
- Increase spike threshold

## 📚 Full Documentation

See `docs/ADMIN_EMAIL_NOTIFICATIONS.md` for complete details.

---

**Ready to go!** Set `ADMIN_EMAIL` and you'll receive security alerts automatically. 🎉
