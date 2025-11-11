/**
 * Setup MongoDB Indexes for Personal Libraries Collection
 * 
 * This script creates proper indexes for the personal_libraries collection
 * to ensure efficient queries and data integrity.
 * 
 * Run with: node scripts/setup-personal-library-indexes.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'libraai';

async function setupIndexes() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection('personal_libraries');

    console.log('\n📊 Setting up indexes for personal_libraries collection...\n');

    // 1. Index on userId (most common query)
    await collection.createIndex(
      { userId: 1 },
      { name: 'idx_userId' }
    );
    console.log('✅ Created index: userId');

    // 2. Compound index on userId + addedAt (for sorting user's books by date)
    await collection.createIndex(
      { userId: 1, addedAt: -1 },
      { name: 'idx_userId_addedAt' }
    );
    console.log('✅ Created index: userId + addedAt');

    // 3. Index on ISBN (for duplicate checking)
    await collection.createIndex(
      { isbn: 1 },
      { name: 'idx_isbn', sparse: true }
    );
    console.log('✅ Created index: isbn (sparse)');

    // 4. Compound index on userId + ISBN (for checking if user already has book)
    await collection.createIndex(
      { userId: 1, isbn: 1 },
      { name: 'idx_userId_isbn', sparse: true }
    );
    console.log('✅ Created index: userId + isbn');

    // 5. Text index on title and author (for search)
    await collection.createIndex(
      { title: 'text', author: 'text' },
      { name: 'idx_text_search', weights: { title: 2, author: 1 } }
    );
    console.log('✅ Created text index: title + author');

    // 6. Index on categories (for filtering and recommendations)
    await collection.createIndex(
      { categories: 1 },
      { name: 'idx_categories' }
    );
    console.log('✅ Created index: categories');

    // 7. Index on tags (for filtering)
    await collection.createIndex(
      { tags: 1 },
      { name: 'idx_tags', sparse: true }
    );
    console.log('✅ Created index: tags (sparse)');

    // 8. Index on addedMethod (for analytics)
    await collection.createIndex(
      { addedMethod: 1 },
      { name: 'idx_addedMethod' }
    );
    console.log('✅ Created index: addedMethod');

    // 9. Index on fileType (for filtering PDFs vs manual entries)
    await collection.createIndex(
      { fileType: 1 },
      { name: 'idx_fileType', sparse: true }
    );
    console.log('✅ Created index: fileType (sparse)');

    // List all indexes
    console.log('\n📋 Current indexes on personal_libraries:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Get collection stats
    const stats = await db.command({ collStats: 'personal_libraries' });
    console.log('\n📊 Collection Statistics:');
    console.log(`  - Total documents: ${stats.count}`);
    console.log(`  - Total size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  - Average document size: ${(stats.avgObjSize / 1024).toFixed(2)} KB`);
    console.log(`  - Total indexes: ${stats.nindexes}`);
    console.log(`  - Total index size: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n✅ All indexes created successfully!');

  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
setupIndexes().catch(console.error);
