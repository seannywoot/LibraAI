const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testCategoryFilter() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const books = db.collection('books');
    
    console.log('🧪 Testing Category Filter\n');
    
    // Test 1: Count Fiction books with old field (category)
    const oldFieldCount = await books.countDocuments({ 
      category: 'Fiction' 
    });
    console.log('Books with category="Fiction" (old field):', oldFieldCount);
    
    // Test 2: Count Fiction books with new field (categories array)
    const newFieldCount = await books.countDocuments({ 
      categories: 'Fiction' 
    });
    console.log('Books with categories=["Fiction"] (new field):', newFieldCount);
    
    // Test 3: Get sample Fiction books
    console.log('\n📚 Sample Fiction Books:');
    const sampleBooks = await books.find({ 
      categories: 'Fiction' 
    }).limit(5).toArray();
    
    sampleBooks.forEach((book, i) => {
      console.log(`\n${i + 1}. ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Category (old): ${book.category || 'N/A'}`);
      console.log(`   Categories (new): ${(book.categories || []).join(', ')}`);
      console.log(`   Status: ${book.status}`);
    });
    
    // Test 4: Check how many books have each field
    const totalBooks = await books.countDocuments();
    const withOldField = await books.countDocuments({ category: { $exists: true } });
    const withNewField = await books.countDocuments({ categories: { $exists: true } });
    
    console.log('\n\n📊 Field Usage:');
    console.log(`Total books: ${totalBooks}`);
    console.log(`Books with "category" field: ${withOldField} (${Math.round(withOldField/totalBooks*100)}%)`);
    console.log(`Books with "categories" field: ${withNewField} (${Math.round(withNewField/totalBooks*100)}%)`);
    
    console.log('\n✅ Filter should use "categories" field (array from Google Books)');
    
  } finally {
    await client.close();
  }
}

testCategoryFilter();
