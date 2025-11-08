// Test the title generation API
const testMessages = [
  { role: 'assistant', content: 'Hi, how can I help?' },
  { role: 'user', content: 'How do I bake sourdough bread at home?' },
  { role: 'assistant', content: 'Here is a recipe for sourdough bread...' },
  { role: 'user', content: 'Any tips for starter feeding?' },
];

async function testTitleAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: testMessages })
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('Generated title:', data.title);
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testTitleAPI();
