// Test script to debug shelf deletion
// Run with: node scripts/test-shelf-delete.js

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testShelfDelete() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db();
    const shelves = db.collection('shelves');
    const books = db.collection('books');
    
    // Get a shelf
    const shelf = await shelves.findOne({}, { projection: { _id: 1, code: 1 } });
    if (!shelf) {
      console.log('✗ No shelves found in database');
      return;
    }
    
    console.log('\n📚 Testing shelf:', shelf);
    
    // Check if any books reference this shelf
    const booksWithShelf = await books.find({ shelf: { $exists: true, $ne: null } }).limit(5).toArray();
    console.log('\n📖 Sample books with shelf field:');
    booksWithShelf.forEach(book => {
      console.log(`  - "${book.title}" -> shelf: "${book.shelf}" (type: ${typeof book.shelf})`);
    });
    
    // Test the regex pattern
    const codeRegex = new RegExp(`^${shelf.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    console.log('\n🔍 Testing regex:', codeRegex);
    
    const inUse = await books.findOne({ shelf: { $regex: codeRegex } }, { projection: { _id: 1, title: 1, shelf: 1 } });
    console.log('\n📌 Books using shelf code "' + shelf.code + '":', inUse);
    
    // Try exact match
    const exactMatch = await books.findOne({ shelf: shelf.code }, { projection: { _id: 1, title: 1, shelf: 1 } });
    console.log('\n🎯 Exact match for shelf code "' + shelf.code + '":', exactMatch);
    
    // Try case-insensitive match
    const caseInsensitive = await books.findOne({ shelf: new RegExp(`^${shelf.code}$`, 'i') }, { projection: { _id: 1, title: 1, shelf: 1 } });
    console.log('\n🔤 Case-insensitive match:', caseInsensitive);
    
  } catch (error) {
    console.error('✗ Error:', error);
  } finally {
    await client.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

testShelfDelete();
