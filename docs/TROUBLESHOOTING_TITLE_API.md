# Troubleshooting Title API Errors

## Common Issues and Solutions

### 500 Internal Server Error

**Symptoms:**
- API returns 500 status code
- Console shows "Failed to generate title"
- Titles not updating

**Possible Causes & Solutions:**

#### 1. Missing GEMINI_API_KEY

**Check:**
```bash
# Run diagnostic script
node scripts/diagnose-title-api.mjs
```

**Fix:**
1. Open `.env.local` file
2. Ensure you have: `GEMINI_API_KEY=your_actual_key_here`
3. Get a key from: https://makersuite.google.com/app/apikey
4. Restart dev server: `npm run dev`

#### 2. Invalid API Key

**Symptoms:**
- 500 error with "API key not valid"
- Authentication errors in console

**Fix:**
1. Verify your Gemini API key is correct
2. Check if key has expired
3. Generate a new key if needed
4. Update `.env.local`
5. Restart server

#### 3. Rate Limiting

**Symptoms:**
- Works initially, then starts failing
- "Rate limit exceeded" errors

**Fix:**
- Wait 1-2 minutes before retrying
- The browser script includes automatic 1-second delays
- For bulk updates, use smaller batches

#### 4. Network Issues

**Symptoms:**
- Intermittent failures
- Timeout errors

**Fix:**
- Check internet connection
- Verify firewall isn't blocking API requests
- Try again in a few moments

#### 5. Malformed Request

**Symptoms:**
- 400 Bad Request
- "No messages provided" error

**Fix:**
- Ensure messages array is not empty
- Check message format: `{ role: 'user', content: 'text' }`
- Verify JSON is valid

### Diagnostic Tools

#### Quick Test
```bash
# Test API directly
node scripts/test-title-api-simple.mjs
```

#### Full Diagnostics
```bash
# Run comprehensive checks
node scripts/diagnose-title-api.mjs
```

This will check:
- ✓ Environment variables
- ✓ API endpoint connectivity
- ✓ Title generation
- ✓ Validation logic

#### Browser Console Test
```javascript
// Paste in browser console
fetch('/api/chat/title', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Test message' },
      { role: 'assistant', content: 'Response' }
    ]
  })
})
.then(r => r.json())
.then(d => console.log('Result:', d))
.catch(e => console.error('Error:', e));
```

### Error Messages Explained

| Error | Meaning | Solution |
|-------|---------|----------|
| `API key not configured` | GEMINI_API_KEY missing | Add to .env.local |
| `No messages provided` | Empty messages array | Check request format |
| `Failed to generate title` | Generic error | Check console logs for details |
| `API returned 500` | Server error | Run diagnostics script |
| `Connection refused` | Server not running | Start with `npm run dev` |

### Checking Logs

**Server logs:**
1. Look at terminal where `npm run dev` is running
2. Check for error messages
3. Look for "Title generation error:" lines

**Browser logs:**
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

### Still Having Issues?

1. **Restart everything:**
   ```bash
   # Stop dev server (Ctrl+C)
   # Clear Next.js cache
   rm -rf .next
   # Restart
   npm run dev
   ```

2. **Check environment:**
   ```bash
   # Verify Node version (need 18+)
   node --version
   
   # Verify dependencies
   npm install
   ```

3. **Test with minimal example:**
   ```bash
   node scripts/test-title-api-simple.mjs
   ```

4. **Check API status:**
   - Visit: https://status.google.com/
   - Verify Gemini API is operational

### Prevention

To avoid 500 errors:

✓ Always set GEMINI_API_KEY in .env.local  
✓ Keep API key valid and active  
✓ Include rate limiting delays (1 second between calls)  
✓ Handle errors gracefully with fallbacks  
✓ Monitor console for warnings  

### Fallback Behavior

If the API fails, the system automatically:
1. Logs the error to console
2. Uses heuristic title generation (keyword-based)
3. Continues operation without breaking

**Example:**
```
API failed → Falls back to: "Bake Sourdough Bread Home"
```

This ensures the app keeps working even if the API is temporarily unavailable.

### Getting Help

If issues persist:
1. Run `node scripts/diagnose-title-api.mjs`
2. Copy the output
3. Check the error details in console
4. Verify all environment variables are set
5. Try the test scripts to isolate the issue

### Quick Fixes Checklist

- [ ] GEMINI_API_KEY is set in .env.local
- [ ] Dev server is running (`npm run dev`)
- [ ] Internet connection is working
- [ ] No firewall blocking API requests
- [ ] API key is valid and not expired
- [ ] Not hitting rate limits (wait between requests)
- [ ] Messages array is properly formatted
- [ ] .next cache is cleared if needed

Most 500 errors are resolved by ensuring GEMINI_API_KEY is properly configured!
