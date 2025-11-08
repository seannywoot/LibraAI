# API Error Handling Improvements

## Issue
User reported "api returned 500" error when trying to generate titles.

## Root Causes Identified

1. **Missing API Key Validation** - No check if GEMINI_API_KEY is set
2. **Generic Error Messages** - Hard to diagnose what went wrong
3. **No Diagnostic Tools** - Difficult to troubleshoot issues
4. **Limited Error Details** - Console logs didn't show enough info

## Solutions Implemented

### 1. Enhanced API Error Handling

**File:** `src/app/api/chat/title/route.js`

**Added:**
- ✓ API key validation before making requests
- ✓ Detailed error logging with stack traces
- ✓ Specific error messages for different failure types
- ✓ Development mode error details in response

**Before:**
```javascript
catch (err) {
  console.error('Title generation error:', err);
  return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });
}
```

**After:**
```javascript
// Validate API key
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
  return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
}

// Better error handling
catch (err) {
  console.error('Title generation error:', err);
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    name: err.name
  });
  
  return NextResponse.json({ 
    error: err.message || 'Failed to generate title',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  }, { status: 500 });
}
```

### 2. Improved Browser Script Error Handling

**File:** `scripts/fix-titles-browser.js`

**Added:**
- ✓ Better error message extraction from API responses
- ✓ Detailed error logging in console
- ✓ Graceful degradation on failures

**Before:**
```javascript
if (!response.ok) {
  throw new Error(`API returned ${response.status}`);
}
```

**After:**
```javascript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  console.error('  ⚠️  API error:', errorData);
  throw new Error(`API returned ${response.status}: ${errorData.error || 'Unknown error'}`);
}
```

### 3. Diagnostic Tools Created

#### Simple API Test
**File:** `scripts/test-title-api-simple.mjs`
- Quick test of title generation
- Shows request and response
- Easy to run: `node scripts/test-title-api-simple.mjs`

#### Comprehensive Diagnostics
**File:** `scripts/diagnose-title-api.mjs`
- Checks environment variables
- Tests API endpoint
- Validates typo detection
- Tests problematic titles
- Provides actionable recommendations

**Run:** `node scripts/diagnose-title-api.mjs`

**Output:**
```
🔍 Title API Diagnostics
==================================================

1. Checking environment variables...
   MONGODB_URI: ✅ Found
   GEMINI_API_KEY: ✅ Found

2. Testing API endpoint...
   Status: 200 OK
   ✅ Success! Title: "..."

3. Testing with problematic title...
   ✅ Typo was corrected!

4. Testing validation patterns...
   [Shows which titles would trigger retry]

✅ Diagnostics complete!
```

### 4. Troubleshooting Documentation

**File:** `docs/TROUBLESHOOTING_TITLE_API.md`

Comprehensive guide covering:
- Common error causes and solutions
- Diagnostic tools usage
- Error message explanations
- Step-by-step fixes
- Prevention tips
- Quick fixes checklist

### 5. Updated Documentation

**Files Updated:**
- `docs/UPDATE_EXISTING_TITLES.md` - Added troubleshooting reference
- `docs/TITLE_FIX_COMPLETE.md` - Added diagnostic tools section

## Testing Results

All tests passing:
```bash
✅ node scripts/test-title-api-simple.mjs
✅ node scripts/diagnose-title-api.mjs
✅ API validation working
✅ Error messages clear and actionable
```

## Common 500 Error Causes & Fixes

| Cause | Fix |
|-------|-----|
| Missing GEMINI_API_KEY | Add to .env.local |
| Invalid API key | Get new key from Google |
| Rate limiting | Wait 1-2 minutes |
| Network issues | Check connection |
| Server not running | Run `npm run dev` |

## Prevention Measures

Now includes:
1. **Upfront validation** - Check API key before making requests
2. **Better logging** - Detailed error information in console
3. **Diagnostic tools** - Easy to identify and fix issues
4. **Clear documentation** - Step-by-step troubleshooting
5. **Graceful fallbacks** - System continues working even if API fails

## User Experience Improvements

**Before:**
- Generic "500 error" message
- No way to diagnose issue
- Unclear what went wrong

**After:**
- Specific error messages ("API key not configured")
- Diagnostic script shows exactly what's wrong
- Clear steps to fix the issue
- Detailed troubleshooting guide

## Files Modified/Created

**Modified:**
1. `src/app/api/chat/title/route.js` - Enhanced error handling
2. `scripts/fix-titles-browser.js` - Better error messages
3. `docs/UPDATE_EXISTING_TITLES.md` - Added troubleshooting link

**Created:**
1. `scripts/test-title-api-simple.mjs` - Quick API test
2. `scripts/diagnose-title-api.mjs` - Comprehensive diagnostics
3. `docs/TROUBLESHOOTING_TITLE_API.md` - Troubleshooting guide
4. `docs/API_ERROR_HANDLING_IMPROVEMENTS.md` - This document

## Result

✅ 500 errors are now:
- Easier to diagnose
- Clearer to understand
- Simpler to fix
- Better documented

Users can quickly identify and resolve API issues using the diagnostic tools and troubleshooting guide.
