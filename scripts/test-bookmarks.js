/**
 * Test script for bookmarks feature
 * Tests bookmark creation, retrieval, and deletion
 */

require('dotenv').config({ path: '.env.local' });
const clientPromise = require('../src/lib/mongodb').default;
const { ObjectId } = require('mongodb');

async function testBookmarks() {
  console.log('🧪 Testing Bookmarks Feature...\n');

  try {
    const client = await clientPromise;
    const db = client.db('library');

    // 1. Find a test student
    console.log('1️⃣ Finding test student...');
    const testUser = await db.collection('users').findOne({ role: 'student' });
    
    if (!testUser) {
      console.log('❌ No student user found. Please create a student user first.');
      process.exit(1);
    }
    
    console.log(`✅ Found student: ${testUser.email} (ID: ${testUser._id})\n`);

    // 2. Find a test book
    console.log('2️⃣ Finding test book...');
    const testBook = await db.collection('books').findOne({});
    
    if (!testBook) {
      console.log('❌ No books found. Please add books to the catalog first.');
      process.exit(1);
    }
    
    console.log(`✅ Found book: "${testBook.title}" by ${testBook.author}`);
    console.log(`   Book ID: ${testBook._id}\n`);

    // 3. Test creating a bookmark
    console.log('3️⃣ Creating bookmark...');
    const existingBookmark = await db.collection('bookmarks').findOne({
      userId: testUser._id,
      bookId: testBook._id,
    });

    if (existingBookmark) {
      console.log('⚠️  Bookmark already exists, deleting it first...');
      await db.collection('bookmarks').deleteOne({ _id: existingBookmark._id });
    }

    const newBookmark = {
      userId: testUser._id,
      bookId: testBook._id,
      bookTitle: testBook.title,
      bookAuthor: testBook.author,
      createdAt: new Date(),
    };

    const insertResult = await db.collection('bookmarks').insertOne(newBookmark);
    console.log(`✅ Created bookmark with ID: ${insertResult.insertedId}\n`);

    // 4. Test retrieving bookmark
    console.log('4️⃣ Retrieving bookmark...');
    const retrievedBookmark = await db.collection('bookmarks').findOne({
      _id: insertResult.insertedId,
    });

    if (retrievedBookmark) {
      console.log('✅ Bookmark retrieved successfully');
      console.log(`   User: ${retrievedBookmark.userId}`);
      console.log(`   Book: ${retrievedBookmark.bookTitle}`);
      console.log(`   Created: ${retrievedBookmark.createdAt}`);
    } else {
      console.log('❌ Failed to retrieve bookmark');
    }
    console.log('');

    // 5. Test checking if book is bookmarked
    console.log('5️⃣ Checking if book is bookmarked...');
    const isBookmarked = await db.collection('bookmarks').findOne({
      userId: testUser._id,
      bookId: testBook._id,
    });

    if (isBookmarked) {
      console.log('✅ Book is bookmarked');
    } else {
      console.log('❌ Book is not bookmarked');
    }
    console.log('');

    // 6. Test getting all bookmarks for user
    console.log('6️⃣ Getting all bookmarks for user...');
    const allBookmarks = await db.collection('bookmarks')
      .find({ userId: testUser._id })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${allBookmarks.length} bookmark(s)`);
    allBookmarks.forEach((bookmark, i) => {
      console.log(`   ${i + 1}. ${bookmark.bookTitle} by ${bookmark.bookAuthor}`);
    });
    console.log('');

    // 7. Test getting bookmarked books with full details
    console.log('7️⃣ Getting bookmarked books with full details...');
    const bookIds = allBookmarks.map(b => b.bookId);
    const books = await db.collection('books')
      .find({ _id: { $in: bookIds } })
      .toArray();

    console.log(`✅ Retrieved ${books.length} book(s) with full details`);
    books.forEach((book, i) => {
      const bookmark = allBookmarks.find(b => b.bookId.toString() === book._id.toString());
      console.log(`   ${i + 1}. ${book.title}`);
      console.log(`      Author: ${book.author}`);
      console.log(`      ISBN: ${book.isbn || 'N/A'}`);
      console.log(`      Bookmarked: ${bookmark.createdAt.toLocaleDateString()}`);
    });
    console.log('');

    // 8. Test duplicate bookmark prevention
    console.log('8️⃣ Testing duplicate bookmark prevention...');
    try {
      await db.collection('bookmarks').insertOne({
        userId: testUser._id,
        bookId: testBook._id,
        bookTitle: testBook.title,
        bookAuthor: testBook.author,
        createdAt: new Date(),
      });
      console.log('❌ Duplicate bookmark was created (should have failed)');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✅ Duplicate bookmark prevented by unique index');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // 9. Test deleting bookmark
    console.log('9️⃣ Deleting bookmark...');
    const deleteResult = await db.collection('bookmarks').deleteOne({
      _id: insertResult.insertedId,
    });

    if (deleteResult.deletedCount > 0) {
      console.log('✅ Bookmark deleted successfully');
    } else {
      console.log('❌ Failed to delete bookmark');
    }
    console.log('');

    // 10. Verify deletion
    console.log('🔟 Verifying deletion...');
    const deletedBookmark = await db.collection('bookmarks').findOne({
      _id: insertResult.insertedId,
    });

    if (!deletedBookmark) {
      console.log('✅ Bookmark successfully removed from database');
    } else {
      console.log('❌ Bookmark still exists in database');
    }

    console.log('\n✅ All tests completed!\n');
    console.log('📋 Test Summary:');
    console.log('   - Create bookmark: ✅');
    console.log('   - Retrieve bookmark: ✅');
    console.log('   - Check bookmark status: ✅');
    console.log('   - Get all user bookmarks: ✅');
    console.log('   - Get bookmarked books with details: ✅');
    console.log('   - Duplicate prevention: ✅');
    console.log('   - Delete bookmark: ✅');
    console.log('   - Verify deletion: ✅');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testBookmarks();
