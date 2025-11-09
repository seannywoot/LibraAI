# eBook PDF Storage Feature

## Overview
The system now stores PDF files directly in MongoDB and serves them through a secure API endpoint, instead of using external URLs.

## How It Works

### For Admins (Adding eBooks):
1. Go to **Add Book** form
2. Select **Format: eBook**
3. Upload a PDF file
4. The system will:
   - Store the PDF in MongoDB
   - Extract metadata (title, author, year, publisher)
   - Auto-fill the form fields
   - Store a PDF ID in the `ebookUrl` field

### For Students (Accessing eBooks):
1. Find an eBook in the catalog
2. Click the **Access** button
3. The PDF opens directly in your browser

## Technical Details

### API Endpoints

**Upload PDF** (Admin only)
- `POST /api/admin/books/upload-pdf`
- Accepts: PDF file via FormData
- Returns: PDF ID
- Storage: MongoDB collection `ebook_pdfs`

**Retrieve PDF** (Authenticated users)
- `GET /api/ebooks/[pdfId]`
- Returns: PDF file with inline display
- Requires: Valid session

### Database Schema

Collection: `ebook_pdfs`
```javascript
{
  _id: ObjectId,
  filename: String,
  contentType: "application/pdf",
  size: Number,
  data: Binary,
  bookId: ObjectId (optional),
  uploadedBy: String (email),
  uploadedAt: Date
}
```

### Book Document
```javascript
{
  // ... other fields
  format: "eBook",
  ebookUrl: "507f1f77bcf86cd799439011" // PDF ID (24-char hex)
}
```

## Important Notes

### Backward Compatibility
- Old eBooks (added before this feature) still have filenames in `ebookUrl`
- These will show an error when accessed
- **Solution**: Re-upload these eBooks through the Add Book form

### Troubleshooting

**"Page not found" error:**
1. Restart your Next.js development server
2. Verify the route exists: `src/app/api/ebooks/[pdfId]/route.js`
3. Run diagnostics: `node scripts/diagnose-pdf-route.js`

**"Invalid PDF ID format" error:**
- This eBook was added before the PDF storage feature
- Ask the librarian to re-upload the PDF

**"PDF not found in database" error:**
- The PDF was deleted or never uploaded
- Re-upload the eBook

### Testing

1. **Add a new eBook:**
   ```
   - Go to /admin/books/add
   - Select Format: eBook
   - Upload a PDF
   - Fill remaining fields
   - Submit
   ```

2. **Access the eBook:**
   ```
   - Go to /student/books
   - Find the eBook
   - Click "Access"
   - PDF should open in browser
   ```

3. **Check the database:**
   ```javascript
   // In MongoDB
   db.ebook_pdfs.find().pretty()
   db.books.find({ format: "eBook" }).pretty()
   ```

## Migration Guide

To migrate existing eBooks:

1. **Identify old eBooks:**
   ```javascript
   db.books.find({ 
     format: "eBook",
     ebookUrl: { $not: /^[a-f\d]{24}$/i }
   })
   ```

2. **For each eBook:**
   - Download the original PDF (if available)
   - Go to Edit Book page
   - Re-upload the PDF
   - Save

## Security

- PDF access requires authentication
- Only logged-in users can view eBooks
- PDFs are served with `Content-Disposition: inline` for browser viewing
- No direct file system access

## Performance

- PDFs are cached in browser for 1 hour
- MongoDB stores binary data efficiently
- Consider GridFS for very large PDFs (>16MB)

## Future Enhancements

- [ ] Implement GridFS for large files
- [ ] Add PDF compression
- [ ] Track eBook access analytics
- [ ] Add download option
- [ ] Implement PDF annotations
