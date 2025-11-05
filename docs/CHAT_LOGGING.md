# Chat Logging System

## Overview

All chat conversations with LibraAI Assistant are now automatically logged to MongoDB for monitoring, analytics, and quality assurance purposes.

## What Gets Logged

Each chat interaction stores:

- **User Information**: Email, name (from session)
- **Conversation ID**: Links messages in the same conversation
- **User Message**: The question or input from the user
- **AI Response**: The assistant's reply
- **Timestamp**: When the interaction occurred
- **Model**: Which AI model was used (gemini-2.5-flash)
- **Message Count**: Position in the conversation

## Database Schema

Collection: `chat_logs`

```javascript
{
  userId: String,           // User's email
  userName: String,          // User's display name
  conversationId: Number,    // Links messages in same conversation
  userMessage: String,       // User's input
  aiResponse: String,        // AI's response
  timestamp: Date,           // When the message was sent
  model: String,             // AI model used
  messageCount: Number       // Position in conversation
}
```

## Viewing Chat Logs

### Admin Dashboard

Admins can view all chat logs at: `/admin/chat-logs`

Features:

- View all conversations across all users
- Search by user email
- Paginated results (20 per page)
- Expand/collapse long messages
- See conversation context with IDs
- Timestamps for each interaction

### API Access

**GET /api/chat/logs**

Query Parameters:

- `userId` - Filter by specific user email (admin only)
- `conversationId` - Filter by conversation ID
- `limit` - Number of results per page (default: 50)
- `skip` - Number of results to skip for pagination

**Response:**

```json
{
  "success": true,
  "logs": [...],
  "total": 150,
  "page": 1,
  "totalPages": 8
}
```

**Authorization:**

- Regular users can only see their own logs
- Admins can see all logs and filter by user

## Privacy & Security

- Logs are stored securely in MongoDB
- Only authenticated users can access logs
- Users can only view their own conversation history
- Admins have full access for monitoring and support
- No sensitive information should be shared in chats

## Use Cases

1. **Quality Assurance**: Review AI responses for accuracy
2. **User Support**: Help users by reviewing their conversation history
3. **Analytics**: Understand common questions and improve FAQs
4. **Training**: Identify areas where the AI needs improvement
5. **Compliance**: Maintain records of interactions

## Future Enhancements

- Export logs to CSV/JSON
- Analytics dashboard with charts
- Sentiment analysis
- Response time tracking
- User satisfaction ratings
- Automated quality scoring
- Search within conversation content
- Delete/archive old logs
