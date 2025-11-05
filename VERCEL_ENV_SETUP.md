# Vercel Environment Variables Setup

## 🎯 Critical Fix Required

Your production login is failing because `NEXTAUTH_URL` is set to `localhost` on Vercel.

---

## 📋 Required Environment Variables

Copy these EXACT values to your Vercel project:

### Production Environment

```bash
# 1. NextAuth URL - MUST be your production domain
NEXTAUTH_URL=https://libra-ai-two.vercel.app

# 2. MongoDB URI - with database name
MONGODB_URI=mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/libraai

# 3. NextAuth Secret - keep your existing value
NEXTAUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=

# 4. Auth Secret (alias) - same as NEXTAUTH_SECRET
AUTH_SECRET=s8T1F4eDIrTkDwrMiP4ljFwC9jCLUVh9XhTtWFBKWGw=

# 5. Email Configuration
EMAIL_FROM=LibraAI <libraaismartlibraryassistant@gmail.com>
EMAILJS_SERVICE_ID=service_wj7439o
EMAILJS_TEMPLATE_ID=template_n9lg1lh
EMAILJS_PRIVATE_KEY=pr_QqvvMvUIfhzjZ1ZwxPv8e
EMAILJS_PUBLIC_KEY=njOizbAli7y6I4nzC
PASSWORD_RESET_EXP_MIN=15

# 6. Gemini AI
GEMINI_API_KEY=AIzaSyDyh1KvcGlgnhb-2AyR3zlaIkuIP4R0HrY
```

---

## 🔧 How to Update on Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your LibraAI project
3. Click **Settings** in the top menu
4. Click **Environment Variables** in the left sidebar
5. For each variable above:
   - If it exists: Click **Edit** → Update value → **Save**
   - If it doesn't exist: Click **Add New** → Enter key and value → Select **Production** → **Save**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add NEXTAUTH_URL production
# When prompted, enter: https://libra-ai-two.vercel.app

vercel env add MONGODB_URI production
# When prompted, enter: mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/libraai

# Repeat for other variables...
```

---

## 🚀 After Updating Variables

### 1. Redeploy
Variables only take effect after redeployment:

**Option A: Dashboard**
- Go to **Deployments** tab
- Click on the latest deployment
- Click **Redeploy** button

**Option B: CLI**
```bash
vercel --prod
```

**Option C: Git Push**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### 2. Wait for Deployment
- Usually takes 2-3 minutes
- Watch the deployment logs for any errors

### 3. Clear Browser Cache
Users should:
- Clear cookies for your domain
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Or use incognito/private mode

---

## ✅ Verification

After redeployment, test login:

### Student Account
- URL: https://libra-ai-two.vercel.app/auth
- Email: `student@demo.edu`
- Password: `ReadSmart123`
- Should redirect to: `/student/dashboard`

### Admin Account
- URL: https://libra-ai-two.vercel.app/auth
- Email: `admin@libra.ai`
- Password: `ManageStacks!`
- Should redirect to: `/admin/dashboard`

---

## 🐛 Troubleshooting

### Still can't login?

1. **Check Vercel Logs**
   - Go to Deployments → Click deployment → View Function Logs
   - Look for errors in `/api/auth/callback/credentials`

2. **Verify Environment Variables**
   - Settings → Environment Variables
   - Make sure `NEXTAUTH_URL` does NOT contain `localhost`
   - Make sure `MONGODB_URI` ends with `/libraai`

3. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Ignore "Could not establish connection" (browser extension error)
   - Look for actual API errors (401, 500, etc.)

4. **Check Network Tab**
   - Open DevTools → Network tab
   - Try logging in
   - Look for POST to `/api/auth/callback/credentials`
   - Check response status and body

### Common Mistakes

❌ `NEXTAUTH_URL=http://localhost:3000` (in production)
✅ `NEXTAUTH_URL=https://your-domain.vercel.app`

❌ `MONGODB_URI=...mongodb.net/` (missing database name)
✅ `MONGODB_URI=...mongodb.net/libraai`

❌ Forgetting to redeploy after changing variables
✅ Always redeploy after environment variable changes

---

## 📞 Need Help?

If you're still having issues:
1. Share the Vercel deployment logs
2. Share browser console errors (not extension errors)
3. Confirm which environment variables are set on Vercel
