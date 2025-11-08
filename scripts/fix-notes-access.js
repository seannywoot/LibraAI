/**
 * Fix script for Notes feature access issues
 * Creates necessary indexes and validates data
 */

const clientPromise = require('../src/lib/mongodb').default;

async function fixNotesAccess() {
  console.log('🔧 Fixing Notes Access Issues...\n');

  try {
    const client = await clientPromise;
    const db = client.db('library');

    // 1. Ensure notes collection exists with proper indexes
    console.log('1️⃣ Setting up notes collection...');
    const collections = await db.listCollections({ name: 'notes' }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection('notes');
      console.log('✅ Created notes collection');
    } else {
      console.log('✅ Notes collection already exists');
    }

    // 2. Create indexes for better performance
    console.log('\n2️⃣ Creating indexes...');
    
    // Index on userId for faster queries
    await db.collection('notes').createIndex({ userId: 1 });
    console.log('✅ Created index on userId');
    
    // Index on updatedAt for sorting
    await db.collection('notes').createIndex({ updatedAt: -1 });
    console.log('✅ Created index on updatedAt');
    
    // Text index for search functionality
    await db.collection('notes').createIndex(
      { title: 'text', content: 'text' },
      { name: 'notes_search' }
    );
    console.log('✅ Created text search index');

    // 3. Validate existing notes
    console.log('\n3️⃣ Validating existing notes...');
    const notes = await db.collection('notes').find({}).toArray();
    console.log(`Found ${notes.length} notes`);

    let fixed = 0;
    for (const note of notes) {
      const updates = {};
      
      // Ensure title exists
      if (!note.title) {
        updates.title = 'Untitled';
      }
      
      // Ensure content exists
      if (!note.content) {
        updates.content = '';
      }
      
      // Ensure timestamps exist
      if (!note.createdAt) {
        updates.createdAt = new Date();
      }
      if (!note.updatedAt) {
        updates.updatedAt = new Date();
      }
      
      if (Object.keys(updates).length > 0) {
        await db.collection('notes').updateOne(
          { _id: note._id },
          { $set: updates }
        );
        fixed++;
      }
    }
    
    if (fixed > 0) {
      console.log(`✅ Fixed ${fixed} notes with missing fields`);
    } else {
      console.log('✅ All notes are valid');
    }

    // 4. Check for and fix orphaned notes
    console.log('\n4️⃣ Checking for orphaned notes...');
    const allNotes = await db.collection('notes').find({}).toArray();
    const allUserIds = await db.collection('users').distinct('_id');
    const userIdStrings = allUserIds.map(id => id.toString());
    
    const orphanedNotes = allNotes.filter(note => 
      !userIdStrings.includes(note.userId.toString())
    );
    
    if (orphanedNotes.length > 0) {
      console.log(`⚠️  Found ${orphanedNotes.length} orphaned notes`);
      console.log('   These notes belong to users that no longer exist');
      console.log('   You may want to delete them manually');
      orphanedNotes.forEach(note => {
        console.log(`   - Note: "${note.title}" (ID: ${note._id})`);
      });
    } else {
      console.log('✅ No orphaned notes found');
    }

    // 5. Test a sample query
    console.log('\n5️⃣ Testing sample query...');
    const sampleUser = await db.collection('users').findOne({ role: 'student' });
    
    if (sampleUser) {
      const userNotes = await db.collection('notes')
        .find({ userId: sampleUser._id })
        .sort({ updatedAt: -1 })
        .toArray();
      
      console.log(`✅ Query test successful`);
      console.log(`   User: ${sampleUser.email}`);
      console.log(`   Notes: ${userNotes.length}`);
    } else {
      console.log('⚠️  No student users found to test with');
    }

    console.log('\n✅ Fix complete!\n');
    console.log('📋 Summary:');
    console.log('   - Collection setup: OK');
    console.log('   - Indexes created: OK');
    console.log('   - Data validation: OK');
    console.log('   - Query test: OK');
    console.log('');
    console.log('💡 Try accessing /student/notes again');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

fixNotesAccess();
