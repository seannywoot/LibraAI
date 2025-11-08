# Notes Feature - Notion-like Editor

## Overview
A Notion-like note-taking and editing system for students to create, edit, and organize their notes.

## Features

### Note Management
- **Create Notes**: Students can create unlimited notes
- **Edit Notes**: Real-time auto-save (1-second debounce)
- **Delete Notes**: Remove notes with confirmation
- **Search Notes**: Search by title or content
- **List View**: Grid layout showing all notes with previews

### Rich Text Editor
The editor includes a toolbar with the following formatting options:

#### Text Formatting
- **Bold** (Ctrl+B)
- **Italic** (Ctrl+I)
- **Underline** (Ctrl+U)

#### Headings
- Heading 1 (Large)
- Heading 2 (Medium)
- Heading 3 (Small)

#### Lists
- Bullet List
- Numbered List

#### Special Blocks
- Quote Block
- Code Block

### Auto-Save
- Changes are automatically saved 1 second after typing stops
- Visual indicator shows "Saving..." and last saved time
- No manual save button needed

## File Structure

```
src/
├── app/
│   ├── student/
│   │   └── notes/
│   │       ├── page.js                    # Notes list page
│   │       └── [noteId]/
│   │           └── page.js                # Note editor page
│   └── api/
│       └── student/
│           └── notes/
│               ├── route.js               # GET all notes, POST new note
│               └── [noteId]/
│                   └── route.js           # GET, PUT, DELETE specific note
└── components/
    └── notion-editor.jsx                  # Rich text editor component
```

## Database Schema

### Notes Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to users collection
  title: String,                 // Note title
  content: String,               // HTML content
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### GET /api/student/notes
Get all notes for the current student
- **Auth**: Required (student role)
- **Response**: Array of notes sorted by updatedAt (newest first)

### POST /api/student/notes
Create a new note
- **Auth**: Required (student role)
- **Body**: `{ title: string, content: string }`
- **Response**: Created note object

### GET /api/student/notes/[noteId]
Get a specific note
- **Auth**: Required (student role, must own the note)
- **Response**: Note object

### PUT /api/student/notes/[noteId]
Update a note
- **Auth**: Required (student role, must own the note)
- **Body**: `{ title?: string, content?: string }`
- **Response**: Updated note object

### DELETE /api/student/notes/[noteId]
Delete a note
- **Auth**: Required (student role, must own the note)
- **Response**: Success confirmation

## Navigation
The Notes feature is accessible from the student sidebar:
- Icon: FileText
- Label: "Notes"
- Route: `/student/notes`

## Usage

### Creating a Note
1. Navigate to `/student/notes`
2. Click "New Note" button
3. Start typing in the editor
4. Changes auto-save

### Editing a Note
1. Click on any note from the list
2. Edit title or content
3. Changes auto-save automatically

### Deleting a Note
1. From the list: Click the trash icon on hover
2. From the editor: Click the trash icon in the top-right
3. Confirm deletion

### Searching Notes
1. Use the search bar on the notes list page
2. Search matches both title and content
3. Results update in real-time

## Keyboard Shortcuts
- **Ctrl+B**: Bold
- **Ctrl+I**: Italic
- **Ctrl+U**: Underline

## Styling
- Clean, minimal design inspired by Notion
- White background for editor (distraction-free)
- Gray background for list view
- Hover effects on interactive elements
- Responsive grid layout for note cards

## Future Enhancements
Potential features to add:
- Tags/categories for notes
- Note sharing with other students
- Export to PDF/Markdown
- Rich media embedding (images, videos)
- Collaborative editing
- Note templates
- Folders/organization
- Favorites/pinning
- Version history
