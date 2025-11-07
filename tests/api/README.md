# API Tests

This directory contains API endpoint tests for the LibraAI application.

## Available Tests

### Chat Conversations API Tests

**File:** `conversations.test.js`

Tests the chat persistence API endpoints:
- `GET /api/chat/conversations` - Load user conversations
- `POST /api/chat/conversations` - Save/update conversations
- `DELETE /api/chat/conversations/[conversationId]` - Delete conversations

**Requirements Coverage:**
- Requirements 2.1-2.8: Save Conversation API
- Requirements 3.1-3.7: Load Conversations API
- Requirements 4.1-4.8: Delete Conversation API

**Run with:**
```bash
npm run test-conversations-api
```

Or directly:
```bash
node tests/api/conversations.test.js
```

**Test Coverage:**
- ✅ Authentication checks (401 responses)
- ✅ Request validation (400 responses)
- ⚠️ Authenticated operations (require valid session)

**Note:** Tests that require authentication will be skipped when run without a valid session. These tests verify:
- Authentication is properly enforced (returns 401 when not authenticated)
- Request validation works correctly (returns 400 for invalid data)

For full end-to-end testing of authenticated operations, use the database test script:
```bash
node scripts/test-conversations-api.js
```

### Book Recommendations API Tests

**File:** `recommendations.test.js`

Tests the smart book recommendation system endpoints.

**Run with:**
```bash
npm run test-recommendations
```

## Running Tests

### Prerequisites

1. **Server must be running** on `http://localhost:3000`
   ```bash
   npm run dev
   ```

2. **Database must be configured** with proper connection string in `.env.local`

### Running All Tests

Currently, tests must be run individually:

```bash
# Test conversations API
npm run test-conversations-api

# Test recommendations API
npm run test-recommendations
```

## Test Structure

Each test file follows this pattern:

1. **Setup**: Define test data and configuration
2. **Test Runner**: Execute tests and track results
3. **Test Cases**: Individual test functions for each requirement
4. **Summary**: Display results and coverage

## Authentication Testing

Most API endpoints require authentication. The tests handle this in two ways:

1. **Unauthenticated Tests**: Verify that endpoints properly reject requests without authentication (401 responses)
2. **Authenticated Tests**: Skipped when no valid session is available

To test authenticated endpoints:

### Option 1: Use Database Test Scripts
These scripts test the database logic directly without HTTP:
```bash
node scripts/test-conversations-api.js
```

### Option 2: Manual Testing
1. Start the development server: `npm run dev`
2. Log in through the browser
3. Use browser developer tools to test API endpoints
4. Copy session cookies for automated testing

### Option 3: Set Up Test Authentication
Create a test authentication mechanism:
1. Generate a test session token
2. Include it in test requests
3. Modify test files to use the token

## Adding New Tests

To add new API tests:

1. Create a new test file in `tests/api/`
2. Follow the existing pattern:
   ```javascript
   async function runTests() {
     // Test setup
     let passedTests = 0;
     let failedTests = 0;
     
     async function runTest(name, testFn) {
       try {
         await testFn();
         console.log(`✅ ${name}`);
         passedTests++;
       } catch (error) {
         console.log(`❌ ${name}`);
         console.log(`   Error: ${error.message}`);
         failedTests++;
       }
     }
     
     // Add test cases
     await runTest('Test name', async () => {
       // Test logic
     });
     
     // Summary
     console.log(`Passed: ${passedTests}, Failed: ${failedTests}`);
   }
   
   runTests();
   ```

3. Add a script to `package.json`:
   ```json
   "test-your-feature": "node tests/api/your-feature.test.js"
   ```

## Test Best Practices

1. **Test one thing at a time**: Each test should verify a single behavior
2. **Use descriptive names**: Test names should clearly describe what they test
3. **Include requirement references**: Link tests to specific requirements
4. **Handle errors gracefully**: Catch and report errors clearly
5. **Clean up after tests**: Remove test data when done
6. **Document assumptions**: Note any prerequisites or setup needed

## Troubleshooting

### Tests fail with connection errors
- Ensure the server is running on `http://localhost:3000`
- Check that the database is accessible
- Verify `.env.local` has correct configuration

### All tests are skipped
- This is normal when testing without authentication
- The tests verify that authentication is properly enforced
- Use database test scripts for full coverage

### Tests timeout
- Increase timeout values if needed
- Check server logs for errors
- Verify database connection is stable

## Future Improvements

- [ ] Add test authentication mechanism
- [ ] Create integration test suite
- [ ] Add performance benchmarks
- [ ] Implement test coverage reporting
- [ ] Add CI/CD integration
- [ ] Create mock data generators
