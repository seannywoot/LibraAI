# Catalog Filters Persistence

## Overview
The catalog page now maintains filter state when navigating to book details and returning back. This provides a seamless browsing experience where users don't lose their search context.

## Implementation

### How It Works
1. **State Storage**: All filter state (search query, filters, sort order, page number, view mode) is automatically saved to `sessionStorage` whenever it changes
2. **State Restoration**: When returning to the catalog page, the component checks `sessionStorage` first before falling back to URL parameters
3. **Session Lifetime**: The state persists throughout the browser session, even across page refreshes
4. **Automatic Cleanup**: The state is cleared when the browser tab is closed

### Persisted State
The following state is preserved:
- Search input text
- Sort order (relevance, title, year, author)
- Current page number
- View mode (grid/list)
- All filters:
  - Resource types
  - Formats (Physical, eBook)
  - Categories
  - Availability status
  - Publication year range

### User Experience
**Before:**
1. User searches for "science fiction"
2. User applies filters (e.g., "Available only", "2020-2025")
3. User clicks on a book to view details
4. User clicks back button
5. ❌ Filters and search are lost, back to default view

**After:**
1. User searches for "science fiction"
2. User applies filters (e.g., "Available only", "2020-2025")
3. User clicks on a book to view details
4. User clicks back button
5. ✅ All filters, search, and results are exactly as they were

## Technical Details

### Storage Key
- Key: `catalogState`
- Storage: `sessionStorage` (cleared when tab closes)
- Format: JSON string

### State Structure
```javascript
{
  searchInput: string,
  sortBy: string,
  page: number,
  filters: {
    resourceTypes: string[],
    yearRange: [number, number],
    availability: string[],
    formats: string[],
    categories: string[]
  },
  viewMode: string
}
```

### Initialization Flow
1. Component mounts and checks `isInitialized` flag
2. If not initialized:
   - Try to restore state from `sessionStorage`
   - If no saved state, read from URL parameters
   - If no URL parameters, use default values
3. Set `isInitialized` to `true`
4. All data-fetching effects wait for `isInitialized` before running
5. This ensures filters are restored before books are loaded

### Fallback Behavior
If `sessionStorage` is unavailable or empty:
1. Check URL parameters
2. Fall back to default values

## Browser Compatibility
- Works in all modern browsers that support `sessionStorage`
- Gracefully degrades to URL-only state if `sessionStorage` is unavailable
- No breaking changes to existing functionality

## Testing
To verify the feature works:
1. Go to the catalog page
2. Apply some filters and search for something
3. Click on any book
4. Use browser back button
5. Verify all filters and search results are preserved
6. Refresh the page - state should still be there
7. Close and reopen the tab - state should be cleared
