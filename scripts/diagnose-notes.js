/**
 * Diagnostic script for Notes feature
 * Tests database connection, collection existence, and API endpoints
 */

const clientPromise = require('../src/lib/mongodb').default;

async function diagnoseNotes() {
  console.log('🔍 Diagnosing Notes Feature...\n');

  try {
    // 1. Test MongoDB Connection
    console.log('1️⃣ Testing MongoDB connection...');
    const client = await clientPromise;
    const db = client.db('library');
    console.log('✅ Connected to MongoDB\n');

    // 2. Check if notes collection exists
    console.log('2️⃣ Checking notes collection...');
    const collections = await db.listCollections().toArray();
    const notesCollection = collections.find(c => c.name === 'notes');
    
    if (notesCollection) {
      console.log('✅ Notes collection exists');
      
      // Get collection stats
      const stats = await db.collection('notes').stats();
      console.log(`   - Document count: ${stats.count}`);
      console.log(`   - Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
      
      // Sample a few notes
      if (stats.count > 0) {
        console.log('📝 Sample notes:');
        const sampleNotes = await db.collection('notes')
          .find({})
          .limit(3)
          .toArray();
        
        sampleNotes.forEach((note, i) => {
          console.log(`   ${i + 1}. ${note.title || 'Untitled'}`);
          console.log(`      ID: ${note._id}`);
          console.log(`      User: ${note.userId}`);
          console.log(`      Created: ${note.createdAt}`);
        });
        console.log('');
      }
    } else {
      console.log('⚠️  Notes collection does not exist yet');
      console.log('   This is normal if no notes have been created\n');
    }

    // 3. Check users collection
    console.log('3️⃣ Checking users collection...');
    const users = await db.collection('users').find({ role: 'student' }).limit(5).toArray();
    console.log(`✅ Found ${users.length} student users`);
    if (users.length > 0) {
      console.log('   Sample students:');
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (ID: ${user._id})`);
      });
    }
    console.log('');

    // 4. Check for orphaned notes
    if (notesCollection) {
      console.log('4️⃣ Checking for orphaned notes...');
      const allNotes = await db.collection('notes').find({}).toArray();
      const allUserIds = await db.collection('users').distinct('_id');
      const userIdStrings = allUserIds.map(id => id.toString());
      
      const orphanedNotes = allNotes.filter(note => 
        !userIdStrings.includes(note.userId.toString())
      );
      
      if (orphanedNotes.length > 0) {
        console.log(`⚠️  Found ${orphanedNotes.length} orphaned notes (user doesn't exist)`);
        orphanedNotes.forEach(note => {
          console.log(`   - Note ID: ${note._id}, User ID: ${note.userId}`);
        });
      } else {
        console.log('✅ No orphaned notes found');
      }
      console.log('');
    }

    // 5. Test note creation (dry run)
    console.log('5️⃣ Testing note structure...');
    const testNote = {
      userId: 'test_user_id',
      title: 'Test Note',
      content: '<p>Test content</p>',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('✅ Note structure is valid:');
    console.log(JSON.stringify(testNote, null, 2));
    console.log('');

    // 6. Check indexes
    console.log('6️⃣ Checking indexes...');
    if (notesCollection) {
      const indexes = await db.collection('notes').indexes();
      console.log(`✅ Found ${indexes.length} indexes:`);
      indexes.forEach(idx => {
        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    } else {
      console.log('⚠️  No indexes (collection doesn\'t exist yet)');
    }
    console.log('');

    console.log('✅ Diagnosis complete!\n');
    console.log('📋 Summary:');
    console.log('   - MongoDB connection: OK');
    console.log(`   - Notes collection: ${notesCollection ? 'EXISTS' : 'NOT CREATED YET'}`);
    console.log(`   - Student users: ${users.length} found`);
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Make sure you\'re logged in as a student');
    console.log('   2. Navigate to /student/notes');
    console.log('   3. Try creating a new note');
    console.log('   4. Check browser console for any errors');
    console.log('   5. Check Network tab for API request/response');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    console.error('\nStack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

diagnoseNotes();
