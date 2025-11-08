// Diagnostic script for title API issues
import { readFileSync } from 'fs';

console.log('🔍 Title API Diagnostics\n');
console.log('='.repeat(50));

// Check 1: Environment variables
console.log('\n1. Checking environment variables...');
try {
  const envFile = readFileSync('.env.local', 'utf8');
  const hasMongoUri = envFile.includes('MONGODB_URI=');
  const hasGeminiKey = envFile.includes('GEMINI_API_KEY=');
  
  console.log(`   MONGODB_URI: ${hasMongoUri ? '✅ Found' : '❌ Missing'}`);
  console.log(`   GEMINI_API_KEY: ${hasGeminiKey ? '✅ Found' : '❌ Missing'}`);
  
  if (!hasGeminiKey) {
    console.log('\n   ⚠️  GEMINI_API_KEY is required for title generation!');
    console.log('   Add it to .env.local: GEMINI_API_KEY=your_key_here');
  }
} catch (error) {
  console.log('   ❌ Could not read .env.local:', error.message);
}

// Check 2: Test API endpoint
console.log('\n2. Testing API endpoint...');
const testMessages = [
  { role: 'user', content: 'What books are available to borrow?' },
  { role: 'assistant', content: 'Let me search for available books...' }
];

try {
  const response = await fetch('http://localhost:3000/api/chat/title', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: testMessages })
  });

  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  const data = await response.json();
  
  if (response.ok) {
    console.log(`   ✅ Success! Title: "${data.title}"`);
  } else {
    console.log(`   ❌ Error: ${data.error}`);
    if (data.details) {
      console.log(`   Details: ${data.details}`);
    }
  }
} catch (error) {
  console.log(`   ❌ Request failed: ${error.message}`);
  console.log('   Make sure the dev server is running: npm run dev');
}

// Check 3: Test with problematic title
console.log('\n3. Testing with problematic title...');
const problematicMessages = [
  { role: 'user', content: 'What books aer available to borrow?' },
  { role: 'assistant', content: 'Here are the available books...' }
];

try {
  const response = await fetch('http://localhost:3000/api/chat/title', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages: problematicMessages })
  });

  console.log(`   Status: ${response.status} ${response.statusText}`);
  
  const data = await response.json();
  
  if (response.ok) {
    console.log(`   ✅ Generated title: "${data.title}"`);
    
    // Check if it fixed the typo
    if (data.title.toLowerCase().includes('aer')) {
      console.log('   ⚠️  Warning: Title still contains typo "aer"');
    } else {
      console.log('   ✅ Typo was corrected!');
    }
  } else {
    console.log(`   ❌ Error: ${data.error}`);
  }
} catch (error) {
  console.log(`   ❌ Request failed: ${error.message}`);
}

// Check 4: Test validation logic
console.log('\n4. Testing validation patterns...');
const testTitles = [
  'What Books Aer Available Borrow',
  'Available Books To',
  'Help With',
  'Available Books To Borrow',
  'Python Programming Guide'
];

const typoPattern = /\b(aer|teh|hte|taht|waht|whta|availble|availabe)\b/i;
const incompletePattern = /\b(to|for|with|about|from)\s*$/i;

testTitles.forEach(title => {
  const hasTypo = typoPattern.test(title);
  const hasIncomplete = incompletePattern.test(title);
  const needsRetry = hasTypo || hasIncomplete;
  
  console.log(`\n   "${title}"`);
  console.log(`   - Has typo: ${hasTypo ? '❌ Yes' : '✅ No'}`);
  console.log(`   - Incomplete: ${hasIncomplete ? '❌ Yes' : '✅ No'}`);
  console.log(`   - Would retry: ${needsRetry ? '🔄 Yes' : '✅ No'}`);
});

console.log('\n' + '='.repeat(50));
console.log('\n✅ Diagnostics complete!');
console.log('\nCommon issues:');
console.log('- 500 error: Check GEMINI_API_KEY in .env.local');
console.log('- Connection refused: Make sure dev server is running');
console.log('- Rate limit: Wait a few seconds between requests');
console.log('- Invalid API key: Verify your Gemini API key is correct');
