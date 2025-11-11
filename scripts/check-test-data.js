/**
 * Check Test Data for Recommendation Engine
 * Verifies that test data was seeded correctly
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkTestData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db();

    // ============================================
    // CHECK TEST USERS
    // ============================================
    console.log('=' .repeat(60));
    console.log('TEST USERS');
    console.log('=' .repeat(60));

    const users = await db.collection('users').find({
      email: { $in: ['scifi.lover@test.com', 'rowling.fan@test.com'] }
    }).toArray();

    users.forEach(user => {
      console.log(`\n✅ ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Role: ${user.role}`);
    });

    // ============================================
    // CHECK BOOKS
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('BOOKS');
    console.log('=' .repeat(60));

    const sciFiBooks = await db.collection('books').find({
      categories: 'Science Fiction'
    }).toArray();

    console.log(`\n📚 Science Fiction Books: ${sciFiBooks.length}`);
    sciFiBooks.forEach(book => {
      console.log(`   • ${book.title} by ${book.author} (Score: ${book.popularityScore})`);
    });

    const rowlingBooks = await db.collection('books').find({
      author: 'J.K. Rowling'
    }).toArray();

    console.log(`\n📚 J.K. Rowling Books: ${rowlingBooks.length}`);
    rowlingBooks.forEach(book => {
      console.log(`   • ${book.title} (Score: ${book.popularityScore})`);
    });

    const fantasyBooks = await db.collection('books').find({
      categories: 'Fantasy',
      author: { $ne: 'J.K. Rowling' }
    }).toArray();

    console.log(`\n📚 Other Fantasy Books: ${fantasyBooks.length}`);
    fantasyBooks.forEach(book => {
      console.log(`   • ${book.title} by ${book.author}`);
    });

    // ============================================
    // CHECK TRANSACTIONS
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('TRANSACTIONS');
    console.log('=' .repeat(60));

    const sciFiUser = users.find(u => u.email === 'scifi.lover@test.com');
    const rowlingUser = users.find(u => u.email === 'rowling.fan@test.com');

    if (sciFiUser) {
      const sciFiTransactions = await db.collection('transactions').find({
        userId: sciFiUser._id
      }).toArray();

      console.log(`\n📖 SciFi Lover Transactions: ${sciFiTransactions.length}`);
      sciFiTransactions.forEach(t => {
        console.log(`   • ${t.bookTitle} (${t.status})`);
      });
    }

    if (rowlingUser) {
      const rowlingTransactions = await db.collection('transactions').find({
        userId: rowlingUser._id
      }).toArray();

      console.log(`\n📖 Rowling Fan Transactions: ${rowlingTransactions.length}`);
      rowlingTransactions.forEach(t => {
        console.log(`   • ${t.bookTitle} (${t.status})`);
      });
    }

    // ============================================
    // CHECK INTERACTIONS
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('USER INTERACTIONS');
    console.log('=' .repeat(60));

    if (sciFiUser) {
      const sciFiInteractions = await db.collection('user_interactions').find({
        userId: sciFiUser._id
      }).toArray();

      console.log(`\n🔄 SciFi Lover Interactions: ${sciFiInteractions.length}`);
      
      const eventCounts = {};
      sciFiInteractions.forEach(i => {
        eventCounts[i.eventType] = (eventCounts[i.eventType] || 0) + 1;
      });
      
      Object.entries(eventCounts).forEach(([event, count]) => {
        console.log(`   • ${event}: ${count}`);
      });

      // Check categories
      const categories = {};
      sciFiInteractions.forEach(i => {
        if (i.bookCategories) {
          i.bookCategories.forEach(cat => {
            categories[cat] = (categories[cat] || 0) + 1;
          });
        }
      });
      
      console.log('\n   Top Categories:');
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([cat, count]) => {
          console.log(`      - ${cat}: ${count}`);
        });
    }

    if (rowlingUser) {
      const rowlingInteractions = await db.collection('user_interactions').find({
        userId: rowlingUser._id
      }).toArray();

      console.log(`\n🔄 Rowling Fan Interactions: ${rowlingInteractions.length}`);
      
      const eventCounts = {};
      rowlingInteractions.forEach(i => {
        eventCounts[i.eventType] = (eventCounts[i.eventType] || 0) + 1;
      });
      
      Object.entries(eventCounts).forEach(([event, count]) => {
        console.log(`   • ${event}: ${count}`);
      });

      // Check authors
      const authors = {};
      rowlingInteractions.forEach(i => {
        if (i.bookAuthor) {
          authors[i.bookAuthor] = (authors[i.bookAuthor] || 0) + 1;
        }
      });
      
      console.log('\n   Top Authors:');
      Object.entries(authors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([author, count]) => {
          console.log(`      - ${author}: ${count}`);
        });
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ TEST DATA VERIFICATION COMPLETE');
    console.log('=' .repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • Test Users: ${users.length}`);
    console.log(`   • Science Fiction Books: ${sciFiBooks.length}`);
    console.log(`   • J.K. Rowling Books: ${rowlingBooks.length}`);
    console.log(`   • Other Fantasy Books: ${fantasyBooks.length}`);
    
    if (sciFiUser) {
      const sciFiTrans = await db.collection('transactions').countDocuments({ userId: sciFiUser._id });
      const sciFiInt = await db.collection('user_interactions').countDocuments({ userId: sciFiUser._id });
      console.log(`   • SciFi Lover: ${sciFiTrans} transactions, ${sciFiInt} interactions`);
    }
    
    if (rowlingUser) {
      const rowlingTrans = await db.collection('transactions').countDocuments({ userId: rowlingUser._id });
      const rowlingInt = await db.collection('user_interactions').countDocuments({ userId: rowlingUser._id });
      console.log(`   • Rowling Fan: ${rowlingTrans} transactions, ${rowlingInt} interactions`);
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Log in to the app as one of the test users');
    console.log('   2. Check the recommendations sidebar');
    console.log('   3. Or call the API: /api/student/recommendations');
    console.log('\n');

  } catch (error) {
    console.error('❌ Error checking test data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run check
checkTestData()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
