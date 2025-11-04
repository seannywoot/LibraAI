/**
 * Test Books API Script
 * 
 * This script tests that the books API endpoints are working correctly
 * 
 * Usage:
 *   node scripts/test-books-api.js
 * 
 * Requirements:
 *   - Server must be running (npm run dev)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testBooksAPI() {
  console.log('🧪 Testing Books API Endpoints...\n');

  try {
    // Test student books endpoint (no auth required for GET)
    console.log('1️⃣ Testing Student Books API...');
    const studentResponse = await fetch(`${BASE_URL}/api/student/books?pageSize=5`, {
      cache: 'no-store'
    });
    
    if (!studentResponse.ok) {
      console.log(`   ⚠️  Status: ${studentResponse.status} ${studentResponse.statusText}`);
      const error = await studentResponse.json().catch(() => ({}));
      console.log(`   Error: ${error.error || 'Unknown error'}`);
    } else {
      const studentData = await studentResponse.json();
      console.log(`   ✅ Success! Found ${studentData.total} books`);
      console.log(`   📚 Sample books:`);
      studentData.items.slice(0, 3).forEach((book, i) => {
        console.log(`      ${i + 1}. ${book.title} by ${book.author}`);
        console.log(`         Category: ${book.category || 'N/A'}, Format: ${book.format || 'N/A'}`);
      });
    }

    console.log('\n2️⃣ Testing Category Filter...');
    const categoryResponse = await fetch(`${BASE_URL}/api/student/books?categories=Technology&pageSize=5`, {
      cache: 'no-store'
    });
    
    if (categoryResponse.ok) {
      const categoryData = await categoryResponse.json();
      console.log(`   ✅ Technology books: ${categoryData.total}`);
      categoryData.items.forEach((book, i) => {
        console.log(`      ${i + 1}. ${book.title} (${book.category})`);
      });
    }

    console.log('\n3️⃣ Testing Format Filter...');
    const formatResponse = await fetch(`${BASE_URL}/api/student/books?formats=eBook&pageSize=5`, {
      cache: 'no-store'
    });
    
    if (formatResponse.ok) {
      const formatData = await formatResponse.json();
      console.log(`   ✅ eBooks: ${formatData.total}`);
      formatData.items.forEach((book, i) => {
        console.log(`      ${i + 1}. ${book.title} (${book.format})`);
      });
    }

    console.log('\n4️⃣ Testing Search...');
    const searchResponse = await fetch(`${BASE_URL}/api/student/books?search=Harry&pageSize=5`, {
      cache: 'no-store'
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   ✅ Search results for "Harry": ${searchData.total}`);
      searchData.items.forEach((book, i) => {
        console.log(`      ${i + 1}. ${book.title} by ${book.author}`);
      });
    }

    console.log('\n✨ API Testing Complete!\n');
    console.log('📍 View in browser:');
    console.log(`   Admin: ${BASE_URL}/admin/books`);
    console.log(`   Student: ${BASE_URL}/student/books\n`);

  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
    console.error('\nMake sure:');
    console.error('  1. Development server is running (npm run dev)');
    console.error('  2. Server is accessible at', BASE_URL);
    console.error('  3. Books have been seeded (npm run seed-books)\n');
    process.exit(1);
  }
}

testBooksAPI();
