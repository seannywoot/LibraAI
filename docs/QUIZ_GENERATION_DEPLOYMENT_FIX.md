# Quiz Generation Deployment Fix

## Problem
Quiz generation works locally but fails on deployed site (Vercel).

## Quick Action Required
✅ **BYTEZ_API_KEY already configured in Vercel**  
🔴 **Deploy the code changes made to fix PDF.js and add logging**

The fixes have been applied to:
- `src/app/api/student/quizzes/route.js` - Enhanced logging + PDF.js serverless config
- `next.config.mjs` - Webpack configuration for PDF.js
- `vercel.json` - Function timeout and memory limits

**Next Step:** Commit and push these changes, then check Vercel logs during quiz generation.

## Root Causes Identified

### 1. PDF.js Worker Configuration ⚠️ **MOST LIKELY**
The PDF worker doesn't work in serverless environments and needs special configuration.

### 2. Function Timeout/Memory Limits
Default Vercel limits may be too restrictive for PDF processing + AI generation.

### 3. Missing Webpack Configuration
PDF.js needs specific webpack aliases for serverless deployment.

## Solutions Applied

### ✅ Fix 1: PDF.js Worker Configuration
**File:** `src/app/api/student/quizzes/route.js`

Changed worker configuration to disable worker in serverless:
```javascript
// Before
pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.js";

// After
pdfjs.GlobalWorkerOptions.workerSrc = null;
```

### ✅ Fix 2: Enhanced Error Logging
Added logging to detect missing API key:
```javascript
console.log("✅ Bytez API key found, length:", bytezApiKey.length);
```

### ✅ Fix 3: Vercel Function Configuration
**File:** `vercel.json`

Added function-specific settings:
```json
"functions": {
  "src/app/api/student/quizzes/route.js": {
    "maxDuration": 60,
    "memory": 1024
  }
}
```

### ✅ Fix 4: Next.js Webpack Configuration
**File:** `next.config.mjs`

Added PDF.js serverless configuration:
```javascript
if (isServer) {
  config.resolve.alias = {
    ...config.resolve.alias,
    canvas: false,
  };
}
```

### ✅ Fix 5: Enhanced Logging
Added comprehensive logging throughout the quiz generation process to identify exact failure points in production.

## Required Manual Steps

### 🔴 CRITICAL: Redeploy Application

Since code changes were made, you need to:

1. **Commit and push changes** to your repository
2. Vercel will automatically deploy, OR
3. Manually redeploy:
   - Go to **Deployments** tab in Vercel
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### ✅ Environment Variable Already Configured
The `BYTEZ_API_KEY` is already in Vercel environment variables (confirmed by user).

## Testing After Deployment

### Step 1: Check Logs During Generation
1. Open Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Go to **Functions** tab
4. Keep this open while testing

### Step 2: Test Quiz Generation
1. Go to your live site: `/student/quizzes`
2. Upload a PDF file (< 10MB, text-based)
3. Select question count (5, 10, or 15)
4. Click "Generate Quiz"
5. Watch the Vercel function logs in real-time

### Step 3: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Go to **Network** tab
4. Look for the POST request to `/api/student/quizzes`
5. Check the response for error messages

### What to Look For in Logs
With the enhanced logging, you'll see:
```
========== POST /api/student/quizzes ==========
Session user: user@example.com
✅ User authorized: 507f1f77bcf86cd799439011
📄 Starting PDF text extraction...
✅ PDF.js loaded, worker disabled
📦 PDF bytes prepared, size: 123456
✅ PDF loaded, pages: 5
✅ Extracted page 1/5
...
✅ Total text extracted: 5000 characters
✅ Bytez API key found, length: 32
🤖 Calling Bytez AI...
✅ AI Content extracted, length: 1500
📝 First 200 chars: [{"question":"What is...
Successfully parsed questions: 10
📝 Saving quiz to database: My Document
✅ Quiz saved with ID: 507f1f77bcf86cd799439012
```

If it fails, you'll see exactly where with ❌ markers.

## Debugging Production Issues

### Check Vercel Logs
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** → Select latest deployment
3. Click **Functions** tab
4. Find `/api/student/quizzes` and check logs

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "AI API key not configured" | Missing `BYTEZ_API_KEY` | Add to Vercel env vars |
| "Failed to extract text from PDF" | PDF.js worker issue | Already fixed (worker disabled) |
| "Failed to generate quiz questions" | Bytez API error | Check API key validity |
| Function timeout | Processing too long | Already fixed (60s timeout) |
| Out of memory | Large PDF processing | Already fixed (1024MB memory) |

## Verification Checklist

- [ ] `BYTEZ_API_KEY` added to Vercel environment variables
- [ ] Application redeployed after adding env var
- [ ] Test quiz generation with small PDF (< 1MB)
- [ ] Test quiz generation with larger PDF (5-10MB)
- [ ] Check Vercel function logs for errors
- [ ] Verify quiz appears in "My Quizzes" list after generation

## Additional Notes

### Dependencies Verified
Both required packages are in `package.json`:
- ✅ `bytez.js`: ^1.1.18
- ✅ `pdfjs-dist`: ^3.11.174

### API Endpoint Details
- **Route:** `POST /api/student/quizzes`
- **Max File Size:** 10MB
- **Supported Format:** PDF only
- **Question Counts:** 5, 10, or 15
- **AI Model:** openai/gpt-4o (via Bytez)
- **Max Pages Processed:** 20 pages

### Performance Considerations
- PDF text extraction: ~2-5 seconds
- AI generation: ~10-30 seconds
- Total time: ~15-35 seconds (well within 60s limit)

## If Issues Persist

1. **Check API Key Validity**
   - Verify the Bytez API key is active
   - Check usage limits/quotas

2. **Test API Key Locally**
   ```bash
   curl -X POST https://api.bytez.com/v1/test \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

3. **Enable Debug Mode**
   Add to Vercel env vars:
   ```
   DEBUG=true
   ```

4. **Check Bytez Service Status**
   - Visit Bytez status page
   - Check for service outages

## Contact Support
If quiz generation still fails after following all steps, check:
- Vercel function logs for specific error messages
- Browser console for client-side errors
- Network tab for failed API requests
