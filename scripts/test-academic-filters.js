/**
 * Test Academic Materials Filtering
 * Verifies that articles, journals, and theses can be filtered correctly
 * 
 * Usage: node scripts/test-academic-filters.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function testFilters() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const books = db.collection('books');

    console.log('🧪 Testing Academic Material Filters\n');
    console.log('=' .repeat(60));

    // Test 1: Count all academic materials
    const allAcademic = await books.countDocuments({ 
      resourceType: { $exists: true } 
    });
    console.log(`\n📚 Total academic materials: ${allAcademic}`);

    // Test 2: Count by type
    const articles = await books.countDocuments({ resourceType: 'article' });
    const journals = await books.countDocuments({ resourceType: 'journal' });
    const theses = await books.countDocuments({ resourceType: 'thesis' });

    console.log(`\n📊 Breakdown by Type:`);
    console.log(`   📄 Articles: ${articles}`);
    console.log(`   📖 Journals: ${journals}`);
    console.log(`   🎓 Theses: ${theses}`);

    // Test 3: Simulate API filter for Articles
    console.log('\n🔍 Test Filter: Articles Only');
    const articleQuery = { resourceType: { $in: ['article'] } };
    const articleResults = await books.find(articleQuery).toArray();
    console.log(`   Found ${articleResults.length} articles:`);
    articleResults.forEach(doc => {
      console.log(`   - ${doc.title} (${doc.author})`);
    });

    // Test 4: Simulate API filter for Journals
    console.log('\n🔍 Test Filter: Journals Only');
    const journalQuery = { resourceType: { $in: ['journal'] } };
    const journalResults = await books.find(journalQuery).toArray();
    console.log(`   Found ${journalResults.length} journals:`);
    journalResults.forEach(doc => {
      console.log(`   - ${doc.title} (${doc.author})`);
    });

    // Test 5: Simulate API filter for Theses
    console.log('\n🔍 Test Filter: Theses Only');
    const thesisQuery = { resourceType: { $in: ['thesis'] } };
    const thesisResults = await books.find(thesisQuery).toArray();
    console.log(`   Found ${thesisResults.length} theses:`);
    thesisResults.forEach(doc => {
      console.log(`   - ${doc.title} (${doc.author})`);
    });

    // Test 6: Simulate API filter for multiple types
    console.log('\n🔍 Test Filter: Articles + Journals');
    const multiQuery = { resourceType: { $in: ['article', 'journal'] } };
    const multiResults = await books.find(multiQuery).toArray();
    console.log(`   Found ${multiResults.length} items:`);
    multiResults.forEach(doc => {
      const emoji = doc.resourceType === 'article' ? '📄' : '📖';
      console.log(`   ${emoji} ${doc.title}`);
    });

    // Test 7: Simulate API filter for Books (should exclude academic materials)
    console.log('\n🔍 Test Filter: Books Only (excluding academic materials)');
    const booksQuery = {
      $or: [
        { resourceType: { $in: ['book'] } },
        { resourceType: { $exists: false } },
        { resourceType: null }
      ]
    };
    const bookCount = await books.countDocuments(booksQuery);
    console.log(`   Found ${bookCount} regular books (non-academic materials)`);

    // Test 8: Check if any documents still have 'type' field
    console.log('\n🔍 Checking for old "type" field...');
    const oldTypeCount = await books.countDocuments({ type: { $exists: true } });
    if (oldTypeCount > 0) {
      console.log(`   ⚠️  Warning: ${oldTypeCount} documents still have "type" field`);
    } else {
      console.log(`   ✅ No documents with old "type" field`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Filter testing complete!\n');

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the tests
testFilters();
