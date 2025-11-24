# Catalog Filters - Quick Reference
**Last Updated:** November 24, 2025

---

## 🚀 Quick Start

### Filter Persistence
Filters automatically persist in URL. Share URLs to share filter states.

**Example URL:**
```
/student/books?search=harry&formats=Physical&categories=Fiction&yearMin=2000
```

### Year Search
Type years directly in search bar:
```
2020                → Books from 2020
Harry Potter 2001   → Harry Potter books from 2001
year: 2015          → Books from 2015 (explicit syntax)
```

### Clear Filters
Click "Clear All Filters" button in filter modal to reset everything.

---

## 📋 URL Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `search` | string | `harry` | Search query text |
| `sortBy` | string | `year` | Sort option (relevance, title, year, author) |
| `page` | number | `2` | Current page number |
| `resourceTypes` | csv | `Books,Articles` | Resource type filters |
| `formats` | csv | `Physical,eBook` | Format filters |
| `categories` | csv | `Fiction,Science` | Category filters |
| `availability` | csv | `Available,Reserved` | Availability filters |
| `yearMin` | number | `2000` | Minimum year |
| `yearMax` | number | `2020` | Maximum year |

---

## 🔍 Search Syntax

### Basic Search
```
harry potter        → Searches title, author, ISBN
```

### Year Search
```
2020                → Books from 2020
year: 2015          → Books from 2015 (explicit)
Harry Potter 2001   → Combined search
```

### Field-Specific Search
```
author: Rowling     → Search by author
title: Harry        → Search by title
isbn: 978-0-7475    → Search by ISBN
year: 2001          → Search by year
```

### Combined Search
```
author: Rowling year: 2001    → Multiple fields
Harry Potter 2001             → Free text + year
```

---

## 🎨 Filter Options

### Resource Type
- Books (default)
- Articles (no data yet)
- Journals (no data yet)
- Theses (no data yet)

### Format
- Physical
- eBook

### Availability
- Available
- Checked Out
- Reserved

### Categories
Dynamic list loaded from database. Examples:
- Fiction
- Non-Fiction
- Science
- Technology
- History
- Biography

### Year Range
- Min: 1950
- Max: 2025
- Editable inputs with validation

---

## 🔧 Developer Notes

### Files Modified
```
src/app/student/books/page.js    → Main catalog page
src/utils/searchParser.js        → Search query parser
```

### Key Functions

**Initialize from URL:**
```javascript
useEffect(() => {
  const urlSearch = searchParams.get("search") || "";
  const urlFormats = searchParams.get("formats")?.split(",").filter(Boolean) || [];
  // ... set state from URL
}, []);
```

**Sync to URL:**
```javascript
useEffect(() => {
  const params = new URLSearchParams();
  if (searchInput) params.set("search", searchInput);
  // ... build URL
  window.history.replaceState({}, "", newUrl);
}, [searchInput, sortBy, page, filters]);
```

**Year Detection:**
```javascript
const yearMatch = freeText.match(/\b(19\d{2}|20\d{2})\b/);
if (yearMatch) {
  orConditions.push({ year: parseInt(yearMatch[1], 10) });
}
```

---

## 🧪 Testing

### Quick Test Commands
```bash
# Test filter persistence
1. Apply filters
2. Refresh page (F5)
3. Verify filters still applied

# Test year search
1. Type "2020" in search
2. Verify books from 2020 shown

# Test clear filters
1. Apply multiple filters
2. Click "Clear All Filters"
3. Verify all reset to defaults
```

### Full Testing Guide
See `docs/CATALOG_FILTERS_TESTING_GUIDE.md` for comprehensive test cases.

---

## 🐛 Troubleshooting

### Filters Not Persisting
- Check browser console for errors
- Verify URL parameters are present
- Check `isInitialized` state

### Year Search Not Working
- Verify year is 4 digits (1900-2099)
- Check search parser regex pattern
- Verify MongoDB year field exists

### Clear Filters Not Working
- Check filter state reset logic
- Verify default values are correct
- Check page reset to 1

---

## 📊 Performance

### Optimization Tips
- URL updates use `replaceState` (no reload)
- Search is debounced (300ms)
- Suggestions debounced (200ms)
- Pagination limits results (20 per page)

### Monitoring
- Check API response times
- Monitor filter application speed
- Track URL parameter size

---

## 🔗 Related Documents

- `ISSUES_STATUS_REPORT.md` - Overall status
- `CATALOG_FILTERS_TESTING_GUIDE.md` - Testing guide
- `CATALOG_FILTERS_IMPLEMENTATION_SUMMARY.md` - Implementation details

---

## ✅ Checklist

### Before Deployment
- [ ] All tests passed
- [ ] No console errors
- [ ] Performance verified
- [ ] Documentation updated
- [ ] Code reviewed

### After Deployment
- [ ] Smoke tests passed
- [ ] Monitor for errors
- [ ] User feedback collected
- [ ] Analytics tracking enabled

---

**Status:** ✅ Production Ready  
**Version:** 1.0  
**Last Tested:** November 24, 2025
