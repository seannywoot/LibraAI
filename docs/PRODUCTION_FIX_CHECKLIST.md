# 🚨 PRODUCTION LOGIN FIX - Quick Checklist

## The Problem
Cannot login on production server (Vercel) - both student and admin panels fail.

## The Solution
Wrong `NEXTAUTH_URL` in production environment variables.

---

## ✅ Fix Steps (5 minutes)

### 1. Go to Vercel Dashboard
- Open your project: https://vercel.com/dashboard
- Click on your LibraAI project

### 2. Update Environment Variables
- Go to: **Settings** → **Environment Variables**
- Find or add these variables for **Production** environment:

```bash
NEXTAUTH_URL=https://libra-ai-two.vercel.app
```
(Replace with your actual Vercel domain)

```bash
MONGODB_URI=mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/libraai
```

### 3. Redeploy
- Go to **Deployments** tab
- Click latest deployment → **Redeploy**
- Wait 2-3 minutes

### 4. Test
- Clear browser cookies
- Go to your production URL
- Try logging in:
  - Student: `student@demo.edu` / `ReadSmart123`
  - Admin: `admin@libra.ai` / `ManageStacks!`

---

## 🔍 What Was Wrong?

| Variable | Wrong Value | Correct Value |
|----------|-------------|---------------|
| NEXTAUTH_URL | `http://localhost:3000` | `https://your-domain.vercel.app` |
| MONGODB_URI | Missing `/libraai` | Includes `/libraai` at end |

---

## 📝 Notes

- The console error "Could not establish connection" is from a browser extension, NOT the actual problem
- The brute force protection and session management we added yesterday are working fine
- This is purely a configuration issue

---

## 🆘 Still Not Working?

Run diagnostics locally:
```bash
node scripts/diagnose-auth.js
```

Check Vercel logs:
1. Go to Deployments
2. Click on latest deployment
3. Click "View Function Logs"
4. Look for errors in `/api/auth/` routes
