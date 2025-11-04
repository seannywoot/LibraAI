/**
 * Verify Books Script
 * 
 * This script verifies that seeded books are accessible via the API
 * 
 * Usage:
 *   node scripts/verify-books.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) {
    MONGODB_URI = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

async function verifyBooks() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔍 Verifying books in database...\n');
    
    await client.connect();
    const db = client.db('library');
    const books = db.collection('books');

    // Get total count
    const total = await books.countDocuments();
    console.log(`📊 Total books in database: ${total}\n`);

    if (total === 0) {
      console.log('⚠️  No books found! Run: npm run seed-books\n');
      return;
    }

    // Get sample books
    console.log('📚 Sample books (first 5):');
    const sampleBooks = await books.find({}).limit(5).toArray();
    
    sampleBooks.forEach((book, index) => {
      console.log(`\n${index + 1}. ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Category: ${book.category || 'N/A'}`);
      console.log(`   Format: ${book.format || 'N/A'}`);
      console.log(`   Shelf: ${book.shelf || 'N/A'}`);
      console.log(`   Status: ${book.status}`);
      console.log(`   ISBN: ${book.isbn || 'N/A'}`);
    });

    // Check categories
    console.log('\n\n📂 Categories distribution:');
    const categories = await books.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    categories.forEach(cat => {
      console.log(`   ${cat._id || 'Uncategorized'}: ${cat.count} books`);
    });

    // Check formats
    console.log('\n📦 Formats distribution:');
    const formats = await books.aggregate([
      { $group: { _id: '$format', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    formats.forEach(fmt => {
      console.log(`   ${fmt._id || 'Unknown'}: ${fmt.count} books`);
    });

    // Check statuses
    console.log('\n📊 Status distribution:');
    const statuses = await books.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    statuses.forEach(status => {
      console.log(`   ${status._id}: ${status.count} books`);
    });

    console.log('\n✅ Verification complete!');
    console.log('\n📍 Next steps:');
    console.log('   1. Make sure your dev server is running: npm run dev');
    console.log('   2. Login as admin');
    console.log('   3. Visit: http://localhost:3000/admin/books');
    console.log('   4. Or visit student view: http://localhost:3000/student/books\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyBooks();
