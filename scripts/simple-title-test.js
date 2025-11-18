/**
 * Simple test to trigger title generation and see server logs
 */

async function test() {
  console.log('Testing title generation...\n');
  
  const response = await fetch('http://localhost:3000/api/chat/title', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: "user", content: "What books are available to borrow?" },
        { role: "assistant", content: "We have many fiction books!" }
      ]
    })
  });
  
  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

test().catch(console.error);
