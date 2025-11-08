/**
 * Setup script for bookmarks feature
 * Creates necessary indexes for optimal performance
 */

require('dotenv').config({ path: '.env.local' });
const clientPromise = require('../src/lib/mongodb').default;

async function setupBookmarks() {
  console.log('🔖 Setting up Bookmarks Feature...\n');

  try {
    const client = await clientPromise;
    const db = client.db('library');

    // 1. Ensure bookmarks collection exists
    console.log('1️⃣ Checking bookmarks collection...');
    const collections = await db.listCollections({ name: 'bookmarks' }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection('bookmarks');
      console.log('✅ Created bookmarks collection');
    } else {
      console.log('✅ Bookmarks collection already exists');
    }

    // 2. Create indexes
    console.log('\n2️⃣ Creating indexes...');
    
    // Compound index for user's bookmarks (sorted by date)
    await db.collection('bookmarks').createIndex(
      { userId: 1, createdAt: -1 },
      { name: 'user_bookmarks_by_date' }
    );
    console.log('✅ Created index: user_bookmarks_by_date');
    
    // Unique compound index for checking if specific book is bookmarked
    await db.collection('bookmarks').createIndex(
      { userId: 1, bookId: 1 },
      { unique: true, name: 'user_book_unique' }
    );
    console.log('✅ Created unique index: user_book_unique');
    
    // Index for book lookups (to find all users who bookmarked a book)
    await db.collection('bookmarks').createIndex(
      { bookId: 1 },
      { name: 'book_bookmarks' }
    );
    console.log('✅ Created index: book_bookmarks');

    // 3. Display collection stats
    console.log('\n3️⃣ Collection statistics:');
    const count = await db.collection('bookmarks').countDocuments();
    console.log(`   Documents: ${count}`);

    // 4. List all indexes
    console.log('\n4️⃣ Indexes created:');
    const indexes = await db.collection('bookmarks').indexes();
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      if (idx.unique) console.log(`     (unique)`);
    });

    console.log('\n✅ Bookmarks feature setup complete!\n');
    console.log('📋 Summary:');
    console.log('   - Collection: bookmarks');
    console.log('   - Indexes: 4 (including _id)');
    console.log('   - Ready for use');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Start your dev server');
    console.log('   2. Log in as a student');
    console.log('   3. Navigate to any book detail page');
    console.log('   4. Click the "Bookmark" button');
    console.log('   5. View bookmarked books in My Library > Bookmarked tab');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

setupBookmarks();
