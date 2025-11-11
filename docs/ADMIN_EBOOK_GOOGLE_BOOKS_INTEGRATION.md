# Admin eBook Upload - Google Books Integration

## Overview
Enhanced the admin add book form to automatically extract and enrich metadata using Google Books API when an eBook (PDF) is uploaded, matching the functionality already present in the student library page.

## Changes Made

### File Modified
- `src/app/admin/books/add/page.js`

### Implementation Details

#### Enhanced `handlePDFUpload` Function
The PDF upload handler now:

1. **Uploads the PDF file** to the server
2. **Extracts basic metadata** from the PDF (title, author, year, publisher)
3. **Queries Google Books API** using the extracted title
4. **Auto-fills form fields** with enriched data from Google Books:
   - Title (from Google Books if available)
   - Author (first author from Google Books)
   - Year (publication year)
   - Publisher
   - ISBN (13-digit identifier)
   - Description
   - Category (mapped from Google Books categories)
   - Cover Image (thumbnail URL)

#### Category Mapping
Google Books categories are intelligently mapped to the library's category system:
- Fiction → Fiction
- Science/Mathematics → Science
- Technology/Computers → Technology
- History → History
- Biography → Biography
- Self-Help/Psychology → Self-Help
- Business → Business
- Art → Arts
- Education → Education
- Juvenile → Children
- Young Adult → Young Adult
- Philosophy/Religion → Non-Fiction
- Default → Non-Fiction

#### User Experience
- Shows loading message: "Uploading PDF and extracting metadata from Google Books..."
- Success message: "PDF uploaded and enriched with Google Books data!" (if found)
- Fallback message: "PDF uploaded and metadata extracted successfully!" (if not found)
- Only fills empty fields (doesn't overwrite user input)
- Automatically marks form as having unsaved changes

## Benefits

1. **Consistency**: Admin and student upload flows now use the same Google Books enrichment
2. **Time Savings**: Admins don't need to manually enter book details
3. **Data Quality**: More accurate and complete book information
4. **Better Discovery**: Enriched descriptions and categories improve search and recommendations
5. **Cover Images**: Automatically fetches book cover thumbnails

## Usage

1. Navigate to Admin → Books → Add Book
2. Select "eBook" as the format
3. Upload a PDF file
4. The form will automatically populate with:
   - Basic metadata from the PDF
   - Enhanced data from Google Books API
   - Cover image (if available)
5. Review and adjust any fields as needed
6. Submit to add the book to the catalog

## Technical Notes

- Uses the same Google Books API endpoint as student library: `https://www.googleapis.com/books/v1/volumes`
- Searches by title extracted from PDF filename or metadata
- Handles API failures gracefully (continues with basic metadata)
- Respects existing form values (only fills empty fields)
- Logs search queries and results to console for debugging

## Related Files
- Student library upload: `src/app/api/student/library/upload/route.js`
- Student library page: `src/app/student/library/page.js`
