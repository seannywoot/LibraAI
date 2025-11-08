/**
 * Test script to verify note operations
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const clientPromise = require('../src/lib/mongodb').default;
const { ObjectId } = require('mongodb');

async function testNoteOperations() {
  console.log('🧪 Testing Note Operations...\n');

  try {
    const client = await clientPromise;
    const db = client.db('library');

    // 1. Find a test student user
    console.log('1️⃣ Finding test student...');
    const testUser = await db.collection('users').findOne({ role: 'student' });
    
    if (!testUser) {
      console.log('❌ No student user found. Please create a student user first.');
      process.exit(1);
    }
    
    console.log(`✅ Found student: ${testUser.email} (ID: ${testUser._id})\n`);

    // 2. Create a test note
    console.log('2️⃣ Creating test note...');
    const newNote = {
      userId: testUser._id,
      title: 'Test Note',
      content: '<p>This is a test note</p>',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await db.collection('notes').insertOne(newNote);
    const noteId = insertResult.insertedId;
    console.log(`✅ Created note with ID: ${noteId}\n`);

    // 3. Test GET operation
    console.log('3️⃣ Testing GET operation...');
    const foundNote = await db.collection('notes').findOne({
      _id: noteId,
      userId: testUser._id,
    });
    
    if (foundNote) {
      console.log('✅ GET operation successful');
      console.log(`   Title: ${foundNote.title}`);
      console.log(`   Content: ${foundNote.content}`);
    } else {
      console.log('❌ GET operation failed - note not found');
    }
    console.log('');

    // 4. Test UPDATE operation
    console.log('4️⃣ Testing UPDATE operation...');
    const updateData = {
      title: 'Updated Test Note',
      content: '<p>This is updated content</p>',
      updatedAt: new Date(),
    };

    const updateResult = await db.collection('notes').findOneAndUpdate(
      {
        _id: noteId,
        userId: testUser._id,
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    console.log('Update result type:', typeof updateResult);
    console.log('Update result keys:', updateResult ? Object.keys(updateResult) : 'null');
    
    if (updateResult) {
      console.log('✅ UPDATE operation successful');
      console.log(`   New title: ${updateResult.title}`);
      console.log(`   New content: ${updateResult.content}`);
    } else {
      console.log('❌ UPDATE operation failed - note not found');
    }
    console.log('');

    // 5. Verify the update
    console.log('5️⃣ Verifying update...');
    const verifyNote = await db.collection('notes').findOne({ _id: noteId });
    if (verifyNote) {
      console.log('✅ Verification successful');
      console.log(`   Title: ${verifyNote.title}`);
      console.log(`   Content: ${verifyNote.content}`);
    }
    console.log('');

    // 6. Test DELETE operation
    console.log('6️⃣ Testing DELETE operation...');
    const deleteResult = await db.collection('notes').deleteOne({
      _id: noteId,
      userId: testUser._id,
    });

    if (deleteResult.deletedCount > 0) {
      console.log('✅ DELETE operation successful');
    } else {
      console.log('❌ DELETE operation failed');
    }
    console.log('');

    // 7. Verify deletion
    console.log('7️⃣ Verifying deletion...');
    const deletedNote = await db.collection('notes').findOne({ _id: noteId });
    if (!deletedNote) {
      console.log('✅ Note successfully deleted');
    } else {
      console.log('❌ Note still exists after deletion');
    }

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

testNoteOperations();
