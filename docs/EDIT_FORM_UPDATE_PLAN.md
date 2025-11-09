# Edit Book Form Update Plan

## Features to Add from Add Book Form

### 1. PDF Upload for eBooks
- Add `pdfFile` and `extractingMetadata` state
- Add `handlePDFUpload` function
- Update eBook file input to upload PDF and extract metadata
- Store PDF ID instead of filename

### 2. Year Field Improvements
- Change to numeric-only input
- Add 4-digit limit with `maxLength={4}`
- Add pattern validation `/^\d{0,4}$/`
- Add onBlur validation for future years
- Real-time filtering of non-numeric characters

### 3. Author Dropdown
- Use dropdown with existing authors
- Add "Add custom author" option
- Show text input when custom selected
- Match add book form behavior

### 4. Enhanced Validation
- Match validateForm() from add book form
- Add author name validation (no numbers, valid characters)
- Add ISBN 13-digit validation
- Add publisher validation
- Add barcode minimum length check

### 5. UI/UX Improvements
- Match styling from add book form
- Consistent error messages
- Better field organization
- Improved help text

## Key Changes Needed

1. **State additions:**
   ```javascript
   const [pdfFile, setPdfFile] = useState(null);
   const [extractingMetadata, setExtractingMetadata] = useState(false);
   ```

2. **Year input update:**
   - Add numeric-only validation
   - Add maxLength={4}
   - Add onBlur future year check

3. **Author field update:**
   - Change from text input to dropdown
   - Add custom author option

4. **PDF upload for eBooks:**
   - Add handlePDFUpload function
   - Update file input onChange

5. **Validation function:**
   - Update to match add book form validation

## Implementation Priority

1. ✅ Year field validation (HIGH - data integrity)
2. ✅ Author dropdown (HIGH - consistency)
3. ✅ PDF upload (MEDIUM - new feature)
4. ✅ Enhanced validation (MEDIUM - data quality)
5. ✅ UI polish (LOW - nice to have)
