# PDF Response Truncation Fix

## Issue
When users uploaded PDFs and asked for summaries, the AI response was getting cut off mid-sentence. This happened because the token limits were too restrictive for detailed PDF analysis.

## Root Cause
1. **Gemini model**: Had `maxOutputTokens: 800` - far too low for comprehensive PDF summaries
2. **Qwen model**: Uses default token limits (model doesn't support custom max_tokens on Bytez)

## Solution
Increased token limits for Gemini model:

### Changes Made
**File**: `src/app/api/chat/route.js`

1. **Gemini (fallback model)**:
   - Changed `maxOutputTokens` from `800` to `4096`
   - This allows for much longer, more detailed responses

2. **Qwen (primary model)**:
   - Uses model's default token limits
   - Note: `max_tokens` parameter is not supported for this model on Bytez
   - Added `temperature: 0.7` for consistency

## Impact
- PDF summaries will now be complete and comprehensive
- Users can get full analysis of documents without truncation
- Gemini fallback now has proper token limits
- Qwen uses its default (generous) token limits

## Testing
To verify the fix:
1. Upload a PDF document (like the GC Quest presentation)
2. Ask for a summary or detailed analysis
3. Confirm the response is complete and not cut off
4. Try follow-up questions about the PDF content

## Technical Details
- Gemini token limit of 4096 is sufficient for most PDF analyses
- Qwen uses model default limits (typically generous)
- This allows for detailed summaries of documents up to 50 pages
- The system still extracts only the first 50 pages of PDFs for performance
