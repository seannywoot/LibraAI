# My Library Feature

## Overview
The "My Library" feature allows students to build and manage their personal book collection using PDF uploads, barcode scanning, OCR technology, and manual entry.

## Features

### 1. PDF Upload
- Upload personal ebook PDFs directly to your library
- Files are stored securely on the server
- Quick access to read PDFs from your library
- Automatic title extraction from filename
- Supports any PDF file size

### 2. Barcode Scanner
- Real-time barcode scanning using device camera
- Supports multiple barcode formats: EAN, UPC, Code 128, Code 39
- Automatic ISBN validation
- Works with both ISBN-10 and ISBN-13 formats

### 3. Image Upload with OCR
- Upload images of book covers or ISBN barcodes
- Extract ISBN information from images
- Supports JPG, PNG, and HEIC formats
- Mobile camera integration for quick captures

### 4. Manual Book Entry
- Add books manually with custom information
- Required: Title
- Optional: Author, ISBN, Publisher, Year
- Perfect for books without barcodes or PDFs

### 5. Book Information Retrieval
- Automatic book lookup using Google Books API
- Fetches title, author, publisher, year, and description
- Falls back to library catalog if available
- Displays book thumbnails when available

### 6. Personal Library Management
- View all books in your collection (grid layout)
- Remove books from library (with file deletion for PDFs)
- Track when books were added
- See how books were added (PDF, barcode, OCR, or manual)
- Direct PDF access with "Open PDF" links

## Usage

### Uploading a PDF
1. Navigate to "My Library" from the student dashboard
2. Click "Upload PDF/Image" button
3. Select a PDF file from your device
4. The PDF will be uploaded and added to your library
5. Click "Open PDF" on any PDF book to read it

### Scanning a Barcode
1. Click "Scan Barcode" button
2. Allow camera access when prompted
3. Position the book's barcode within the camera view
4. The scanner will automatically detect and add the book

### Uploading an Image
1. Click "Upload PDF/Image" button
2. Select an image from your device or take a new photo
3. The system will extract the ISBN and add the book

### Adding Manually
1. Click "Add Manually" button
2. Fill in the book details (at minimum, the title)
3. Click "Add Book" to save to your library

### Managing Your Library
- View all books in a grid layout
- PDF books show "PDF" badge and have "Open PDF" link
- Click the X button on any book to remove it
- Books are sorted by date added (newest first)
- Removing a PDF book also deletes the file from the server

## Technical Details

### Dependencies
- `quagga`: Barcode scanning library
- `html5-qrcode`: QR code and barcode detection
- `react-webcam`: Camera access for React

### API Endpoints
- `GET /api/student/library` - Fetch user's library
- `POST /api/student/library/upload` - Upload PDF or image file
- `POST /api/student/library/add` - Add book by ISBN (barcode)
- `POST /api/student/library/manual` - Add book manually
- `POST /api/student/library/ocr` - Process image for OCR (legacy)
- `DELETE /api/student/library/[id]` - Remove book from library (and delete PDF if applicable)

### Database Schema
Collection: `personal_libraries`
```javascript
{
  userId: ObjectId,
  title: String,
  author: String,
  isbn: String (optional),
  publisher: String (optional),
  year: String (optional),
  description: String (optional),
  thumbnail: String (optional),
  
  // For PDF uploads
  fileType: String, // 'application/pdf'
  fileName: String,
  fileUrl: String, // '/uploads/ebooks/filename.pdf'
  fileSize: Number,
  
  addedAt: Date,
  addedMethod: String // 'pdf-upload', 'barcode', 'image-ocr', or 'manual'
}
```

### File Storage
- PDFs are stored in: `public/uploads/ebooks/`
- Filenames are timestamped to prevent conflicts
- Files are automatically deleted when books are removed
- The uploads folder is gitignored for security

## Security Considerations
- Only authenticated students can access their library
- Users can only view/delete their own books
- PDF files are stored with timestamped names to prevent conflicts
- File uploads are validated for type (PDF or images only)
- Maximum file size should be configured in production

## Future Enhancements
- PDF viewer integration (in-app reading)
- Reading progress tracking
- Book notes and highlights
- Full-text search within PDFs
- Sharing library with friends
- Export library to CSV/PDF
- Integration with Goodreads
- Book recommendations based on library
- Loan tracking for personal books
- Cloud storage integration (AWS S3, Google Cloud Storage)
- Advanced OCR with Google Cloud Vision or Tesseract.js
- Batch upload support
- Book categories and tags
