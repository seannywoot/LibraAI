/**
 * Test script for title generation with Qwen model
 * Run with: node scripts/test-title-generation.js
 */

async function testTitleGeneration() {
  console.log('🧪 Testing Title Generation with Qwen Model\n');
  
  // Test cases with different conversation types
  const testCases = [
    {
      name: "Book Borrowing Query",
      messages: [
        { role: "user", content: "What books are available to borrow?" },
        { role: "assistant", content: "We have many books available! Here are some popular fiction titles you can borrow..." }
      ]
    },
    {
      name: "Python Programming Question",
      messages: [
        { role: "user", content: "How do I use list comprehensions in Python?" },
        { role: "assistant", content: "List comprehensions provide a concise way to create lists. Here's the syntax..." }
      ]
    },
    {
      name: "Recipe Request",
      messages: [
        { role: "user", content: "Can you help me bake sourdough bread?" },
        { role: "assistant", content: "I'd be happy to help! Here's a step-by-step guide for baking sourdough..." }
      ]
    },
    {
      name: "Travel Planning",
      messages: [
        { role: "user", content: "I'm planning a trip to Tokyo. What should I see?" },
        { role: "assistant", content: "Tokyo is amazing! Here are the must-visit places..." }
      ]
    }
  ];

  let passCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(`   Messages: ${testCase.messages.length}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat/title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: testCase.messages })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(`   ❌ FAILED: ${response.status} - ${errorData.error || 'Unknown error'}`);
        failCount++;
        continue;
      }

      const data = await response.json();
      
      if (data.useFallback || data.rateLimited) {
        console.log(`   ⚠️  Rate limited, used fallback`);
        console.log(`   Title: "${data.title || 'N/A'}"`);
        passCount++;
      } else if (data.title) {
        console.log(`   ✅ SUCCESS`);
        console.log(`   Title: "${data.title}"`);
        
        // Validate title quality
        const words = data.title.split(/\s+/);
        const wordCount = words.length;
        const hasProperLength = wordCount >= 3 && wordCount <= 8;
        const startsWithArticle = /^(the|a|an)\s/i.test(data.title);
        
        console.log(`   Word count: ${wordCount} ${hasProperLength ? '✓' : '✗ (should be 3-8)'}`);
        console.log(`   No leading article: ${!startsWithArticle ? '✓' : '✗ (should not start with the/a/an)'}`);
        
        passCount++;
      } else {
        console.log(`   ❌ FAILED: No title returned`);
        failCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passCount}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failCount}/${testCases.length}`);
  console.log(`   Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  
  if (passCount === testCases.length) {
    console.log('\n🎉 All tests passed! Title generation is working correctly.\n');
  } else if (passCount > 0) {
    console.log('\n⚠️  Some tests passed. Check the failures above.\n');
  } else {
    console.log('\n❌ All tests failed. Check your API configuration and server.\n');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] })
    });
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to server at http://localhost:3000');
    console.error('   Make sure your Next.js dev server is running with: npm run dev\n');
    return false;
  }
}

// Run the test
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testTitleGeneration();
  }
})();
