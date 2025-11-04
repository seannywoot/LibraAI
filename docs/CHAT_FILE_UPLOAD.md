# Chat File Upload Feature

## Overview
Users can now upload PDF documents and images directly in the chat interface. The AI assistant can analyze these files and answer questions about their content.

## Supported File Types

### Documents
- **PDF** (.pdf) - Text documents, books, papers, forms

### Images
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **GIF** (.gif)
- **WebP** (.webp)

## File Size Limit
- Maximum file size: **10 MB**

## How to Use

### Uploading a File

1. Click the **paperclip icon** (📎) in the chat input area
2. Select a PDF or image file from your device
3. The file will appear above the input box with its name and size
4. (Optional) Add a message or question about the file
5. Click **Send** to submit

### Removing an Attachment

- Click the **X** button next to the attached file before sending
- The file will be removed and you can select a different one

## Use Cases

### PDF Documents
- "Summarize this document"
- "What are the main points in this PDF?"
- "Extract key information from this paper"
- "Translate this document"
- "Find specific information in this PDF"

### Images
- "What's in this image?"
- "Describe this book cover"
- "Read the text from this image"
- "What book is this?"
- "Identify this author"
- "Extract ISBN from this book cover"

## Features

### Visual Feedback
- Attached files show name and size
- File icon appears in sent messages
- Clear indication when file is attached

### Smart Analysis
- AI can read and analyze PDF content
- AI can describe and interpret images
- AI can extract text from images (OCR)
- AI provides context-aware responses

### Conversation Context
- Files are part of the conversation flow
- AI remembers file content in the conversation
- Follow-up questions work naturally

## Technical Details

### File Processing
1. File is uploaded from client
2. Converted to base64 for API transmission
3. Sent to Gemini AI with inline data
4. AI analyzes file content
5. Response generated based on file and message

### Logging
All file uploads are logged with:
- User information
- File name and type
- Timestamp
- Conversation context
- AI response

### Security
- File type validation on client and server
- File size limits enforced
- Only authenticated users can upload
- Files processed in memory (not stored permanently)
- No sensitive data retention

## Limitations

1. **File Size**: Maximum 10 MB per file
2. **File Types**: Only PDFs and images supported
3. **Processing Time**: Large files may take longer to analyze
4. **One File at a Time**: Can only attach one file per message
5. **No Permanent Storage**: Files are not saved after processing

## Example Conversations

### PDF Analysis
**User:** *Uploads research paper PDF*
"What are the key findings in this paper?"

**AI:** "Based on the PDF you uploaded, this research paper discusses... The key findings are: 1) ... 2) ... 3) ..."

### Image Recognition
**User:** *Uploads book cover image*
"What book is this?"

**AI:** "This appears to be 'Foundation' by Isaac Asimov. The cover shows... Would you like me to check if we have this book in our library?"

### Text Extraction
**User:** *Uploads photo of ISBN barcode*
"Add this book to my library"

**AI:** "I can see the ISBN is 978-0-553-29335-0. Let me search our catalog for this book..."

## Privacy & Data Handling

- Files are processed in real-time
- No permanent storage of uploaded files
- File content used only for current conversation
- Metadata logged for analytics (filename, type, size)
- Actual file content not stored in database

## Future Enhancements

- Support for more file types (DOCX, TXT, EPUB)
- Multiple file uploads per message
- File preview before sending
- Drag-and-drop file upload
- Voice message support
- Video file analysis
- Larger file size limits
- File history/library
- Share files between conversations
