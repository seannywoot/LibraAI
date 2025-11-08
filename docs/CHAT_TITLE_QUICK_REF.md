# Chat Title Generation - Quick Reference

## How It Works

1. **After 2 user messages**: Title is automatically generated
2. **API first**: Calls Gemini API for intelligent title
3. **Fallback**: Uses heuristic if API fails
4. **Drift detection**: Regenerates when topic changes significantly

## Title Format

- 3-6 words
- Title Case
- No articles at start (the, a, an)
- No generic words (help, question, chat)
- Descriptive and specific

## Examples

| User Message | Generated Title |
|--------------|----------------|
| "How do I bake sourdough bread?" | Bake Sourdough Bread Home |
| "Can you help me debug Python code?" | Debug Python Code List Comprehension |
| "Recommend science fiction books" | Recommend Science Fiction Books |
| "Tell me about Ernest Hemingway" | Ernest Hemingway His Writing Style |

## Troubleshooting

### Title shows as "Conversation"

**Possible causes**:
1. API key not set or invalid
2. API request failing
3. Not enough messages yet (need 2+ user messages)

**Check**:
```bash
# Test the heuristic fallback
node scripts/test-title-improvements.mjs

# Test the API endpoint (requires dev server running)
node scripts/test-title-api.mjs
```

**Browser console**:
- Look for "Generated title from API:" or "Heuristic title:"
- Check for errors in network tab for `/api/chat/title`

### Title not updating on topic change

**Expected behavior**: Only updates when topic significantly changes

**Triggers**:
- Explicit phrases: "switching topic", "change topic", etc.
- Very low similarity (< 0.15) with long message (> 10 tokens)
- No overlap with current title and low similarity (< 0.25)

**Not triggered**:
- Related questions on same topic
- Follow-up questions
- Clarifications

## Configuration

Edit `src/utils/chatTitle.js`:

```javascript
// Adjust drift detection sensitivity
if (similarity < 0.15 && recentTokens.length > 10) return true;

// Add more stopwords
const STOPWORDS = new Set([...]);

// Change title length
const finalWords = titleWords.slice(0, 6); // max 6 words
```

Edit `src/app/api/chat/title/route.js`:

```javascript
// Change AI model
model: 'gemini-2.0-flash-exp'

// Adjust creativity
temperature: 0.3  // lower = more consistent

// Change max length
maxOutputTokens: 20
```

## Testing

```bash
# Run all tests
node scripts/test-title-improvements.mjs

# Test real scenarios
node scripts/test-real-scenario.mjs

# Debug drift detection
node scripts/debug-drift.mjs
```

## API Endpoint

**POST** `/api/chat/title`

**Request**:
```json
{
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**:
```json
{
  "title": "Generated Title Here"
}
```

**Error**:
```json
{
  "error": "Failed to generate title"
}
```

## Key Files

- `src/utils/chatTitle.js` - Core logic
- `src/app/api/chat/title/route.js` - API endpoint
- `src/components/chat-interface.jsx` - UI integration
- `scripts/test-*.mjs` - Test scripts
