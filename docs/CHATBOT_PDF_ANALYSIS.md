# AI Chatbot PDF Document Analysis Feature

## Overview
The LibraAI chatbot now has the ability to read, analyze, and summarize PDF documents. Users can upload PDF files and ask the AI to provide summaries, create bullet points, or answer specific questions about the document content.

## Features

### PDF Text Extraction
- Automatically extracts text from uploaded PDF documents using `pdfjs-dist`
- Processes all pages and maintains page number references
- Provides word count and page count information

### Analysis Capabilities
The AI can:
- **Summarize**: Provide concise overviews (2-4 paragraphs) of the entire document
- **Create Bullet Points**: Extract and list key points in a structured format
- **Answer Questions**: Respond to specific queries about the document content
- **Identify Themes**: Highlight main topics, arguments, or themes
- **Extract Information**: Pull out specific details based on user requests

## How to Use

### For Users

1. **Upload a PDF**
   - Click the paperclip icon (📎) in the chat input area
   - Select a PDF file (max 10MB)
   - The file will be attached and ready for analysis

2. **Ask for Analysis**
   - Type your request in the message box
   - Example prompts:
     - "Summarize this document"
     - "Create bullet points of the key information"
     - "What are the main topics discussed?"
     - "Extract the key findings from this report"
     - "What does page 5 say about [topic]?"

3. **Get Results**
   - The AI will process the PDF and provide the requested analysis
   - Responses include page references when citing specific information

### Example Prompts

**For Summaries:**
- "Summarize this PDF"
- "Give me an overview of this document"
- "What is this paper about?"

**For Bullet Points:**
- "Create bullet points from this document"
- "List the key points"
- "What are the main takeaways?"

**For Specific Questions:**
- "What methodology was used in this research?"
- "What are the conclusions?"
- "Find information about [specific topic]"

## Technical Implementation

### Backend (API Route)
**File**: `src/app/api/chat/route.js`

#### PDF Text Extraction Function
```javascript
async function extractTextFromPDF(base64Data) {
  // Converts base64 to Uint8Array
  // Loads PDF using pdfjs-dist
  // Extracts text from each page
  // Returns: { success, text, pageCount, wordCount }
}
```

#### Processing Flow
1. User uploads PDF via FormData
2. File is converted to base64
3. Text extraction is performed
4. Extracted text is included in the AI prompt
5. AI analyzes the text and responds based on user's request

#### Enhanced System Context
The AI system prompt now includes:
- Instructions for PDF document analysis
- Guidelines for different response types (summary, bullets, Q&A)
- Instructions to reference page numbers when citing information

### Frontend (Chat Interface)
**File**: `src/components/chat-interface.jsx`

#### UI Enhancements
- **PDF Icon Display**: Shows a red document icon for PDF attachments
- **Helpful Hints**: Displays suggestions like "Try: 'Summarize this', 'Create bullet points'"
- **Toast Notifications**: Informs users about PDF capabilities when they attach a file
- **Updated Placeholders**: Dynamic placeholder text guides users on what to ask
- **Message Display**: PDF attachments shown with document icon in chat history

#### User Experience Features
- Visual feedback when PDF is attached
- Contextual placeholder text
- Helpful suggestions for PDF analysis
- Clear indication of file type and size

## File Size and Type Limits

- **Maximum File Size**: 10MB
- **Supported Format**: PDF (application/pdf)
- **Also Supports**: Images (JPG, PNG, GIF, WebP) for visual analysis

## Error Handling

### PDF Text Extraction Failures
If text extraction fails:
1. System logs the error
2. Falls back to sending PDF as binary data to Gemini
3. Gemini attempts direct PDF analysis
4. User receives a response (may be less detailed)

### File Validation
- Type checking prevents unsupported file uploads
- Size validation prevents oversized files
- Clear error messages guide users

## AI Model Support

### Primary: Gemini 2.5 Flash
- Full PDF analysis support
- Can process both extracted text and binary PDF data
- Provides detailed summaries and analysis

### Fallback: Qwen3-4B-Instruct
- Currently processes extracted text only
- No binary PDF support in current implementation
- Still provides good text-based analysis

## Database Logging

All PDF interactions are logged to MongoDB:
- User information
- Conversation ID
- Message content
- AI response
- Attachment metadata (type, name, size)
- Model used for response

## Future Enhancements

Potential improvements:
- [ ] Support for larger PDF files (chunking)
- [ ] Table extraction and formatting
- [ ] Image extraction from PDFs
- [ ] Multi-document comparison
- [ ] Citation generation
- [ ] Export analysis results
- [ ] PDF annotation suggestions
- [ ] Language translation of PDF content

## Testing

### Manual Testing Checklist
- [ ] Upload a PDF file
- [ ] Request a summary
- [ ] Request bullet points
- [ ] Ask specific questions about content
- [ ] Test with multi-page documents
- [ ] Test with different PDF types (text-heavy, image-heavy)
- [ ] Verify page references in responses
- [ ] Test error handling with corrupted PDFs

### Test Documents
Use various PDF types:
- Research papers
- Reports
- Articles
- Books/chapters
- Forms
- Presentations

## Security Considerations

- File size limits prevent DoS attacks
- File type validation prevents malicious uploads
- User authentication required for chat access
- All uploads are temporary (not permanently stored)
- PDF processing happens server-side

## Performance

- Text extraction is fast (< 2 seconds for most PDFs)
- AI processing time depends on document length
- Typical response time: 3-10 seconds
- Longer documents may take more time

## Troubleshooting

### "Text extraction failed"
- PDF may be image-based (scanned document)
- PDF may be encrypted or password-protected
- PDF may be corrupted
- Solution: System will attempt direct PDF analysis

### Slow responses
- Large documents take longer to process
- Consider asking for specific sections
- Break complex questions into smaller parts

### Incomplete analysis
- Very long documents may be truncated
- Ask for specific sections or pages
- Request focused analysis on particular topics

## Related Documentation

- [Chat Interface Documentation](./CHATBOT_QUICK_START.md)
- [AI Integration Guide](./AI_MIGRATION_SUMMARY.md)
- [File Upload Setup](./CHAT_FILE_UPLOAD.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error messages in browser console
3. Verify PDF file is valid and under 10MB
4. Try with a different PDF file
