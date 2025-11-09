# Quick Fix: 500 Error on Title Generation

## If You See "API returned 500"

### Step 1: Run Diagnostics (30 seconds)
```bash
node scripts/diagnose-title-api.mjs
```

This will tell you exactly what's wrong.

### Step 2: Most Common Fix

**Problem:** Missing or invalid GEMINI_API_KEY

**Solution:**
1. Open `.env.local` file
2. Add or update: `GEMINI_API_KEY=your_key_here`
3. Get a key from: https://makersuite.google.com/app/apikey
4. Restart dev server: `npm run dev`

### Step 3: Test It Works
```bash
node scripts/test-title-api-simple.mjs
```

Should show: `✅ Success! Generated title: "..."`

## Other Quick Fixes

### Server Not Running?
```bash
npm run dev
```

### Rate Limited?
Wait 1-2 minutes, then try again.

### Still Not Working?

See detailed guide: `docs/TROUBLESHOOTING_TITLE_API.md`

## That's It!

Most 500 errors are fixed by ensuring GEMINI_API_KEY is set in `.env.local`.

The diagnostic script will tell you exactly what's wrong in 30 seconds.
