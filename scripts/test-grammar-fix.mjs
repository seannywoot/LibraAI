// Test grammar improvements for title generation
import { heuristicTitle } from '../src/utils/chatTitle.js';

console.log('=== GRAMMAR FIX TESTS ===\n');

// Test the specific problematic case
const testCases = [
  {
    name: 'Books Available to Borrow',
    messages: [
      { role: 'assistant', content: 'Hello! How can I help?' },
      { role: 'user', content: 'What books are available to borrow?' },
      { role: 'assistant', content: 'Let me search...' }
    ]
  },
  {
    name: 'Available Books Query',
    messages: [
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'Which books available borrow?' },
      { role: 'assistant', content: 'Here are the books...' }
    ]
  },
  {
    name: 'Fiction Books Search',
    messages: [
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'Show me available fiction books to borrow' },
      { role: 'assistant', content: 'Sure!' }
    ]
  },
  {
    name: 'How To Guide',
    messages: [
      { role: 'assistant', content: 'Hi!' },
      { role: 'user', content: 'How to bake sourdough bread?' },
      { role: 'assistant', content: 'Here is a guide...' }
    ]
  },
  {
    name: 'Finding Books',
    messages: [
      { role: 'assistant', content: 'Hello!' },
      { role: 'user', content: 'Find science fiction books' },
      { role: 'assistant', content: 'Searching...' }
    ]
  }
];

testCases.forEach(test => {
  const title = heuristicTitle(test.messages);
  console.log(`${test.name}:`);
  console.log(`  Input: "${test.messages[1].content}"`);
  console.log(`  Title: "${title}"`);
  
  // Check for common grammar issues
  const hasGrammarIssue = /\bavailable\s+\w+$/i.test(title) && !/\b(to|for)\b/i.test(title);
  const startsWithQuestion = /^(what|which|how)/i.test(title);
  
  if (hasGrammarIssue) {
    console.log('  ⚠️  Warning: Missing preposition after "available"');
  }
  if (startsWithQuestion) {
    console.log('  ⚠️  Warning: Starts with question word');
  }
  if (!hasGrammarIssue && !startsWithQuestion) {
    console.log('  ✅ Grammar looks good');
  }
  console.log();
});

console.log('=== API TEST ===\n');

// Test with actual API
async function testAPI() {
  const testMessage = [
    { role: 'user', content: 'What books are available to borrow?' },
    { role: 'assistant', content: 'Let me search for available books...' }
  ];

  try {
    const response = await fetch('http://localhost:3000/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: testMessage })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('API Generated Title:', data.title);
      
      // Check grammar
      const hasIssue = /\bavailable\s+\w+$/i.test(data.title) && !/\b(to|for)\b/i.test(data.title);
      if (hasIssue) {
        console.log('❌ Grammar issue detected in API response');
      } else {
        console.log('✅ API title has good grammar');
      }
    } else {
      console.log('⚠️  API request failed:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Could not test API:', error.message);
  }
}

await testAPI();

console.log('\n=== DONE ===');
