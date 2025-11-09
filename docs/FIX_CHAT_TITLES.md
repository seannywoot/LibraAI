# Fix Chat Titles - Quick Start

## Problem
Chat titles like "What Books Aer Available Borrow" have typos and grammar issues.

## Solution Implemented ✅

### For NEW Conversations
**Already fixed!** All new chats automatically get high-quality titles.

### For EXISTING Conversations
Run this browser script to update them:

## How to Update Existing Titles

### Step 1: Open Browser Console
1. Open LibraAI in your browser
2. Press `F12` (or `Ctrl+Shift+I` on Windows, `Cmd+Option+I` on Mac)
3. Click the **Console** tab

### Step 2: Run the Fix Script
1. Open the file: `scripts/fix-titles-browser.js`
2. Copy the entire content (Ctrl+A, Ctrl+C)
3. Paste into the browser console
4. Press `Enter`

### Step 3: Wait for Completion
The script will:
- Show progress for each conversation
- Update titles with typos or issues
- Skip titles that look good
- Display a summary when done

Example output:
```
🚀 Starting title fix...
📊 Found 5 conversations

[1/5] Processing:
  Current title: "What Books Aer Available Borrow"
  🔄 Generating new title...
  ✨ New title: "Available Books To Borrow"
  ✅ Updated successfully

📈 Summary:
  ✅ Updated: 2
  ⏭️  Skipped: 3
  📊 Total: 5

✅ Done! Refresh the page to see updated titles.
```

### Step 4: Refresh
Refresh the page to see your updated titles in the chat history!

## What Gets Fixed

✓ Typos (aer → are, teh → the, etc.)  
✓ Incomplete phrases  
✓ Generic titles like "Conversation"  

## Alternative: Server Script

If you have database access:
```bash
node scripts/fix-existing-titles.mjs
```

## Need Help?

See detailed documentation:
- `docs/UPDATE_EXISTING_TITLES.md` - Full guide
- `docs/TITLE_FIX_COMPLETE.md` - Complete summary
- `docs/TITLE_QUALITY_QUICK_REF.md` - Quick reference

## That's It!

New conversations automatically get perfect titles. Use the browser script to fix old ones.
