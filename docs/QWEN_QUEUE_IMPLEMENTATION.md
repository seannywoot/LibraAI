# AI Model Separation Implementation

## Problem
Bytez API has a concurrency limit of 1 for the free tier. When a user sends a message:
1. Chat response generation calls Qwen
2. Title generation calls Qwen simultaneously
3. Both requests hit the API at the same time → Rate limit error
4. System falls back to Gemini

## Solution
**Separated AI model usage:**
- **Qwen**: Exclusively for chatbot responses (main conversation)
- **Gemini**: Exclusively for title generation

This eliminates concurrent Qwen calls and maximizes the use of the free tier.

## Implementation

### New File: `src/lib/qwenQueue.js`
- Simple queue class that processes one request at a time
- Singleton instance for future scalability
- Currently only used by chat route

### Updated Files

**1. `src/app/api/chat/route.js`**
- Added queue import
- Wrapped Qwen API call with `qwenQueue.add()`
- Logs queue length when requests are waiting
- **Uses Qwen exclusively for chat responses**

**2. `src/app/api/chat/title/route.js`**
- Removed all Qwen/Bytez imports
- **Uses Gemini exclusively for title generation**
- Simplified logic (no fallback needed)
- Faster title generation (no queue wait)

## How It Works
1. User sends message → Chat route uses Qwen (queued)
2. Title generation → Uses Gemini (no queue, instant)
3. No concurrent Qwen calls = No rate limit errors
4. Each model optimized for its task

## Benefits
- **Eliminates rate limit errors** - No concurrent Qwen calls
- **Faster title generation** - Gemini runs immediately, no queue
- **Better resource usage** - Each model for its strength
- **Simpler code** - No complex fallback logic in title route
- **Cost effective** - Maximizes free tier usage
