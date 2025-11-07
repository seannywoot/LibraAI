/**
 * Initialize Conversations Database
 * 
 * This script creates the necessary indexes for the conversations collection.
 * Run this script once to set up the database for chat persistence.
 * 
 * Usage: node scripts/init-conversations-db.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const COLLECTION_NAME = 'conversations';

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

async function initConversationsDb() {
  loadEnv();
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
  
  if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in environment variables');
    console.error('💡 Make sure you have a .env.local file with MONGODB_URI set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    console.log(`\n📊 Setting up indexes for '${COLLECTION_NAME}' collection...`);

    // Create index on userId for efficient user-specific queries
    console.log('  Creating index: userId_1');
    await collection.createIndex(
      { userId: 1 },
      { name: 'userId_1' }
    );
    console.log('  ✅ Index created: userId_1');

    // Create index on conversationId for unique identification
    console.log('  Creating index: conversationId_1');
    await collection.createIndex(
      { conversationId: 1 },
      { name: 'conversationId_1' }
    );
    console.log('  ✅ Index created: conversationId_1');

    // Create compound index on userId and lastUpdated for efficient sorting
    console.log('  Creating index: userId_1_lastUpdated_-1');
    await collection.createIndex(
      { userId: 1, lastUpdated: -1 },
      { name: 'userId_1_lastUpdated_-1' }
    );
    console.log('  ✅ Index created: userId_1_lastUpdated_-1');

    // Verify all indexes were created
    console.log('\n🔍 Verifying indexes...');
    const indexes = await collection.indexes();
    
    console.log('\n📋 Current indexes:');
    indexes.forEach(idx => {
      const keys = Object.keys(idx.key).map(k => `${k}: ${idx.key[k]}`).join(', ');
      console.log(`  - ${idx.name}: { ${keys} }`);
    });

    const requiredIndexes = ['userId_1', 'conversationId_1', 'userId_1_lastUpdated_-1'];
    const indexNames = indexes.map(idx => idx.name);
    const missingIndexes = requiredIndexes.filter(name => !indexNames.includes(name));

    if (missingIndexes.length > 0) {
      console.error('\n❌ Missing indexes:', missingIndexes);
      process.exit(1);
    }

    console.log('\n✅ All required indexes verified successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Conversations database initialized');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Next steps:');
    console.log('  1. Implement the API endpoints for conversations');
    console.log('  2. Update the ChatInterface component');
    console.log('  3. Test the chat persistence feature');

  } catch (error) {
    console.error('\n❌ Error initializing conversations database:', error.message);
    console.error('\n🔍 Details:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
initConversationsDb();
