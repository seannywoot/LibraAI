/**
 * Debug script to check conversations in database
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugConversations() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // List all databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('📚 Available databases:');
    dbs.databases.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    console.log('');

    // Try different possible database names
    const possibleDbNames = [
      'libra-ai',
      'test',
      'admin',
      ...dbs.databases.map(db => db.name)
    ];

    for (const dbName of possibleDbNames) {
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      
      if (collections.length > 0) {
        console.log(`\n📦 Collections in "${dbName}":`);
        for (const coll of collections) {
          const count = await db.collection(coll.name).countDocuments();
          console.log(`   - ${coll.name}: ${count} documents`);
          
          // If it's conversations, show a sample
          if (coll.name === 'conversations' && count > 0) {
            console.log('\n   📄 Sample conversation:');
            const sample = await db.collection(coll.name).findOne({});
            console.log(JSON.stringify(sample, null, 2));
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugConversations();
