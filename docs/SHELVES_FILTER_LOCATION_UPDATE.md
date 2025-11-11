# Shelves Filter & Location Update

## Changes Made

### 1. Shelves Filtering Update
Changed shelf filtering from **code AND name** to **code OR location** since code and location are connected.

#### Admin Shelves Page (`src/app/admin/shelves/page.js`)
- Updated search placeholder from "Filter by code or name" to "Filter by code or location"

#### Admin Shelves API (`src/app/api/admin/shelves/route.js`)
- Changed search query from filtering by `codeLower` OR `nameLower` to `codeLower` OR `location`

#### Student Shelves Page (`src/app/student/shelves/page.js`)
- Updated search placeholder from "Search shelves..." to "Search by code or location..."

#### Student Shelves API (`src/app/api/student/shelves/route.js`)
- Removed `name` field from search queries
- Now searches only by `code` and `location` fields
- Updated both free text search and default search to exclude name field

### 2. Location Field Made Required

#### Admin Shelves Page (`src/app/admin/shelves/page.js`)
- Changed "Location (optional)" label to "Location"
- Added `required` attribute to location input field
- Added client-side validation to check if location is provided before submitting

#### Admin Shelves API - Create (`src/app/api/admin/shelves/route.js`)
- Added server-side validation: `if (!location) return error "Location is required"`

#### Admin Shelves API - Update (`src/app/api/admin/shelves/[id]/route.js`)
- Added server-side validation: `if (!location) return error "Location is required"`

## Impact

### Before
- Shelves could be created without a location
- Search filtered by code and name (name not always connected to code)
- Inconsistent shelf data

### After
- All new shelves must have a location
- Search filters by code or location (both connected fields)
- More consistent and meaningful search results
- Better data integrity

## Testing Checklist

- [ ] Try creating a shelf without location (should show error)
- [ ] Try updating a shelf and removing location (should show error)
- [ ] Search shelves by code (should work)
- [ ] Search shelves by location (should work)
- [ ] Verify existing shelves without location can still be viewed
- [ ] Verify search no longer uses name field
