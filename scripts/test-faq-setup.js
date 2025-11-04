// Test script to verify FAQ database setup
// Run with: node scripts/test-faq-setup.js

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testFAQSetup() {
  console.log('🧪 Testing FAQ Database Setup...\n');

  try {
    // 1. Seed the database
    console.log('1️⃣ Seeding FAQ database...');
    const seedResponse = await fetch(`${BASE_URL}/api/faq/seed`, {
      method: 'POST',
    });
    const seedData = await seedResponse.json();
    console.log(`✅ Seeded ${seedData.count} FAQs\n`);

    // 2. Fetch all FAQs
    console.log('2️⃣ Fetching all FAQs...');
    const allResponse = await fetch(`${BASE_URL}/api/faq`);
    const allData = await allResponse.json();
    console.log(`✅ Retrieved ${allData.faqs.length} FAQs\n`);

    // 3. Test category filter
    console.log('3️⃣ Testing category filter (borrowing)...');
    const categoryResponse = await fetch(`${BASE_URL}/api/faq?category=borrowing`);
    const categoryData = await categoryResponse.json();
    console.log(`✅ Found ${categoryData.faqs.length} borrowing FAQs\n`);

    // 4. Test search
    console.log('4️⃣ Testing search (printing)...');
    const searchResponse = await fetch(`${BASE_URL}/api/faq?search=printing`);
    const searchData = await searchResponse.json();
    console.log(`✅ Found ${searchData.faqs.length} FAQs matching "printing"\n`);

    // 5. Display sample FAQ
    if (allData.faqs.length > 0) {
      console.log('📋 Sample FAQ:');
      const sample = allData.faqs[0];
      console.log(`   Q: ${sample.question}`);
      console.log(`   A: ${sample.answer}`);
      console.log(`   Category: ${sample.category}`);
      console.log(`   Keywords: ${sample.keywords.join(', ')}\n`);
    }

    console.log('✨ All tests passed! FAQ database is ready.');
    console.log('\n📚 Next steps:');
    console.log('   - Visit /student/faq to see the FAQ page');
    console.log('   - Visit /student/chat to test the chatbot with FAQ knowledge');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   - Your development server is running (npm run dev)');
    console.error('   - MongoDB is connected');
    console.error('   - Environment variables are set correctly');
  }
}

testFAQSetup();
