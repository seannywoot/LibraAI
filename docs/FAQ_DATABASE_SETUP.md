# FAQ Database Setup

## Overview
The FAQ system is now connected to MongoDB and integrated with the LibraAI chatbot. FAQs are stored in the database and dynamically loaded by both the FAQ page and the chat assistant.

## Initial Setup

### 1. Seed the FAQ Database
To populate the database with the initial FAQ data, make a POST request to the seed endpoint:

```bash
# Using curl
curl -X POST http://localhost:3000/api/faq/seed

# Or visit in browser (will trigger POST)
# http://localhost:3000/api/faq/seed
```

This will create 11 FAQs across 4 categories:
- **Borrowing** (4 FAQs)
- **Hours** (2 FAQs)
- **Facilities** (3 FAQs)
- **Policies** (2 FAQs)

### 2. Verify FAQs
Check that FAQs were created successfully:

```bash
curl http://localhost:3000/api/faq
```

## API Endpoints

### GET /api/faq
Fetch all active FAQs

**Query Parameters:**
- `category` - Filter by category (borrowing, hours, facilities, policies)
- `search` - Text search across questions, answers, and keywords

**Examples:**
```bash
# Get all FAQs
GET /api/faq

# Get borrowing FAQs only
GET /api/faq?category=borrowing

# Search FAQs
GET /api/faq?search=printing
```

### POST /api/faq
Create a new FAQ

**Body:**
```json
{
  "question": "How do I reset my password?",
  "answer": "Visit the profile page and click 'Reset Password'.",
  "category": "policies",
  "keywords": ["password", "reset", "login"]
}
```

### PUT /api/faq/[id]
Update an existing FAQ

**Body:**
```json
{
  "question": "Updated question?",
  "answer": "Updated answer.",
  "isActive": true
}
```

### DELETE /api/faq/[id]
Delete an FAQ

### POST /api/faq/seed
Seed the database with initial FAQ data (clears existing FAQs first)

## Database Schema

```javascript
{
  question: String (required),
  answer: String (required),
  category: String (required, enum: ["borrowing", "hours", "facilities", "policies"]),
  keywords: [String],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

## Integration with Chatbot

The chatbot (`/api/chat`) now:
1. Fetches all active FAQs from the database on each request
2. Includes FAQ content in the AI's system context
3. Uses FAQ data to provide accurate, consistent answers

This ensures the chatbot always has the latest FAQ information and provides answers consistent with the FAQ page.

## Managing FAQs

### Adding New FAQs
Use the POST endpoint or add them directly to the seed file for permanent additions.

### Updating FAQs
Use the PUT endpoint to modify existing FAQs. Changes will be reflected immediately in both the FAQ page and chatbot.

### Deactivating FAQs
Set `isActive: false` instead of deleting to preserve data while hiding from users.

## Notes

- FAQs are indexed for full-text search on question, answer, and keywords
- The seed endpoint clears all existing FAQs before inserting new ones
- Keywords help improve search relevance but are optional
- All timestamps are automatically managed by MongoDB
