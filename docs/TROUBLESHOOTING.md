# Troubleshooting Guide

## Common Issues and Solutions

### "Access Denied" Error When Adding Books to My Library

**Symptom**: When trying to upload PDFs, scan barcodes, or manually add books to "My Library", you receive an "Access denied" error.

**Cause**: This was caused by the API routes checking the database for user role instead of trusting the session role. Demo users or users not yet in the database would fail this check.

**Solution**: The API routes now:
1. Check the session role first (which is already validated by middleware)
2. Auto-create user records in the database if they don't exist
3. This allows demo users and new users to use the feature immediately

**Code Change**: Updated all `/api/student/library/*` routes to use session-based authentication instead of database-based role checking.

---

### Camera Not Working for Barcode Scanning

**Symptom**: Camera doesn't initialize or shows a black screen.

**Possible Causes**:
1. Browser doesn't have camera permissions
2. HTTPS is required for camera access (except on localhost)
3. Camera is being used by another application

**Solutions**:
1. Grant camera permissions when prompted
2. Ensure you're using HTTPS in production
3. Close other applications using the camera
4. Try a different browser (Chrome/Edge recommended)
5. Use the "Upload PDF/Image" option as an alternative

---

### PDF Upload Fails

**Symptom**: PDF upload shows an error or doesn't complete.

**Possible Causes**:
1. File size exceeds limit (default: 10MB)
2. Uploads directory doesn't exist or lacks write permissions
3. File is corrupted or not a valid PDF

**Solutions**:
1. Check file size - compress large PDFs if needed
2. Ensure `public/uploads/ebooks/` directory exists with write permissions:
   ```powershell
   # Windows
   New-Item -ItemType Directory -Path "public/uploads/ebooks" -Force
   ```
3. Try a different PDF file to rule out corruption
4. Check server logs for detailed error messages

---

### Books Not Appearing in Library

**Symptom**: After adding a book, it doesn't show up in the library.

**Possible Causes**:
1. Database connection issue
2. User ID mismatch
3. Browser cache issue

**Solutions**:
1. Refresh the page (F5)
2. Check browser console for errors
3. Verify MongoDB connection in `.env.local`
4. Clear browser cache and cookies
5. Check that the book was actually added to the database:
   ```javascript
   // In MongoDB shell or Compass
   db.personal_libraries.find({ userId: ObjectId("your_user_id") })
   ```

---

### "No ISBN Found in Image" Error

**Symptom**: When uploading an image, the system can't extract the ISBN.

**Cause**: The current implementation uses a placeholder OCR function that doesn't actually process images.

**Solutions**:
1. Use the barcode scanner instead (more reliable)
2. Add the book manually with the "Add Manually" button
3. Upload the PDF directly if you have it
4. For production: Integrate a real OCR service:
   - Google Cloud Vision API
   - AWS Textract
   - Tesseract.js (client-side)

---

### Session Expired / Unauthorized Errors

**Symptom**: Random "Unauthorized" errors or being logged out unexpectedly.

**Possible Causes**:
1. `NEXTAUTH_SECRET` not set or changed
2. Session timeout
3. Cookie issues

**Solutions**:
1. Verify `NEXTAUTH_SECRET` is set in `.env.local`
2. Log out and log back in
3. Clear browser cookies
4. Check that cookies are enabled in your browser

---

### File Not Found After Upload

**Symptom**: PDF uploads successfully but clicking "Open PDF" shows 404.

**Possible Causes**:
1. File path mismatch
2. Public directory not being served correctly
3. File was deleted

**Solutions**:
1. Check that the file exists in `public/uploads/ebooks/`
2. Verify the `fileUrl` in the database matches the actual file location
3. Ensure Next.js is serving the public directory correctly
4. Check file permissions (should be readable)

---

### Database Connection Issues

**Symptom**: Various errors related to database operations.

**Solutions**:
1. Verify `MONGODB_URI` in `.env.local` is correct
2. Check MongoDB Atlas/server is running and accessible
3. Verify IP whitelist in MongoDB Atlas (if using cloud)
4. Test connection: `http://localhost:3000/api/db/ping`
5. Check MongoDB logs for connection errors

---

### Role Mismatch Errors

**Symptom**: "RoleMismatch" error when logging in.

**Cause**: Trying to access a portal with the wrong role (e.g., admin trying to access student portal).

**Solution**: 
1. Use the correct login portal for your role
2. Admin users: Use `/admin/dashboard`
3. Student users: Use `/student/dashboard`
4. The system will auto-redirect based on your role

---

## Getting Help

If you encounter an issue not covered here:

1. **Check Browser Console**: Press F12 and look for error messages
2. **Check Server Logs**: Look at the terminal where `npm run dev` is running
3. **Check Database**: Verify data is being saved correctly
4. **Review Documentation**:
   - `docs/MY_LIBRARY_FEATURE.md` - Feature documentation
   - `docs/MY_LIBRARY_QUICK_START.md` - Quick start guide
   - `docs/SETUP_UPLOADS.md` - File upload setup

## Debug Mode

To enable more detailed logging, add to your `.env.local`:
```env
NODE_ENV=development
DEBUG=true
```

Then check the server console for detailed error messages.
