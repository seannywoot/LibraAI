// Simple test for title API
async function testTitleAPI() {
  const testMessages = [
    { role: 'user', content: 'What books are available to borrow?' },
    { role: 'assistant', content: 'Let me search for available books...' },
    { role: 'user', content: 'Show me fiction books' }
  ];

  console.log('Testing title API...\n');
  console.log('Messages:', JSON.stringify(testMessages, null, 2));
  
  try {
    const response = await fetch('http://localhost:3000/api/chat/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: testMessages })
    });

    console.log('\nResponse status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Success! Generated title:', data.title);
    } else {
      console.log('\n❌ Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
}

testTitleAPI();
