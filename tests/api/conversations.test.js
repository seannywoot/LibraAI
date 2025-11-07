/**
 * API Tests for Chat Conversations Persistence
 * 
 * Tests for:
 * - GET /api/chat/conversations
 * - POST /api/chat/conversations
 * - DELETE /api/chat/conversations/[conversationId]
 * 
 * Requirements: 2.1-2.8, 3.1-3.7, 4.1-4.8
 * 
 * Run with: node tests/api/conversations.test.js
 * Note: Server must be running on localhost:3000
 */

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Mock conversation data
const mockConversation = {
  conversationId: Date.now(),
  title: 'Book recommendations for sci-fi',
  messages: [
    {
      role: 'user',
      content: 'Can you recommend some sci-fi books?',
      timestamp: '10:30 AM',
      hasFile: false
    },
    {
      role: 'assistant',
      content: 'Here are some great sci-fi books from our library...',
      timestamp: '10:30 AM'
    }
  ]
};

const mockConversationWithFile = {
  conversationId: Date.now() + 1,
  title: 'Help with book cover',
  messages: [
    {
      role: 'user',
      content: 'Can you identify this book?',
      timestamp: '11:00 AM',
      hasFile: true,
      fileName: 'book-cover.jpg',
      fileType: 'image/jpeg',
      filePreview: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...'
    },
    {
      role: 'assistant',
      content: 'This appears to be "Dune" by Frank Herbert.',
      timestamp: '11:01 AM'
    }
  ]
};

// Test runner
async function runTests() {
  console.log('🧪 API Tests for Chat Conversations Persistence\n');
  console.log('⚠️  Note: These tests require a running server');
  console.log('   Server should be running on:', BASE_URL);
  console.log('   Tests marked with ⚠️  require authentication and will be skipped if not authenticated\n');

  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  // Helper function to run a test
  async function runTest(name, testFn) {
    try {
      await testFn();
      console.log(`✅ ${name}`);
      passedTests++;
    } catch (error) {
      if (error.message === 'SKIP') {
        console.log(`⏭️  ${name} (skipped - requires auth)`);
        skippedTests++;
      } else {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        failedTests++;
      }
    }
  }

  // Helper to skip tests that require auth
  function skipIfNoAuth(response) {
    if (response.status === 401) {
      throw new Error('SKIP');
    }
  }

  console.log('📋 POST /api/chat/conversations Tests\n');
  console.log('Testing Requirements: 2.1-2.8 (Save Conversation API)\n');

  // Test: Requirement 2.2, 2.7 - Authentication required
  await runTest('Requirement 2.7: Should return 401 without authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(mockConversation)
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
    const data = await response.json();
    if (data.success !== false) {
      throw new Error('Expected success to be false');
    }
    if (!data.error.includes('Unauthorized')) {
      throw new Error('Expected error message to contain "Unauthorized"');
    }
  });

  // Test: Requirement 2.3, 2.8 - Missing conversationId
  await runTest('Requirement 2.8: Should return 400 for missing conversationId', async () => {
    const invalidData = {
      title: 'Test conversation',
      messages: mockConversation.messages
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('conversationId')) {
      throw new Error('Expected error message to mention conversationId');
    }
  });

  // Test: Requirement 2.8 - Invalid conversationId type
  await runTest('Requirement 2.8: Should return 400 for invalid conversationId type', async () => {
    const invalidData = {
      conversationId: 'not-a-number',
      title: 'Test conversation',
      messages: mockConversation.messages
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('conversationId must be a number')) {
      throw new Error('Expected specific error message about conversationId type');
    }
  });

  // Test: Requirement 2.8 - Missing title
  await runTest('Requirement 2.8: Should return 400 for missing title', async () => {
    const invalidData = {
      conversationId: Date.now(),
      messages: mockConversation.messages
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('title')) {
      throw new Error('Expected error message to mention title');
    }
  });

  // Test: Requirement 2.8 - Empty title
  await runTest('Requirement 2.8: Should return 400 for empty title', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: '   ',
      messages: mockConversation.messages
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('non-empty string')) {
      throw new Error('Expected error about non-empty string');
    }
  });

  // Test: Requirement 2.8 - Title too long
  await runTest('Requirement 2.8: Should return 400 for title exceeding 200 characters', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: 'a'.repeat(201),
      messages: mockConversation.messages
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('200 characters')) {
      throw new Error('Expected error about character limit');
    }
  });

  // Test: Requirement 2.8 - Missing messages
  await runTest('Requirement 2.8: Should return 400 for missing messages', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: 'Test conversation'
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('messages')) {
      throw new Error('Expected error message to mention messages');
    }
  });

  // Test: Requirement 2.8 - Empty messages array
  await runTest('Requirement 2.8: Should return 400 for empty messages array', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: 'Test conversation',
      messages: []
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('non-empty array')) {
      throw new Error('Expected error about non-empty array');
    }
  });

  // Test: Requirement 2.8 - Invalid message role
  await runTest('Requirement 2.8: Should return 400 for message with invalid role', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: 'Test conversation',
      messages: [
        {
          role: 'invalid-role',
          content: 'Test message',
          timestamp: '10:30 AM'
        }
      ]
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('valid role')) {
      throw new Error('Expected error about valid role');
    }
  });

  // Test: Requirement 2.8 - Message without content
  await runTest('Requirement 2.8: Should return 400 for message without content', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: 'Test conversation',
      messages: [
        {
          role: 'user',
          timestamp: '10:30 AM'
        }
      ]
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('content')) {
      throw new Error('Expected error message to mention content');
    }
  });

  // Test: Requirement 2.8 - Message without timestamp
  await runTest('Requirement 2.8: Should return 400 for message without timestamp', async () => {
    const invalidData = {
      conversationId: Date.now(),
      title: 'Test conversation',
      messages: [
        {
          role: 'user',
          content: 'Test message'
        }
      ]
    };

    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(invalidData)
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('timestamp')) {
      throw new Error('Expected error message to mention timestamp');
    }
  });

  // Test: Requirement 2.8 - Malformed JSON
  await runTest('Requirement 2.8: Should return 400 for malformed JSON', async () => {
    const response = await fetch(`${BASE_URL}/api/chat/conversations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'invalid json {'
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('malformed JSON')) {
      throw new Error('Expected error about malformed JSON');
    }
  });

  console.log('\n📋 GET /api/chat/conversations Tests\n');
  console.log('Testing Requirements: 3.1-3.7 (Load Conversations API)\n');

  // Test: Requirement 3.2, 3.7 - Authentication required
  await runTest('Requirement 3.7: Should return 401 without authentication', async () => {
    const response = await fetch(`${BASE_URL}/api/chat/conversations`);

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
    const data = await response.json();
    if (data.success !== false) {
      throw new Error('Expected success to be false');
    }
    if (!data.error.includes('Unauthorized')) {
      throw new Error('Expected error message to contain "Unauthorized"');
    }
  });

  console.log('\n📋 DELETE /api/chat/conversations/[conversationId] Tests\n');
  console.log('Testing Requirements: 4.1-4.8 (Delete Conversation API)\n');

  // Test: Requirement 4.2, 4.6 - Authentication required
  await runTest('Requirement 4.6: Should return 401 without authentication', async () => {
    const conversationId = Date.now();
    const response = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}`, {
      method: 'DELETE'
    });

    if (response.status !== 401) {
      throw new Error(`Expected 401, got ${response.status}`);
    }
    const data = await response.json();
    if (data.success !== false) {
      throw new Error('Expected success to be false');
    }
    if (!data.error.includes('Unauthorized')) {
      throw new Error('Expected error message to contain "Unauthorized"');
    }
  });

  // Test: Invalid conversationId
  await runTest('Should return 400 for invalid conversationId', async () => {
    const response = await fetch(`${BASE_URL}/api/chat/conversations/invalid-id`, {
      method: 'DELETE'
    });

    skipIfNoAuth(response);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
    const data = await response.json();
    if (!data.error.includes('Invalid conversation ID')) {
      throw new Error('Expected error about invalid conversation ID');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Summary');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⏭️  Skipped: ${skippedTests} (require authentication)`);
  console.log(`📝 Total: ${passedTests + failedTests + skippedTests}`);
  console.log('='.repeat(70));

  console.log('\n📋 Test Coverage Summary:');
  console.log('   ✓ POST /api/chat/conversations - Authentication (Req 2.2, 2.7)');
  console.log('   ✓ POST /api/chat/conversations - Request validation (Req 2.3, 2.8)');
  console.log('   ✓ GET /api/chat/conversations - Authentication (Req 3.2, 3.7)');
  console.log('   ✓ DELETE /api/chat/conversations/[id] - Authentication (Req 4.2, 4.6)');
  console.log('   ⚠️  Authenticated operations require manual testing with valid session');

  if (failedTests > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All executable tests passed!');
    console.log('\n💡 Note: Tests requiring authentication were skipped.');
    console.log('   To test authenticated endpoints:');
    console.log('   1. Use the existing test-conversations-api.js script for database tests');
    console.log('   2. Or manually test with a browser session and developer tools');
    console.log('   3. Or set up a test authentication mechanism');
    process.exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
