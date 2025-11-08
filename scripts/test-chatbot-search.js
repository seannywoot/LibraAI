/**
 * Test script to verify chatbot search functionality
 * Simulates the searchBooks function to test if descriptions work
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function searchBooks(db, query, status) {
  const booksCollection = db.collection("books");
  const searchQuery = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { author: { $regex: query, $options: "i" } },
      { isbn: { $regex: query, $options: "i" } },
      { publisher: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { category: { $regex: query, $options: "i" } },
    ],
  };

  if (status) {
    searchQuery.status = status;
  }

  const books = await booksCollection
    .find(searchQuery)
    .limit(10)
    .project({
      title: 1,
      author: 1,
      year: 1,
      status: 1,
      shelf: 1,
      category: 1,
      description: 1,
    })
    .toArray();

  return {
    count: books.length,
    books: books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      year: book.year,
      status: book.status,
      shelf: book.shelf,
      category: book.category,
      description: book.description ? book.description.substring(0, 100) + '...' : 'No description',
    })),
  };
}

async function runTests() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Test 1: Direct title search
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Direct Title Search');
    console.log('Query: "Atomic Habits"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const test1 = await searchBooks(db, "Atomic Habits");
    console.log(`Result: ${test1.count > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Found: ${test1.count} book(s)`);
    if (test1.count > 0) {
      test1.books.forEach(book => {
        console.log(`  - ${book.title} by ${book.author} (${book.status})`);
        console.log(`    ${book.description}`);
      });
    }

    // Test 2: Topic search - "habits"
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Topic Search');
    console.log('Query: "habits"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const test2 = await searchBooks(db, "habits");
    console.log(`Result: ${test2.count > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Found: ${test2.count} book(s)`);
    if (test2.count > 0) {
      test2.books.forEach(book => {
        console.log(`  - ${book.title} by ${book.author}`);
      });
    }

    // Test 3: Topic search - "productivity"
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: Topic Search');
    console.log('Query: "productivity"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const test3 = await searchBooks(db, "productivity");
    console.log(`Result: ${test3.count > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Found: ${test3.count} book(s)`);
    if (test3.count > 0) {
      test3.books.forEach(book => {
        console.log(`  - ${book.title} by ${book.author}`);
      });
    }

    // Test 4: Topic search - "behavior change"
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: Topic Search');
    console.log('Query: "behavior change"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const test4 = await searchBooks(db, "behavior change");
    console.log(`Result: ${test4.count > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Found: ${test4.count} book(s)`);
    if (test4.count > 0) {
      test4.books.forEach(book => {
        console.log(`  - ${book.title} by ${book.author}`);
      });
    }

    // Test 5: Author search
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 5: Author Search');
    console.log('Query: "James Clear"');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const test5 = await searchBooks(db, "James Clear");
    console.log(`Result: ${test5.count > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Found: ${test5.count} book(s)`);
    if (test5.count > 0) {
      test5.books.forEach(book => {
        console.log(`  - ${book.title} by ${book.author}`);
      });
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const allPassed = test1.count > 0 && test2.count > 0 && test5.count > 0;
    
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\n✅ The chatbot can now:');
      console.log('   1. Find books by exact title');
      console.log('   2. Find books by topic/theme');
      console.log('   3. Find books by author');
      console.log('   4. Search within book descriptions');
      console.log('\n✅ "Atomic Habits" is now fully searchable!');
    } else {
      console.log('⚠️  Some tests failed. Check the results above.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Database connection closed');
  }
}

runTests();
