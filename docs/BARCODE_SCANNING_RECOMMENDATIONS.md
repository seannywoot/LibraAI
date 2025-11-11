# Barcode Scanning and Recommendations Feature

## Overview
Students can now scan book barcodes to add books to their personal library and immediately see similar book recommendations.

## User Flow

### 1. Scan a Book
**Location:** `/student/library` (Personal Collection tab)

1. Click **"Scan Barcode"** button
2. Camera opens with barcode scanner
3. Point camera at book's ISBN barcode
4. Scanner automatically detects and validates ISBN (10 or 13 digits)

### 2. Book Added & Navigation
After successful scan:
- Book is added to personal library
- Success toast notification appears
- **Automatically redirects** to book detail page

### 3. View Book Details & Recommendations
**Location:** `/student/library/[bookId]`

The detail page shows:
- **Book Information:**
  - Title, Author, ISBN
  - Publisher, Publication Year
  - Description/Notes
  - Date Added, File Type

- **Similar Books Section:**
  - Grid of 3-6 recommended books
  - Based on author, category, or subject similarity
  - Each recommendation shows:
    - Book cover placeholder
    - Title and author
    - Reason for recommendation
    - Link to book details

## Technical Implementation

### API Endpoints

#### 1. Add Book via Barcode
**Endpoint:** `POST /api/student/library/add`

**Request:**
```json
{
  "isbn": "9780134685991",
  "method": "barcode"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Book added to library",
  "book": {
    "title": "Effective Java",
    "author": "Joshua Bloch",
    "isbn": "9780134685991",
    "publisher": "Addison-Wesley",
    "year": "2018",
    "description": "...",
    "thumbnail": "https://..."
  },
  "bookId": "507f1f77bcf86cd799439011"
}
```

**Metadata Retrieval Logic:**
1. Check MongoDB `books` collection (library catalog)
2. If not found, fetch from Google Books API
3. Store in `personal_libraries` collection

#### 2. Get Recommendations
**Endpoint:** `GET /api/student/recommendations?context=library&bookId={bookId}`

**Response:**
```json
{
  "ok": true,
  "recommendations": [
    {
      "_id": "...",
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "reason": "Similar author style and programming topics"
    }
  ]
}
```

### Components

#### BarcodeScanner Component
**File:** `src/components/barcode-scanner.jsx`

**Features:**
- Uses Quagga library for barcode detection
- Supports: EAN, UPC, Code 128, Code 39
- Validates ISBN format
- Real-time camera preview
- Error handling for camera access

**Props:**
```javascript
<BarcodeScanner
  onDetected={(isbn) => handleBarcodeDetected(isbn)}
  onError={(error) => showToast(error, "error")}
/>
```

#### RecommendationCard Component
**File:** `src/components/recommendation-card.jsx`

Displays individual book recommendations with:
- Book cover
- Title and author
- Recommendation reason
- Click to view details

### Database Collections

#### personal_libraries
Stores student's personal book collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  isbn: String,
  title: String,
  author: String,
  publisher: String,
  year: String,
  description: String,
  thumbnail: String,
  addedAt: Date,
  addedMethod: "barcode" | "manual" | "upload"
}
```

## Recommendation Algorithm

The system recommends books based on:
1. **Same Author** - Books by the same author
2. **Same Category** - Books in similar categories
3. **Similar Subjects** - Books with overlapping topics
4. **User Behavior** - Based on browsing/borrowing history
5. **Collaborative Filtering** - What similar users liked

## User Benefits

✅ **Quick Book Entry** - No manual typing required
✅ **Instant Metadata** - Automatic title, author, description
✅ **Discovery** - Find similar books immediately
✅ **Personalized** - Recommendations based on scanned book
✅ **Seamless Flow** - Scan → Details → Recommendations

## Testing

### Test Barcode Scanning
1. Go to `/student/library`
2. Click "Scan Barcode"
3. Use a book with ISBN barcode
4. Verify:
   - Scanner detects ISBN
   - Book is added
   - Redirects to detail page
   - Recommendations load

### Test Recommendations
1. Scan a book (e.g., programming book)
2. Check detail page shows:
   - Book information
   - "Similar Books You Might Like" section
   - 3+ recommendations
   - Each recommendation is clickable

### Test Edge Cases
- **Book already in library:** Shows error toast
- **Invalid ISBN:** Scanner continues scanning
- **No recommendations:** Shows "No similar books found" message
- **Camera permission denied:** Shows error message

## Future Enhancements

- [ ] Add book cover images from Google Books
- [ ] Show recommendation confidence scores
- [ ] Allow filtering recommendations by category
- [ ] Add "Not interested" feedback for recommendations
- [ ] Track which recommendations users click
- [ ] Implement machine learning for better recommendations
- [ ] Support QR codes in addition to barcodes
- [ ] Batch scanning for multiple books

## Related Files

- `src/app/student/library/page.js` - Main library page with scanner
- `src/app/student/library/[bookId]/page.js` - Book detail with recommendations
- `src/app/api/student/library/add/route.js` - Add book API
- `src/components/barcode-scanner.jsx` - Scanner component
- `src/components/recommendation-card.jsx` - Recommendation display
- `src/lib/recommendation-engine.js` - Recommendation logic

## Requirement Status

✅ **7.1** Add file/camera input - COMPLETE
✅ **7.2** Integrate barcode reader - COMPLETE  
✅ **7.3** Retrieve metadata from MongoDB - COMPLETE
✅ **7.4** Display details + similar books - COMPLETE

All requirements for "Book/PDF Scanning and Information Retrieval" are now implemented!
