const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function countFictionBooks() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const books = db.collection('books');
    
    // Count fiction books
    const fictionCount = await books.countDocuments({ 
      categories: 'Fiction' 
    });
    
    console.log('📚 Fiction Books:', fictionCount);
    
    // Get all categories with counts
    const allCategories = await books.aggregate([
      { $match: { categories: { $exists: true } } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📊 All Categories:');
    allCategories.forEach(c => {
      console.log(`  ${c._id}: ${c.count} books`);
    });
    
    console.log(`\n✅ Total: ${allCategories.length} unique categories`);
    
  } finally {
    await client.close();
  }
}

countFictionBooks();
