# AI Migration: OpenAI GPT-OSS-20B with Gemini Fallback

## Changes Made

### 1. Primary AI: Qwen3-4B-Instruct-2507 (via Bytez)
- **Model**: `Qwen/Qwen3-4B-Instruct-2507`
- **Provider**: Bytez.js SDK
- **API Key**: Stored in `.env.local` as `BYTEZ_API_KEY`

### 2. Fallback AI: Gemini 2.5 Flash
- Automatically used if OpenAI fails
- Maintains all existing function calling capabilities
- Seamless fallback with no user-facing errors

### 3. Console Logging
All routes now log which AI is handling requests:

**Qwen Success:**
```
🤖 Attempting to use Qwen3-4B-Instruct-2507 via Bytez...
✅ Qwen3-4B-Instruct-2507 responded successfully
```

**Gemini Fallback:**
```
⚠️ Qwen3-4B-Instruct-2507 failed, falling back to Gemini: [error message]
🔄 Using Gemini 2.5 Flash as fallback
```

## Updated Files

### `/src/app/api/chat/route.js` ✅
- Added Bytez SDK import and initialization
- Moved `systemContext` and `chatHistory` definitions before try-catch block (fixed initialization errors)
- Implemented try-catch for Qwen with Gemini fallback
- Added console logging for AI selection (server-side)
- Updated database logging to track which model was used
- Returns model name in API response for client-side logging

### `/src/app/api/chat/title/route.js` ✅
- Added Bytez SDK for title generation
- Implemented Qwen-first approach with Gemini fallback
- Added console logging for title generation
- Maintained retry logic for both AI providers

### `/scripts/fix-existing-titles.mjs` ✅
- Added Bytez SDK import and initialization
- Updated to use Qwen3-4B-Instruct-2507 as primary model
- Gemini fallback for reliability
- Console logging shows which AI is used for each title generation
- Maintains all existing validation and retry logic

### `/src/components/chat-interface.jsx` ✅
- Added client-side logging to display model used in browser console
- Logs `🤖 Model Used: [model-name]` after each AI response

## Environment Variables

Your `.env.local` already contains:
```env
GEMINI_API_KEY=AIzaSyDyh1KvcGlgnhb-2AyR3zlaIkuIP4R0HrY
BYTEZ_API_KEY=5181b15e33ebac4b8d79f19d37fcd764
```

## How It Works

1. **Chat Requests** (`/api/chat`):
   - Tries OpenAI GPT-OSS-20B first
   - If OpenAI fails, automatically falls back to Gemini
   - Gemini maintains function calling for book search, shelves, etc.
   - Logs which AI handled the request

2. **Title Generation** (`/api/chat/title`):
   - Tries OpenAI GPT-OSS-20B first
   - Falls back to Gemini if OpenAI fails
   - Both AIs use the same quality validation
   - Logs which AI generated the title

## Testing

To test the migration:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open the chat interface and send a message

3. **Check TWO places for logs:**

   **A. Server Console (Terminal where npm run dev is running):**
   - `🤖 Attempting to use Qwen3-4B-Instruct-2507 via Bytez...`
   - `✅ Qwen3-4B-Instruct-2507 responded successfully`
   - OR `⚠️ Qwen3-4B-Instruct-2507 failed, falling back to Gemini: [error]`
   - `🔄 Using Gemini 2.5 Flash as fallback`

   **B. Browser Console (F12 Developer Tools):**
   - `🤖 Model Used: Qwen/Qwen3-4B-Instruct-2507`
   - OR `🤖 Model Used: gemini-2.5-flash`

4. Test title generation by starting a new conversation

## Benefits

- **Cost Optimization**: OpenAI GPT-OSS-20B may be more cost-effective
- **Reliability**: Automatic fallback ensures service continuity
- **Transparency**: Console logs show which AI is being used
- **Database Tracking**: Chat logs now record which model was used
- **No Breaking Changes**: Existing functionality preserved

## Notes

- OpenAI model doesn't support function calling in this setup, so Gemini handles those requests
- Function calling features (book search, shelves, etc.) will automatically use Gemini
- Simple chat responses will use OpenAI when available
