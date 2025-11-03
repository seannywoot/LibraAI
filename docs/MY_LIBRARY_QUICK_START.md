# My Library - Quick Start Guide

## For Students

### What is My Library?
My Library is your personal digital bookshelf where you can:
- 📚 Upload your own PDF ebooks
- 📷 Scan book barcodes to add books
- 🖼️ Upload images to extract ISBN information
- ✍️ Manually add books with custom details

### How to Add Books

#### Method 1: Upload a PDF (Recommended for Ebooks)
1. Click **"Upload PDF/Image"**
2. Select a PDF file from your computer
3. The book is instantly added to your library
4. Click **"Open PDF"** to read it anytime

#### Method 2: Scan a Barcode
1. Click **"Scan Barcode"**
2. Allow camera access
3. Point your camera at the book's barcode
4. The book details are automatically fetched and added

#### Method 3: Upload an Image
1. Click **"Upload PDF/Image"**
2. Select a photo of the book cover or barcode
3. The system extracts the ISBN and adds the book

#### Method 4: Add Manually
1. Click **"Add Manually"**
2. Enter the book title (required)
3. Optionally add author, ISBN, publisher, and year
4. Click **"Add Book"**

### Managing Your Library
- **View**: All your books are displayed in a grid
- **Read**: Click "Open PDF" on PDF books to read them
- **Remove**: Click the X button to remove a book
- **Sort**: Books are sorted by date added (newest first)

## For Developers

### Quick Setup
```powershell
# 1. Install dependencies (already done if you ran npm install)
npm install

# 2. Create uploads directory
New-Item -ItemType Directory -Path "public/uploads/ebooks" -Force

# 3. Start development server
npm run dev

# 4. Navigate to http://localhost:3000/student/library
```

### Key Files
- **Page**: `src/app/student/library/page.js`
- **API Routes**:
  - `src/app/api/student/library/route.js` (GET library)
  - `src/app/api/student/library/upload/route.js` (Upload PDF/image)
  - `src/app/api/student/library/manual/route.js` (Manual entry)
  - `src/app/api/student/library/[id]/route.js` (Delete book)
- **Components**: `src/components/barcode-scanner.jsx`

### Database Collection
```javascript
// Collection: personal_libraries
{
  userId: ObjectId,
  title: String,
  author: String,
  isbn: String,
  publisher: String,
  year: String,
  
  // For PDFs
  fileType: "application/pdf",
  fileName: String,
  fileUrl: String,
  fileSize: Number,
  
  addedAt: Date,
  addedMethod: "pdf-upload" | "barcode" | "image-ocr" | "manual"
}
```

### Testing Checklist
- [ ] Upload a PDF file
- [ ] Open the uploaded PDF
- [ ] Scan a barcode (requires physical book)
- [ ] Add a book manually
- [ ] Remove a book
- [ ] Verify PDF file is deleted when book is removed
- [ ] Check that only the owner can access their books

### Production Considerations
1. **File Storage**: Consider using AWS S3 or Cloudinary for PDFs
2. **File Size Limits**: Configure appropriate limits (default: 10MB)
3. **Security**: Implement virus scanning for uploaded files
4. **Backup**: Set up automated backups of the uploads directory
5. **CDN**: Use a CDN for faster PDF delivery

### Environment Variables
No additional environment variables required for basic functionality.

For cloud storage integration:
```env
# AWS S3 (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Troubleshooting

### "Failed to upload file"
- Check that `public/uploads/ebooks` directory exists
- Verify write permissions on the directory
- Check file size (must be under configured limit)

### "No ISBN found in image"
- Ensure the image is clear and well-lit
- Try scanning the barcode instead
- Use manual entry as a fallback

### PDF won't open
- Verify the file was uploaded successfully
- Check browser console for errors
- Ensure the file path is correct in the database

### Camera not working
- Grant camera permissions in your browser
- Try a different browser
- Use the upload method instead

## Support
For issues or questions, check:
- `docs/MY_LIBRARY_FEATURE.md` - Full feature documentation
- `docs/SETUP_UPLOADS.md` - File upload setup guide
