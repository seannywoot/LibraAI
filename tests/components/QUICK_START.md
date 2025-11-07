# Quick Start Guide - Chat Persistence Tests

## 🚀 Run Tests in 3 Steps

### Step 1: Initialize Database
```bash
npm run init-conversations
```

### Step 2: Run Test Suite
```bash
npm run test-chat-persistence
```

### Step 3: Manual Browser Testing
```bash
npm run dev
```
Then open: http://localhost:3000/student/chat

---

## 📊 What Gets Tested

### ✅ Automated Tests (5 tests)
- localStorage operations
- Debounce logic (800ms)
- Retry queue with exponential backoff
- Data structure validation
- Migration detection logic

**Result:** All 5 tests pass ✅

### 📝 Manual Tests (62 items)
Follow the checklist displayed by the test script:
- Conversation loading (10 items)
- Conversation saving (10 items)
- Conversation deletion (10 items)
- localStorage migration (10 items)
- Error handling (10 items)
- Cross-device sync (6 items)
- Performance (6 items)

---

## 🧪 Test Scenarios

### Scenario 1: New User
```
1. Clear localStorage: localStorage.clear()
2. Send a message in chat
3. Reload page
4. ✅ Conversation should persist
```

### Scenario 2: Existing User
```
1. Create 3-5 conversations
2. Reload page
3. ✅ All conversations should load
4. Delete one conversation
5. ✅ Deletion should persist
```

### Scenario 3: Migration
```
1. Add conversations to localStorage manually
2. Remove migration flag: localStorage.removeItem('chatMigrationComplete')
3. Reload page
4. ✅ Migration notification should appear
5. ✅ Conversations should upload to database
```

### Scenario 4: Network Errors
```
1. Open DevTools → Network tab
2. Enable "Offline" or "Slow 3G"
3. Send a message
4. ✅ Error notification should appear
5. ✅ Message saved to localStorage
6. Disable throttling
7. ✅ Retry should succeed
```

### Scenario 5: Cross-Device Sync
```
1. Open chat in two browser windows
2. Create conversation in Window 1
3. Reload Window 2
4. ✅ Conversation should appear
5. Delete in Window 2
6. Reload Window 1
7. ✅ Deletion should sync
```

---

## 🔍 Verification Checklist

### Browser DevTools
- **Console:** No errors
- **Network:** API calls to `/api/chat/conversations`
- **Application → localStorage:**
  - `chatHistory` (conversations array)
  - `currentChat` (active conversation)
  - `chatMigrationComplete` (migration flag)

### Database (MongoDB)
```javascript
// Check conversations collection
db.conversations.find({ userId: ObjectId("...") })

// Verify indexes
db.conversations.getIndexes()
```

### Expected API Calls
- `GET /api/chat/conversations` - Load on mount
- `POST /api/chat/conversations` - Save after messages (debounced)
- `DELETE /api/chat/conversations/:id` - Delete conversation

---

## ⚡ Performance Benchmarks

| Operation | Expected Time |
|-----------|--------------|
| Initial Load | < 2 seconds |
| Save Debounce | 800ms delay |
| Retry Delays | 5s, 15s, 45s |
| Max Conversations | 20 displayed |
| Max Retries | 3 attempts |

---

## 🐛 Troubleshooting

### Tests Fail
```bash
# Check database connection
npm run init-conversations

# Verify API endpoints
npm run test-conversations-api
```

### Migration Not Working
```bash
# Clear migration flag
localStorage.removeItem('chatMigrationComplete')

# Reload page
```

### Conversations Not Saving
1. Check authentication (logged in?)
2. Check network tab for errors
3. Check console for error messages
4. Verify database connection

---

## 📚 Documentation

- **Full Documentation:** `tests/components/README.md`
- **Test Summary:** `tests/components/TESTING_SUMMARY.md`
- **Test Implementation:** `tests/components/chat-interface.test.jsx`
- **Requirements:** `.kiro/specs/chat-persistence/requirements.md`
- **Design:** `.kiro/specs/chat-persistence/design.md`

---

## ✅ Success Criteria

Your implementation passes if:
- ✅ All 5 automated tests pass
- ✅ Conversations load from database on mount
- ✅ Conversations save after messages (with debouncing)
- ✅ Conversations delete successfully
- ✅ Migration works for existing localStorage data
- ✅ Error handling falls back to localStorage
- ✅ No console errors during normal operation

---

## 🎯 Next Steps

After testing:
1. ✅ Mark task 9 as complete in `tasks.md`
2. 📝 Document any issues found
3. 🔧 Fix any failing tests
4. 🚀 Deploy to production

---

**Need Help?** Check the full documentation in `tests/components/README.md`
