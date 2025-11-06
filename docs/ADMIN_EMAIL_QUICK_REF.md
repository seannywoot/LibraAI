# Admin Email Notifications - Quick Reference Card

## 🚀 Setup (30 seconds)

**Automatic:** Sends to all admin users in database with `emailNotifications: true`

**Optional fallback:** Add to `.env.local` if no admins in database:
```bash
ADMIN_EMAIL=fallback-admin@example.com
```

## 📧 Three Notification Types

| Type | Trigger | Subject | Frequency |
|------|---------|---------|-----------|
| **Lockout** | 5 failed logins | `[Security] Account locked` | Once per 15 min |
| **Spike** | >100 fails/hour | `[Security] Spike in logins` | Once per hour |
| **New Device** | Admin new device | `[Security] New admin login` | Once per day |

## 🧪 Quick Tests

```bash
# Test 1: Lockout (30 sec)
Login page → Wrong password 5x → Check email

# Test 2: Spike (2 min)
curl http://localhost:3000/api/admin/security/check-spike

# Test 3: New Device (30 sec)
New browser → Login as admin → Check email
```

## 🔧 API Endpoints

```bash
# View locked accounts
GET /api/admin/security/locked-accounts

# Unlock account
POST /api/admin/security/locked-accounts
{"action": "unlock", "identifier": "user@example.com"}

# Check spike
GET /api/admin/security/check-spike

# View config
GET /api/admin/security/notifications
```

## ⚙️ Configuration

```javascript
// src/lib/security-notifications.js
const CONFIG = {
  SPIKE_THRESHOLD: 100,              // Change threshold
  LOCKOUT_DEDUPE_WINDOW: 15 * 60 * 1000,  // 15 min
  SPIKE_DEDUPE_WINDOW: 60 * 60 * 1000,    // 1 hour
  DEVICE_DEDUPE_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
};
```

## 📁 Key Files

```
src/lib/admin-email-templates.js      # Email templates
src/lib/security-notifications.js     # Notification logic
src/app/api/auth/[...nextauth]/route.js  # Auth integration
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| No emails | Check `ADMIN_EMAIL` in `.env.local` |
| Wrong email | Update `ADMIN_EMAIL`, restart server |
| Emails in spam | Check EmailJS sender reputation |
| Too many emails | Increase deduplication windows |

## 📚 Full Documentation

- **Quick Start**: `docs/ADMIN_EMAIL_QUICK_START.md`
- **Complete Guide**: `docs/ADMIN_EMAIL_NOTIFICATIONS.md`
- **Implementation**: `docs/ADMIN_EMAIL_IMPLEMENTATION_SUMMARY.md`
- **Summary**: `docs/ADMIN_SECURITY_EMAILS_COMPLETE.md`

## ✅ Status

**Implementation**: Complete ✅  
**Testing**: Ready ✅  
**Documentation**: Complete ✅  
**Production**: Ready (needs Redis for scale) ⚠️

---

**Set `ADMIN_EMAIL` and restart to start receiving notifications!** 🎉
