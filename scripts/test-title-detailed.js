/**
 * Detailed diagnostic test for title generation
 */

async function testWithDetails() {
  console.log('🔍 Detailed Title Generation Test\n');
  
  const testMessage = [
    { role: "user", content: "What books are available to borrow?" },
    { role: "assistant", content: "We have many fiction books available including Harry Potter, The Hobbit, and more!" }
  ];

  console.log('📤 Sending request to: http://localhost:3000/api/chat/title');
  console.log('📝 Test messages:', JSON.stringify(testMessage, null, 2));
  
  try {
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/chat/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: testMessage })
    });
    const endTime = Date.now();
    
    console.log(`\n⏱️  Response time: ${endTime - startTime}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('\n📦 Response data:', JSON.stringify(data, null, 2));
    
    if (data.title) {
      console.log('\n✅ Title generated successfully!');
      console.log(`   Title: "${data.title}"`);
      console.log(`   Length: ${data.title.length} characters`);
      console.log(`   Words: ${data.title.split(/\s+/).length}`);
    } else if (data.error) {
      console.log('\n❌ Error occurred:', data.error);
      if (data.details) {
        console.log('   Details:', data.details);
      }
    } else if (data.useFallback) {
      console.log('\n⚠️  Fallback mode triggered');
      console.log('   Rate limited:', data.rateLimited);
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Test Bytez SDK directly
async function testBytezDirectly() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Testing Bytez SDK Directly\n');
  
  try {
    const Bytez = (await import('bytez.js')).default;
    const bytezSDK = new Bytez(process.env.BYTEZ_API_KEY);
    
    console.log('✅ Bytez SDK imported successfully');
    console.log('🔑 API Key configured:', process.env.BYTEZ_API_KEY ? 'Yes' : 'No');
    
    const model = bytezSDK.model("Qwen/Qwen3-4B-Instruct-2507");
    console.log('📦 Model initialized: Qwen/Qwen3-4B-Instruct-2507');
    
    const startTime = Date.now();
    const { error, output } = await model.run([
      {
        role: "system",
        content: "Generate a 3-6 word title for this conversation."
      },
      {
        role: "user",
        content: "USER: What books are available to borrow?\nASSISTANT: We have many fiction books available!"
      }
    ]);
    const endTime = Date.now();
    
    console.log(`\n⏱️  Bytez response time: ${endTime - startTime}ms`);
    
    if (error) {
      console.log('❌ Bytez error:', error);
    } else {
      console.log('✅ Bytez success!');
      console.log('   Output:', output);
    }
    
  } catch (error) {
    console.error('❌ Bytez test failed:', error.message);
  }
}

// Load environment variables
async function loadEnv() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    
    console.log('✅ Environment variables loaded');
  } catch (error) {
    console.warn('⚠️  Could not load .env.local:', error.message);
  }
}

(async () => {
  await loadEnv();
  await testWithDetails();
  await testBytezDirectly();
})();
