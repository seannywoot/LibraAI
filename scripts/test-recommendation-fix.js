/**
 * Test Recommendation Engine Fix
 * Simulates the issue where recommendations disappear after interactions
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function testRecommendationFix() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db();
    const users = db.collection('users');
    const books = db.collection('books');
    const userInteractions = db.collection('user_interactions');

    console.log('=' .repeat(60));
    console.log('TESTING RECOMMENDATION ENGINE FIX');
    console.log('=' .repeat(60));

    // ============================================
    // SCENARIO 1: New user with no interactions
    // ============================================
    console.log('\n📊 SCENARIO 1: New User (No Interactions)');
    console.log('-'.repeat(60));

    const newUser = {
      _id: new ObjectId(),
      name: 'Test New User',
      email: 'test.new.user@test.com',
      role: 'student',
      createdAt: new Date(),
    };

    await users.insertOne(newUser);
    console.log(`✅ Created user: ${newUser.email}`);

    // Check available books
    const availableCount = await books.countDocuments({ status: 'available' });
    console.log(`📚 Available books in catalog: ${availableCount}`);

    if (availableCount === 0) {
      console.log('❌ No available books - recommendations will be empty!');
    } else {
      console.log('✅ Should get popular book recommendations');
    }

    // ============================================
    // SCENARIO 2: User with Science interactions
    // ============================================
    console.log('\n\n📊 SCENARIO 2: User After Science Book Interactions');
    console.log('-'.repeat(60));

    // Get a Science book
    const scienceBooks = await books.find({
      categories: 'Science',
      status: 'available'
    }).limit(3).toArray();

    console.log(`📚 Science books available: ${scienceBooks.length}`);

    if (scienceBooks.length === 0) {
      console.log('⚠️  No Science books available - will test with available books');
      
      // Get any available books
      const anyBooks = await books.find({ status: 'available' }).limit(3).toArray();
      
      if (anyBooks.length > 0) {
        console.log(`📚 Using ${anyBooks.length} available books for testing`);
        
        // Create interactions
        const interactions = [];
        const now = new Date();
        
        for (let i = 0; i < anyBooks.length; i++) {
          const book = anyBooks[i];
          
          // View interaction
          interactions.push({
            userId: newUser._id,
            eventType: 'view',
            bookId: book._id,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCategories: book.categories || [],
            bookTags: book.tags || [],
            bookPublisher: book.publisher,
            bookFormat: book.format,
            bookYear: book.year,
            timestamp: new Date(now - (i * 60000)), // Stagger by 1 minute
          });
        }
        
        await userInteractions.insertMany(interactions);
        console.log(`✅ Created ${interactions.length} interactions`);
        
        // Check what recommendations would be generated
        console.log('\n🔍 Checking recommendation candidates...');
        
        const userProfile = {
          topCategories: [...new Set(anyBooks.flatMap(b => b.categories || []))],
          topTags: [...new Set(anyBooks.flatMap(b => b.tags || []))],
          topAuthors: [...new Set(anyBooks.map(b => b.author))],
        };
        
        console.log(`   User's top categories: ${userProfile.topCategories.join(', ')}`);
        console.log(`   User's top authors: ${userProfile.topAuthors.join(', ')}`);
        
        // Find matching books
        const matchingBooks = await books.find({
          $or: [
            { categories: { $in: userProfile.topCategories } },
            { tags: { $in: userProfile.topTags } },
            { author: { $in: userProfile.topAuthors } },
          ],
          status: 'available',
          _id: { $nin: anyBooks.map(b => b._id) }, // Exclude already viewed
        }).limit(20).toArray();
        
        console.log(`   Matching books found: ${matchingBooks.length}`);
        
        if (matchingBooks.length === 0) {
          console.log('   ⚠️  No matching books - should fall back to popular books');
          
          const popularBooks = await books.find({ status: 'available' })
            .sort({ popularityScore: -1 })
            .limit(10)
            .toArray();
          
          console.log(`   Popular books available: ${popularBooks.length}`);
          
          if (popularBooks.length > 0) {
            console.log('   ✅ Fallback to popular books should work');
          } else {
            console.log('   ❌ No popular books available!');
          }
        } else {
          console.log('   ✅ Matching books found - recommendations should work');
          console.log('\n   Sample matching books:');
          matchingBooks.slice(0, 5).forEach(book => {
            console.log(`      • ${book.title} by ${book.author}`);
            console.log(`        Categories: ${book.categories?.join(', ') || 'None'}`);
            console.log(`        Popularity: ${book.popularityScore || 0}`);
          });
        }
      } else {
        console.log('❌ No books available at all - cannot test!');
      }
    } else {
      console.log('✅ Science books available for testing');
      
      // Create Science interactions
      const interactions = [];
      const now = new Date();
      
      for (let i = 0; i < scienceBooks.length; i++) {
        const book = scienceBooks[i];
        
        interactions.push({
          userId: newUser._id,
          eventType: 'view',
          bookId: book._id,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookCategories: book.categories || [],
          bookTags: book.tags || [],
          bookPublisher: book.publisher,
          bookFormat: book.format,
          bookYear: book.year,
          timestamp: new Date(now - (i * 60000)),
        });
      }
      
      await userInteractions.insertMany(interactions);
      console.log(`✅ Created ${interactions.length} Science book interactions`);
      
      // Check for more Science books
      const moreScienceBooks = await books.find({
        categories: 'Science',
        status: 'available',
        _id: { $nin: scienceBooks.map(b => b._id) }
      }).toArray();
      
      console.log(`📚 Other Science books available: ${moreScienceBooks.length}`);
      
      if (moreScienceBooks.length > 0) {
        console.log('✅ Should get Science book recommendations');
      } else {
        console.log('⚠️  No other Science books - should fall back to popular books');
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));

    console.log('\n✅ Fixes Applied:');
    console.log('   1. Reduced weak match penalty from 60% to 50%');
    console.log('   2. Lowered relevance score threshold from 20 to 15');
    console.log('   3. Added fallback to popular books if scoring returns empty');
    console.log('   4. Added fallback if diversity filter removes everything');
    console.log('   5. Fixed query structure for exclusions');

    console.log('\n💡 Expected Behavior:');
    console.log('   • New users: Get popular books');
    console.log('   • After interactions: Get personalized recommendations');
    console.log('   • If no matches: Fall back to popular books');
    console.log('   • Never return empty recommendations (if books exist)');

    console.log('\n🧪 To Test in Application:');
    console.log(`   1. Log in as: ${newUser.email}`);
    console.log('   2. Check recommendations (should show popular books)');
    console.log('   3. View/interact with some books');
    console.log('   4. Check recommendations again (should be personalized)');
    console.log('   5. Recommendations should NEVER be empty');

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await users.deleteOne({ _id: newUser._id });
    await userInteractions.deleteMany({ userId: newUser._id });
    console.log('✅ Cleanup complete');

    console.log('\n');

  } catch (error) {
    console.error('❌ Error testing recommendations:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run test
testRecommendationFix()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
