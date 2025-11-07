# Client-Side Integration Tests for Chat Persistence

This directory contains integration tests for the chat persistence feature, which enables database-backed conversation storage with localStorage fallback.

## Test Files

### `chat-interface.test.jsx`
Comprehensive integration tests for the ChatInterface component covering:
- Conversation loading from database
- Conversation saving with debouncing
- Conversation deletion flow
- localStorage migration logic
- Error handling and fallback mechanisms

## Test Coverage

### 1. Conversation Loading from Database (Requirements 5.1, 5.5, 5.6, 5.7)

Tests that verify:
- ✅ Conversations load from database on component mount
- ✅ localStorage cache updates after successful load
- ✅ Fallback to localStorage when database load fails
- ✅ Graceful handling of 401 authentication errors
- ✅ Error notifications display on load failures

### 2. Conversation Saving with Debouncing (Requirements 5.2, 5.5, 5.6, 5.7)

Tests that verify:
- ✅ Conversations save to database after user messages
- ✅ Save operations are debounced (800ms delay)
- ✅ Multiple rapid messages trigger single save
- ✅ localStorage cache updates after successful save
- ✅ Fallback to localStorage when save fails
- ✅ Failed saves added to retry queue

### 3. Conversation Deletion Flow (Requirements 5.3, 5.5, 5.6, 5.7)

Tests that verify:
- ✅ DELETE API endpoint called when deleting conversation
- ✅ UI updates after successful deletion
- ✅ Graceful handling of 404 errors (conversation not found)
- ✅ Failed deletions added to retry queue
- ✅ Error notifications display on deletion failures

### 4. localStorage Migration Logic (Requirements 6.1, 6.2, 6.3, 6.4, 6.5)

Tests that verify:
- ✅ Existing localStorage conversations detected on first load
- ✅ Conversations batch uploaded to database
- ✅ Migration marked complete after successful upload
- ✅ Migration skipped if already completed
- ✅ Migration errors handled gracefully
- ✅ Migration progress notifications displayed
- ✅ localStorage data kept as backup after migration

### 5. Error Handling and Fallback (Requirements 5.5, 5.6, 5.7, 6.5)

Tests that verify:
- ✅ Fallback to localStorage when database unavailable
- ✅ Error notifications display for sync failures
- ✅ Retry queue processes failed operations
- ✅ Exponential backoff for retries (5s, 15s, 45s)
- ✅ localStorage maintained as backup cache
- ✅ Authentication errors don't break UI
- ✅ Network errors handled gracefully

## Running the Tests

### Automated Tests

The project uses a manual testing approach with automated helper scripts:

```bash
# Run the chat persistence test suite
npm run test-chat-persistence
```

This will:
1. Display a comprehensive manual testing checklist
2. Run automated unit tests for core logic (debouncing, retry queue, etc.)
3. Provide step-by-step testing scenarios

### Manual Browser Testing

1. **Setup:**
   ```bash
   # Initialize the database
   npm run init-conversations
   
   # Start the development server
   npm run dev
   ```

2. **Open the chat page:**
   ```
   http://localhost:3000/student/chat
   ```

3. **Open Browser DevTools:**
   - Console tab: Check for errors
   - Network tab: Monitor API calls
   - Application tab: Inspect localStorage

4. **Follow the test scenarios** provided by the test script

### API Tests

Run the API endpoint tests separately:

```bash
npm run test-conversations-api
```

## Test Scenarios

### Scenario 1: New User (No History)
1. Clear localStorage and database
2. Load chat page
3. Send a message
4. Verify conversation saved to database
5. Reload page and verify conversation persists

### Scenario 2: Existing User (With History)
1. Create multiple conversations
2. Reload page
3. Verify all conversations load
4. Delete a conversation
5. Verify deletion persists

### Scenario 3: Migration from localStorage
1. Add conversations to localStorage manually
2. Remove `chatMigrationComplete` flag
3. Reload page
4. Verify migration notification appears
5. Verify conversations uploaded to database

### Scenario 4: Network Error Handling
1. Enable network throttling in DevTools
2. Send a message
3. Verify error notification appears
4. Verify message saved to localStorage
5. Disable throttling
6. Verify retry mechanism works

### Scenario 5: Cross-Device Sync
1. Open chat in two browser windows
2. Create conversation in Window 1
3. Reload Window 2
4. Verify conversation appears
5. Delete in Window 2
6. Reload Window 1
7. Verify deletion synced

## Test Data

### Mock Conversations
```javascript
{
  id: 1699876543210,
  title: 'Book recommendations for sci-fi',
  messages: [
    {
      role: 'user',
      content: 'Can you recommend sci-fi books?',
      timestamp: '10:30 AM',
      hasFile: false
    },
    {
      role: 'assistant',
      content: 'Here are some great sci-fi books...',
      timestamp: '10:30 AM'
    }
  ],
  lastUpdated: '2025-11-07T10:30:00.000Z'
}
```

## Verification Checklist

### Database Verification
- [ ] `conversations` collection exists
- [ ] Indexes created on `userId` and `conversationId`
- [ ] Conversations have correct structure
- [ ] `userId` matches authenticated user
- [ ] `conversationId` is unique
- [ ] Messages array properly formatted

### localStorage Verification
- [ ] `chatHistory` key contains conversations array
- [ ] `currentChat` key contains active conversation
- [ ] `chatMigrationComplete` flag set after migration
- [ ] Cache updates after successful API operations

### Network Verification
- [ ] GET `/api/chat/conversations` called on mount
- [ ] POST `/api/chat/conversations` called after messages
- [ ] DELETE `/api/chat/conversations/:id` called on deletion
- [ ] Debouncing reduces API call frequency
- [ ] Retry mechanism attempts failed operations

## Performance Benchmarks

- **Initial Load:** < 2 seconds
- **Save Debounce:** 800ms delay
- **Retry Delays:** 5s, 15s, 45s (exponential backoff)
- **Max Conversations:** 20 displayed
- **Max Retries:** 3 attempts per operation

## Known Limitations

1. **Testing Framework:** The project doesn't have Jest/React Testing Library configured, so tests are provided as reference implementations
2. **Manual Testing Required:** Most integration tests require manual browser testing
3. **Cross-Device Testing:** Requires multiple browser windows or devices

## Future Improvements

1. Set up Jest and React Testing Library for automated testing
2. Add E2E tests with Playwright or Cypress
3. Implement visual regression testing
4. Add performance monitoring tests
5. Create automated cross-device sync tests

## Related Documentation

- [Requirements Document](../../.kiro/specs/chat-persistence/requirements.md)
- [Design Document](../../.kiro/specs/chat-persistence/design.md)
- [Implementation Tasks](../../.kiro/specs/chat-persistence/tasks.md)
- [API Tests](../api/README.md)

## Support

For issues or questions about the tests:
1. Check the test output for specific error messages
2. Review the requirements and design documents
3. Verify database connection and authentication
4. Check browser console for client-side errors
