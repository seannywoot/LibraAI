/**
 * Diagnose Recommendation Engine Issues
 * Checks why recommendations might not appear for a user
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function diagnoseRecommendations(userEmail) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db();
    const users = db.collection('users');
    const books = db.collection('books');
    const transactions = db.collection('transactions');
    const userInteractions = db.collection('user_interactions');
    const personalLibraries = db.collection('personal_libraries');

    // Get user
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log('=' .repeat(60));
    console.log(`DIAGNOSING RECOMMENDATIONS FOR: ${user.name} (${user.email})`);
    console.log('=' .repeat(60));

    // ============================================
    // CHECK USER INTERACTIONS
    // ============================================
    console.log('\n📊 USER INTERACTIONS:');
    
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const interactions = await userInteractions
      .find({
        userId: user._id,
        timestamp: { $gte: ninetyDaysAgo },
      })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`   Total interactions (last 90 days): ${interactions.length}`);

    if (interactions.length === 0) {
      console.log('   ⚠️  No interactions found - user will get popular recommendations');
    } else {
      const eventCounts = {};
      interactions.forEach(i => {
        eventCounts[i.eventType] = (eventCounts[i.eventType] || 0) + 1;
      });
      
      console.log('   Event breakdown:');
      Object.entries(eventCounts).forEach(([event, count]) => {
        console.log(`      • ${event}: ${count}`);
      });

      // Check categories
      const categories = {};
      interactions.forEach(i => {
        if (i.bookCategories) {
          i.bookCategories.forEach(cat => {
            categories[cat] = (categories[cat] || 0) + 1;
          });
        }
      });
      
      if (Object.keys(categories).length > 0) {
        console.log('\n   Top Categories:');
        Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([cat, count]) => {
            console.log(`      • ${cat}: ${count}`);
          });
      } else {
        console.log('   ⚠️  No categories found in interactions');
      }

      // Check authors
      const authors = {};
      interactions.forEach(i => {
        if (i.bookAuthor) {
          authors[i.bookAuthor] = (authors[i.bookAuthor] || 0) + 1;
        }
      });
      
      if (Object.keys(authors).length > 0) {
        console.log('\n   Top Authors:');
        Object.entries(authors)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .forEach(([author, count]) => {
            console.log(`      • ${author}: ${count}`);
          });
      }
    }

    // ============================================
    // CHECK TRANSACTIONS
    // ============================================
    console.log('\n📖 TRANSACTIONS:');
    
    const userTransactions = await transactions
      .find({
        userId: user._id,
        borrowedAt: { $gte: ninetyDaysAgo },
      })
      .toArray();

    console.log(`   Total transactions (last 90 days): ${userTransactions.length}`);
    
    if (userTransactions.length > 0) {
      console.log('   Books borrowed:');
      userTransactions.forEach(t => {
        console.log(`      • ${t.bookTitle} (${t.status})`);
      });
    }

    // ============================================
    // CHECK PERSONAL LIBRARY
    // ============================================
    console.log('\n📚 PERSONAL LIBRARY:');
    
    const libraryBooks = await personalLibraries
      .find({ userId: user._id })
      .toArray();

    console.log(`   Books in personal library: ${libraryBooks.length}`);
    
    if (libraryBooks.length > 0) {
      console.log('   Books (will be excluded from recommendations):');
      libraryBooks.slice(0, 10).forEach(b => {
        console.log(`      • ${b.title} (ISBN: ${b.isbn || 'N/A'})`);
      });
      if (libraryBooks.length > 10) {
        console.log(`      ... and ${libraryBooks.length - 10} more`);
      }
    }

    // ============================================
    // CHECK AVAILABLE BOOKS
    // ============================================
    console.log('\n📖 AVAILABLE BOOKS IN CATALOG:');
    
    const availableBooks = await books
      .find({ status: 'available' })
      .toArray();

    console.log(`   Total available books: ${availableBooks.length}`);

    if (availableBooks.length === 0) {
      console.log('   ❌ NO AVAILABLE BOOKS - This is the problem!');
      return;
    }

    // Check by category
    const booksByCategory = {};
    availableBooks.forEach(book => {
      if (book.categories) {
        book.categories.forEach(cat => {
          booksByCategory[cat] = (booksByCategory[cat] || 0) + 1;
        });
      }
    });

    console.log('\n   Available books by category:');
    Object.entries(booksByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([cat, count]) => {
        console.log(`      • ${cat}: ${count}`);
      });

    // ============================================
    // CHECK CANDIDATE BOOKS
    // ============================================
    console.log('\n🔍 CHECKING CANDIDATE BOOKS:');

    // Get top categories from interactions
    const topCategories = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat]) => cat);

    console.log(`   User's top categories: ${topCategories.join(', ') || 'None'}`);

    if (topCategories.length > 0) {
      // Check for books matching user's categories
      const matchingBooks = await books
        .find({
          categories: { $in: topCategories },
          status: 'available',
        })
        .toArray();

      console.log(`   Books matching user's categories: ${matchingBooks.length}`);

      if (matchingBooks.length > 0) {
        console.log('   Sample matching books:');
        matchingBooks.slice(0, 5).forEach(book => {
          console.log(`      • ${book.title} by ${book.author}`);
          console.log(`        Categories: ${book.categories?.join(', ')}`);
        });
      } else {
        console.log('   ⚠️  No books match user\'s preferred categories!');
      }

      // Check exclusions
      const excludeIsbns = libraryBooks.map(b => b.isbn).filter(Boolean);
      const excludeTitles = libraryBooks.map(b => b.title).filter(Boolean);
      const excludeIds = userTransactions
        .filter(t => t.status === 'borrowed' || t.status === 'pending-approval')
        .map(t => t.bookId);

      console.log('\n   Exclusions:');
      console.log(`      • Books in personal library: ${libraryBooks.length}`);
      console.log(`      • Currently borrowed/pending: ${excludeIds.length}`);

      // Check how many would be excluded
      const afterExclusion = matchingBooks.filter(book => {
        const isExcludedByIsbn = excludeIsbns.includes(book.isbn);
        const isExcludedByTitle = excludeTitles.includes(book.title);
        const isExcludedById = excludeIds.some(id => id.toString() === book._id.toString());
        return !isExcludedByIsbn && !isExcludedByTitle && !isExcludedById;
      });

      console.log(`      • Matching books after exclusions: ${afterExclusion.length}`);

      if (afterExclusion.length === 0) {
        console.log('\n   ❌ PROBLEM FOUND: All matching books are excluded!');
        console.log('   Possible reasons:');
        console.log('      1. User has all matching books in personal library');
        console.log('      2. User has borrowed all matching books');
        console.log('      3. Not enough books in the catalog for this category');
      }
    }

    // ============================================
    // CHECK POPULAR BOOKS FALLBACK
    // ============================================
    console.log('\n🌟 POPULAR BOOKS FALLBACK:');
    
    const popularBooks = await books
      .find({ status: 'available' })
      .sort({ popularityScore: -1 })
      .limit(10)
      .toArray();

    console.log(`   Top 10 popular available books: ${popularBooks.length}`);
    
    if (popularBooks.length > 0) {
      popularBooks.forEach((book, i) => {
        console.log(`      ${i + 1}. ${book.title} (Score: ${book.popularityScore || 0})`);
      });
    } else {
      console.log('   ❌ No popular books available!');
    }

    // ============================================
    // SUMMARY & RECOMMENDATIONS
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 DIAGNOSIS SUMMARY');
    console.log('=' .repeat(60));

    const issues = [];
    const suggestions = [];

    if (interactions.length === 0) {
      issues.push('No user interactions found');
      suggestions.push('User should get popular books - check if popular books exist');
    }

    if (availableBooks.length === 0) {
      issues.push('❌ CRITICAL: No available books in catalog');
      suggestions.push('Add books to catalog with status: "available"');
    }

    if (topCategories.length > 0) {
      const matchingBooks = await books.countDocuments({
        categories: { $in: topCategories },
        status: 'available',
      });

      if (matchingBooks === 0) {
        issues.push(`No available books match user's categories: ${topCategories.join(', ')}`);
        suggestions.push('Add more books in these categories to the catalog');
      }
    }

    if (libraryBooks.length > 50) {
      issues.push('User has many books in personal library (may exclude many recommendations)');
      suggestions.push('This is normal - recommendations will be more limited');
    }

    if (issues.length === 0) {
      console.log('\n✅ No obvious issues found');
      console.log('   Recommendations should be working');
      console.log('   If still not showing, check:');
      console.log('      1. Frontend is calling the API correctly');
      console.log('      2. API route is working');
      console.log('      3. User session/authentication');
    } else {
      console.log('\n⚠️  Issues Found:');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });

      console.log('\n💡 Suggestions:');
      suggestions.forEach((suggestion, i) => {
        console.log(`   ${i + 1}. ${suggestion}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error diagnosing recommendations:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Get user email from command line or use default
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node scripts/diagnose-recommendations.js <user-email>');
  console.log('Example: node scripts/diagnose-recommendations.js scifi.lover@test.com');
  process.exit(1);
}

// Run diagnosis
diagnoseRecommendations(userEmail)
  .then(() => {
    console.log('✅ Diagnosis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  });
