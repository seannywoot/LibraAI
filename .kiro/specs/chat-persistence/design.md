# Design Document: Chat Conversation Persistence

## Overview

This design implements database persistence for LibraAI chat conversations using MongoDB. The system will store conversations server-side, enabling cross-device access and preventing data loss. The implementation follows the existing LibraAI architecture patterns and integrates seamlessly with the current chat interface.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         ChatInterface Component                        │ │
│  │  - Manages UI state                                    │ │
│  │  - Handles user interactions                           │ │
│  │  - Syncs with API and localStorage                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ HTTP Requests                     │
│                          ▼                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  /api/chat/conversations                               │ │
│  │  - GET: Load all user conversations                    │ │
│  │  - POST: Save/update conversation                      │ │
│  │  - DELETE: Remove conversation                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ MongoDB Driver                    │
│                          ▼                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  conversations Collection                              │ │
│  │  - Stores all user conversations                       │ │
│  │  - Indexed by userId and conversationId                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Page Load**: Client fetches conversations from API → API queries MongoDB → Returns conversations → Client updates state and localStorage cache
2. **Message Sent**: Client updates UI → Debounced save to API → API updates MongoDB → Success response → Client updates localStorage cache
3. **Delete Conversation**: Client shows modal → User confirms → API call to delete → MongoDB removes document → Client updates state and localStorage

## Components and Interfaces

### 1. MongoDB Schema

**Collection Name**: `conversations`

**Document Structure**:
```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  userId: ObjectId,                 // Reference to users collection
  conversationId: Number,           // Client-generated timestamp ID
  title: String,                    // Auto-generated conversation title
  messages: [                       // Array of message objects
    {
      role: String,                 // "user" or "assistant"
      content: String,              // Message text content
      timestamp: String,            // Formatted time string
      hasFile: Boolean,             // Whether message has attachment
      fileName: String,             // Optional: attached file name
      fileType: String,             // Optional: MIME type
      filePreview: String,          // Optional: base64 image preview
      stopped: Boolean              // Optional: if response was stopped
    }
  ],
  createdAt: Date,                  // ISO timestamp of creation
  lastUpdated: Date,                // ISO timestamp of last update
}
```

**Indexes**:
- `userId`: For efficient user-specific queries
- `conversationId`: For unique conversation identification
- `lastUpdated`: For sorting by recency

### 2. API Endpoints

#### GET /api/chat/conversations

**Purpose**: Retrieve all conversations for the authenticated user

**Authentication**: Required (NextAuth session)

**Request**: None (user ID from session)

**Response**:
```javascript
{
  success: true,
  conversations: [
    {
      id: "conversation_id",
      title: "Conversation Title",
      messages: [...],
      lastUpdated: "2025-11-07T10:30:00.000Z"
    }
  ]
}
```

**Error Responses**:
- 401: User not authenticated
- 500: Database error

#### POST /api/chat/conversations

**Purpose**: Save or update a conversation

**Authentication**: Required (NextAuth session)

**Request Body**:
```javascript
{
  conversationId: 1699876543210,
  title: "Book recommendations for sci-fi",
  messages: [
    {
      role: "user",
      content: "Can you recommend sci-fi books?",
      timestamp: "10:30 AM",
      hasFile: false
    },
    {
      role: "assistant",
      content: "Here are some great sci-fi books...",
      timestamp: "10:30 AM"
    }
  ]
}
```

**Response**:
```javascript
{
  success: true,
  conversationId: 1699876543210,
  message: "Conversation saved successfully"
}
```

**Error Responses**:
- 400: Invalid request data
- 401: User not authenticated
- 500: Database error

#### DELETE /api/chat/conversations/[conversationId]

**Purpose**: Delete a specific conversation

**Authentication**: Required (NextAuth session)

**URL Parameter**: `conversationId` (number)

**Response**:
```javascript
{
  success: true,
  message: "Conversation deleted successfully"
}
```

**Error Responses**:
- 401: User not authenticated
- 403: Conversation doesn't belong to user
- 404: Conversation not found
- 500: Database error

### 3. Client-Side Integration

#### Modified ChatInterface Component

**New State Variables**:
```javascript
const [isSyncing, setIsSyncing] = useState(false);
const [syncError, setSyncError] = useState(null);
const [hasMigrated, setHasMigrated] = useState(false);
```

**New Functions**:

1. **loadConversationsFromDB()**: Fetches conversations from API on mount
2. **saveConversationToDB()**: Debounced function to save conversation to API
3. **deleteConversationFromDB()**: Calls delete API endpoint
4. **migrateLocalStorageConversations()**: One-time migration of localStorage data
5. **syncWithLocalStorage()**: Updates localStorage cache after successful API operations

**Modified Functions**:

1. **useEffect (on mount)**: Load from DB first, then check for migration
2. **useEffect (on messages change)**: Debounced save to DB (800ms delay)
3. **confirmDelete()**: Call API before updating state
4. **startNewConversation()**: Create in DB after first message

## Data Models

### Conversation Model

```typescript
interface Conversation {
  id: number;                    // Client-generated timestamp
  title: string;                 // Auto-generated title
  messages: Message[];           // Array of messages
  lastUpdated: string;           // ISO timestamp
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;             // Formatted time (e.g., "10:30 AM")
  hasFile?: boolean;
  fileName?: string;
  fileType?: string;
  filePreview?: string;          // Base64 for images
  stopped?: boolean;             // If response was stopped
}
```

### API Request/Response Models

```typescript
// Save Conversation Request
interface SaveConversationRequest {
  conversationId: number;
  title: string;
  messages: Message[];
}

// Load Conversations Response
interface LoadConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

// Delete Conversation Response
interface DeleteConversationResponse {
  success: boolean;
  message: string;
}

// Error Response
interface ErrorResponse {
  success: false;
  error: string;
}
```

## Error Handling

### API Error Handling

1. **Network Errors**: Retry with exponential backoff (3 attempts)
2. **Authentication Errors**: Redirect to login page
3. **Validation Errors**: Display error message to user
4. **Database Errors**: Log error, fall back to localStorage

### Client Error Handling

1. **Failed Save**: Show toast notification, keep data in localStorage
2. **Failed Load**: Fall back to localStorage data
3. **Failed Delete**: Show error modal, don't remove from UI
4. **Migration Errors**: Log errors, continue with remaining conversations

### Fallback Strategy

```
┌─────────────────────────────────────────────────────────┐
│  Primary: MongoDB Database                              │
│  - All operations attempt database first                │
└─────────────────────────────────────────────────────────┘
                        │
                        │ On Failure
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Fallback: localStorage                                 │
│  - Read/write to browser storage                        │
│  - Retry sync on next page load                         │
└─────────────────────────────────────────────────────────┘
```

## Testing Strategy

### Unit Tests

1. **API Routes**:
   - Test authentication checks
   - Test CRUD operations
   - Test error handling
   - Test data validation

2. **Client Functions**:
   - Test conversation loading
   - Test conversation saving
   - Test conversation deletion
   - Test migration logic
   - Test localStorage sync

### Integration Tests

1. **End-to-End Flow**:
   - Create conversation → Save to DB → Reload page → Verify persistence
   - Delete conversation → Verify removal from DB and UI
   - Migrate localStorage → Verify all conversations in DB

2. **Error Scenarios**:
   - Network failure during save
   - Database unavailable
   - Invalid session token
   - Concurrent modifications

### Manual Testing

1. **Cross-Device Sync**:
   - Create conversation on Device A
   - Verify appears on Device B
   - Delete on Device B
   - Verify removed on Device A

2. **Migration**:
   - Create conversations in localStorage
   - Clear database
   - Reload page
   - Verify migration completes

3. **Performance**:
   - Test with 20+ conversations
   - Verify load time < 2 seconds
   - Verify save debouncing works

## Security Considerations

### Authentication

- All API endpoints require valid NextAuth session
- User ID extracted from session, not from request body
- Conversations scoped to authenticated user only

### Authorization

- Users can only access their own conversations
- Delete operations verify ownership before execution
- No admin override for conversation access

### Data Validation

- Validate conversationId is a number
- Validate title is a non-empty string (max 200 chars)
- Validate messages array structure
- Sanitize user input to prevent XSS

### Rate Limiting

- Implement rate limiting on save endpoint (max 10 saves/minute)
- Debounce client-side saves to reduce API calls
- Prevent spam deletion attempts

## Performance Optimizations

### Database Optimizations

1. **Indexes**: Create compound index on (userId, lastUpdated) for efficient queries
2. **Projection**: Only fetch necessary fields in list view
3. **Limit**: Cap conversations at 20 most recent
4. **Connection Pooling**: Reuse MongoDB connections

### Client Optimizations

1. **Debouncing**: 800ms delay before saving to reduce API calls
2. **Caching**: Keep localStorage as fast-access cache
3. **Lazy Loading**: Load conversation details on demand
4. **Optimistic Updates**: Update UI immediately, sync in background

### Network Optimizations

1. **Compression**: Enable gzip compression for API responses
2. **Batch Operations**: Consider batching multiple saves
3. **Conditional Requests**: Use ETags for cache validation

## Migration Strategy

### Phase 1: Initial Implementation

1. Create MongoDB schema and indexes
2. Implement API endpoints
3. Add database operations to client
4. Keep localStorage as fallback

### Phase 2: Migration

1. Detect existing localStorage conversations on first load
2. Batch upload to database
3. Mark migration complete in localStorage
4. Keep localStorage data as backup

### Phase 3: Monitoring

1. Log migration success/failure rates
2. Monitor API performance metrics
3. Track localStorage fallback usage
4. Gather user feedback

### Rollback Plan

If issues arise:
1. Disable database sync via feature flag
2. Fall back to localStorage-only mode
3. Fix issues in staging environment
4. Re-enable with gradual rollout

## Future Enhancements

1. **Real-time Sync**: Use WebSockets for instant cross-device updates
2. **Conversation Sharing**: Allow users to share conversations with others
3. **Export Feature**: Export conversations as PDF or text
4. **Search**: Full-text search across all conversations
5. **Analytics**: Track conversation topics and user engagement
6. **Archiving**: Archive old conversations instead of deleting
7. **Conversation Folders**: Organize conversations into categories
