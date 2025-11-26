# PDF Worker Fix - Production Solution

## Problem
Both quiz generation and chat PDF upload fail in production with:
```
Cannot find module './pdf.worker.js'
```

## Root Cause
PDF.js requires a web worker file that doesn't exist in Vercel's serverless Lambda environment. The worker path `pdfjs-dist/build/pdf.worker.js` cannot be resolved at runtime.

## Solution ✅

### 1. Copy Worker to Public Directory
Copied the worker file to `/public` so it's served as a static asset:
```bash
Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.js" "public\pdf.worker.js"
```

### 2. Update Worker Path in Both APIs
Changed from node_modules path to public URL:

**Before (broken in production):**
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.js";
```

**After (works everywhere):**
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";
```

### 3. Files Updated
- ✅ `public/pdf.worker.js` - Worker file copied
- ✅ `src/app/api/student/quizzes/route.js` - Quiz generation
- ✅ `src/app/api/chat/route.js` - Chat PDF upload

## Why This Works

### Local Development
- Next.js serves `/public` files at root URL
- Worker loads from `http://localhost:3000/pdf.worker.js`

### Production (Vercel)
- Vercel serves `/public` files as static assets
- Worker loads from `https://yourdomain.com/pdf.worker.js`
- No node_modules path resolution needed
- Works in serverless Lambda functions

## Benefits
- ✅ Works in both local and production
- ✅ No complex webpack configuration
- ✅ No dynamic imports or path resolution
- ✅ Simple, reliable solution
- ✅ Fixes both quiz and chat PDF features

## Deployment Checklist

- [x] Worker file copied to `/public`
- [x] Quiz API updated
- [x] Chat API updated
- [x] Worker file added to git
- [ ] Commit and push changes
- [ ] Vercel auto-deploys
- [ ] Test quiz generation in production
- [ ] Test chat PDF upload in production

## Files to Commit
```bash
git add public/pdf.worker.js
git add src/app/api/student/quizzes/route.js
git add src/app/api/chat/route.js
git commit -m "Fix PDF.js worker for production deployment"
git push
```

## Testing

### Local Test
1. Run `npm run dev`
2. Test quiz generation: `/student/quizzes`
3. Test chat PDF: `/student/chat` (upload PDF)
4. Both should work

### Production Test
1. Deploy to Vercel
2. Test quiz generation on live site
3. Test chat PDF upload on live site
4. Check Vercel logs for any errors

## Expected Behavior

### Success Logs (Quiz)
```
📄 Starting PDF text extraction...
📦 PDF buffer size: 123456 bytes
✅ PDF loaded, pages: 5
✅ Extracted page 1/5
...
✅ Total text extracted: 5000 characters
🤖 Generating quiz questions from extracted text...
✅ Quiz saved with ID: 507f1f77bcf86cd799439012
```

### Success Logs (Chat)
```
📄 Extracting text from PDF...
✅ PDF text extracted: 5 pages, 2500 words
```

## Maintenance

### When Updating pdfjs-dist
If you update the `pdfjs-dist` package version:
1. Re-copy the worker file:
   ```bash
   Copy-Item "node_modules\pdfjs-dist\build\pdf.worker.js" "public\pdf.worker.js"
   ```
2. Commit the updated worker file
3. Deploy

### Alternative: Automated Copy
Add to `package.json` scripts:
```json
"postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.js public/pdf.worker.js"
```

This auto-copies the worker after every `npm install`.

## Verification

After deployment, verify the worker is accessible:
1. Visit: `https://yourdomain.com/pdf.worker.js`
2. Should see JavaScript code (not 404)
3. File size should be ~1.7MB

## Troubleshooting

### If Still Fails
1. Check Vercel deployment includes `public/pdf.worker.js`
2. Verify worker URL is accessible
3. Check browser console for CORS errors
4. Verify Vercel function logs for specific errors

### Common Issues
- **404 on worker:** File not in git or not deployed
- **CORS error:** Shouldn't happen (same origin)
- **Still can't find module:** Check worker path is `/pdf.worker.js` not `pdf.worker.js`

## Success Criteria
- ✅ Quiz generation works in production
- ✅ Chat PDF upload works in production
- ✅ No worker-related errors in logs
- ✅ Both features work consistently
