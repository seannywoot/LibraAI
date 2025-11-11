# PDF Upload Troubleshooting Guide

## Changes Made

### 1. Button Text Updated
**Changed:** "Upload PDF/Image" → "Upload PDF"
**Reason:** Removed image upload functionality (OCR not fully implemented)

### 2. File Input Restricted
**Changed:** `accept="application/pdf,image/*"` → `accept="application/pdf"`
**Reason:** Only PDF uploads are supported

### 3. Enhanced Error Logging
Added detailed console logging to help debug upload issues:
- Request details (file name, type)
- Google Books API search results
- Error messages with stack traces

## Debugging Upload Errors

### Check Server Console

When you upload a PDF, you should see:

```
Upload request received: {
  hasFile: true,
  fileType: 'application/pdf',
  fileName: 'Effective_Java.pdf'
}

Searching Google Books for: "Effective Java"

Found book: "Effective Java" by Joshua Bloch
Categories: Computers, Programming, Java
```

### Common Errors

#### Error 1: "Failed to upload file"

**Possible Causes:**
1. **File system permissions** - Server can't write to `public/uploads/ebooks/`
2. **MongoDB connection** - Database not accessible
3. **Google Books API** - Network issue (non-critical, will fallback)

**Solutions:**
```bash
# Check if uploads directory exists
ls -la public/uploads/ebooks/

# Create if missing
mkdir -p public/uploads/ebooks/

# Check permissions
chmod 755 public/uploads/ebooks/
```

#### Error 2: "No file provided"

**Cause:** File input not working

**Solution:**
- Check browser console for errors
- Verify file input element exists
- Try different browser

#### Error 3: "Unauthorized"

**Cause:** Not logged in or session expired

**Solution:**
- Log out and log back in
- Check session in browser DevTools

### Check Browser Console

Open DevTools (F12) → Console tab

**Look for:**
```javascript
// Upload starting
POST /api/student/library/upload

// Success
PDF uploaded successfully!

// Error
Failed to upload file: [error message]
```

### Check Network Tab

Open DevTools (F12) → Network tab

1. Upload a PDF
2. Find the `/api/student/library/upload` request
3. Check:
   - **Status:** Should be 200
   - **Response:** Should have `ok: true`
   - **Request Payload:** Should have file data

**Example Success Response:**
```json
{
  "ok": true,
  "message": "PDF uploaded successfully",
  "book": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Effective Java",
    "fileUrl": "/uploads/ebooks/1699999999_Effective_Java.pdf"
  }
}
```

**Example Error Response:**
```json
{
  "ok": false,
  "error": "Failed to write file: EACCES: permission denied"
}
```

## Testing Steps

### Test 1: Basic Upload

1. Go to `/student/library`
2. Click "Upload PDF"
3. Select a PDF file (e.g., `Effective_Java.pdf`)
4. Click Open

**Expected:**
- Toast: "PDF uploaded successfully!"
- Book appears in Personal Collection
- Has title, author, categories (if found in Google Books)

### Test 2: Check File Saved

```bash
# Check if file was saved
ls -la public/uploads/ebooks/

# Should see:
# 1699999999_Effective_Java.pdf
```

### Test 3: Check Database

```javascript
// In MongoDB
db.personal_libraries.find().sort({addedAt: -1}).limit(1).pretty()

// Should show:
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  title: "Effective Java",
  author: "Joshua Bloch",
  categories: ["Computers", "Programming", "Java"],
  fileUrl: "/uploads/ebooks/1699999999_Effective_Java.pdf",
  addedMethod: "pdf-upload"
}
```

### Test 4: Access PDF

1. Go to book detail page
2. Click "Open PDF" button
3. PDF should open in new tab

## File Requirements

### Supported Files
- ✅ PDF files only
- ✅ Any size (within server limits)
- ✅ Any PDF version

### Filename Recommendations
- ✅ Use descriptive names: `Effective_Java.pdf`
- ✅ Include author: `Effective_Java_Joshua_Bloch.pdf`
- ❌ Avoid: `book.pdf`, `document.pdf`, `scan.pdf`

## Server Requirements

### Directory Structure
```
project/
├── public/
│   └── uploads/
│       └── ebooks/          ← Must exist and be writable
│           └── [uploaded PDFs]
```

### Permissions
```bash
# Directory must be writable by Node.js process
chmod 755 public/uploads/ebooks/
```

### Environment
- Node.js with file system access
- MongoDB connection
- Internet access (for Google Books API, optional)

## Known Limitations

### 1. Google Books API
- **Rate Limits:** May fail if too many requests
- **Not Found:** Obscure books might not be in Google Books
- **Fallback:** Uses filename if API fails

### 2. File Size
- **Default Limit:** Usually 50MB (Next.js default)
- **Large Files:** May timeout or fail
- **Solution:** Increase limit in `next.config.js`

### 3. Filename Parsing
- **Accuracy:** Depends on filename quality
- **Generic Names:** "book.pdf" won't find metadata
- **Solution:** Rename files before upload

## Troubleshooting Checklist

- [ ] Server is running
- [ ] Logged in as student
- [ ] `public/uploads/ebooks/` directory exists
- [ ] Directory has write permissions
- [ ] MongoDB is connected
- [ ] File is a valid PDF
- [ ] Filename is descriptive
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 response

## Getting Help

If upload still fails:

1. **Check server console** for error messages
2. **Check browser console** for client errors
3. **Check network tab** for API response
4. **Try different PDF** to isolate issue
5. **Check file permissions** on server
6. **Restart development server**

## Success Indicators

✅ Toast notification: "PDF uploaded successfully!"
✅ Book appears in Personal Collection
✅ Book has title and author (from Google Books or filename)
✅ Categories displayed (if found)
✅ Can open PDF from detail page
✅ Recommendations work (if categories found)

## Files Modified

- `src/app/student/library/page.js` - Button text and file input
- `src/app/api/student/library/upload/route.js` - Error logging

## Related Documentation

- `docs/PDF_UPLOAD_GOOGLE_BOOKS_ENRICHMENT.md` - How metadata enrichment works
- `docs/EBOOK_PDF_STORAGE.md` - PDF storage system
