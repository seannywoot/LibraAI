# Update Existing Chat Titles

This guide explains how to fix titles for existing conversations in your chat history.

## Problem

Existing conversations may have titles with:
- Typos (e.g., "What Books Aer Available Borrow")
- Incomplete phrases
- Generic names like "Conversation"

## Solutions

### Option 1: Browser Console Script (Recommended)

This updates titles for conversations stored in your browser's localStorage.

**Steps:**

1. Open LibraAI in your browser
2. Open DevTools (Press `F12` or `Ctrl+Shift+I`)
3. Go to the **Console** tab
4. Copy the entire content of `scripts/fix-titles-browser.js`
5. Paste into the console and press Enter
6. Wait for the script to complete (shows progress for each conversation)
7. Refresh the page to see updated titles

**What it does:**
- Scans all conversations in localStorage
- Identifies titles with typos or issues
- Calls the title API to generate new titles
- Updates both localStorage and database
- Shows detailed progress in console

**Example output:**
```
🚀 Starting title fix...

📊 Found 5 conversations

[1/5] Processing:
  Current title: "What Books Aer Available Borrow"
  Messages: 5
  🔄 Generating new title...
  ✨ New title: "Available Books To Borrow"
  💾 Saved to database
  ✅ Updated successfully

[2/5] Processing:
  Current title: "Python Programming Help"
  Messages: 8
  ✓ Title looks good, skipping

...

📈 Summary:
  ✅ Updated: 2
  ⏭️  Skipped: 2
  ❌ Failed: 1
  📊 Total: 5

✅ Done! Refresh the page to see updated titles.
```

### Option 2: Server-Side Script

For conversations stored in MongoDB (if you have database access).

**Steps:**

1. Ensure you have `.env.local` with `MONGODB_URI` and `GEMINI_API_KEY`
2. Run the script:
   ```bash
   node scripts/fix-existing-titles.mjs
   ```

**What it does:**
- Connects to MongoDB
- Finds all conversations in the database
- Regenerates titles for problematic ones
- Updates database directly
- Shows progress and summary

### Option 3: Manual Update

For individual conversations:

1. Open the conversation in the chat interface
2. Click "New Chat" to start fresh
3. The old conversation keeps its title
4. Or wait for topic drift detection to regenerate the title automatically

## What Gets Updated

The scripts check for these issues:

✓ **Common typos**: aer, teh, hte, waht, availble, etc.  
✓ **Generic titles**: "Conversation", "New Chat"  
✓ **Incomplete phrases**: Titles ending with prepositions (to, for, with, about, from)

Titles that look good are skipped to save API calls.

## Rate Limiting

Both scripts include 1-second delays between API calls to avoid rate limiting.

For many conversations, the process may take several minutes.

## Troubleshooting

### "No chat history found"
- You haven't created any conversations yet
- Or conversations are in database only (use Option 2)

### "Failed to generate title" or 500 Error
- Check your internet connection
- Verify `GEMINI_API_KEY` is valid in `.env.local`
- Run diagnostics: `node scripts/diagnose-title-api.mjs`
- Check browser console for detailed errors
- See: `docs/TROUBLESHOOTING_TITLE_API.md` for detailed help

### "Failed to save to database"
- You may not be logged in
- Database connection issues
- The script will still save to localStorage

### Script stops or hangs
- Refresh the page and run again
- The script skips already-updated titles
- Check for API rate limits

## After Running

1. **Refresh the page** to see updated titles in the UI
2. Check the chat history sidebar
3. Titles should now be grammatically correct and descriptive

## Prevention

New conversations automatically get high-quality titles thanks to:
- Enhanced AI prompt with quality requirements
- Automatic validation and retry logic
- Improved fallback heuristic

You shouldn't need to run these scripts again for new conversations.

## Files

- `scripts/fix-titles-browser.js` - Browser console script
- `scripts/fix-existing-titles.mjs` - Server-side Node.js script
- `src/app/api/chat/title/route.js` - Title generation API (improved)
- `src/utils/chatTitle.js` - Title utilities (improved)

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API keys are set correctly
3. Ensure you're logged in (for database sync)
4. Try the manual update option for specific conversations
