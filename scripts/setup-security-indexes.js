/**
 * Setup MongoDB indexes for security notification collections
 * Run this script once to create the necessary indexes
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'test';

async function setupIndexes() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Create indexes for admin_devices collection
    console.log('\nCreating indexes for admin_devices collection...');
    const devicesCollection = db.collection('admin_devices');
    
    await devicesCollection.createIndex(
      { fingerprint: 1 },
      { unique: true, name: 'fingerprint_unique' }
    );
    console.log('✓ Created unique index on fingerprint');
    
    await devicesCollection.createIndex(
      { email: 1 },
      { name: 'email_index' }
    );
    console.log('✓ Created index on email');
    
    await devicesCollection.createIndex(
      { lastSeen: 1 },
      { name: 'lastSeen_index' }
    );
    console.log('✓ Created index on lastSeen (for cleanup)');
    
    // Create indexes for security_notifications collection
    console.log('\nCreating indexes for security_notifications collection...');
    const notificationsCollection = db.collection('security_notifications');
    
    await notificationsCollection.createIndex(
      { key: 1 },
      { unique: true, name: 'key_unique' }
    );
    console.log('✓ Created unique index on key');
    
    await notificationsCollection.createIndex(
      { updatedAt: 1 },
      { name: 'updatedAt_index' }
    );
    console.log('✓ Created index on updatedAt (for cleanup)');
    
    console.log('\n✅ All indexes created successfully!');
    
    // Show collection stats
    console.log('\n📊 Collection Stats:');
    const devicesCount = await devicesCollection.countDocuments();
    console.log(`admin_devices: ${devicesCount} documents`);
    
    const notificationsCount = await notificationsCollection.countDocuments();
    console.log(`security_notifications: ${notificationsCount} documents`);
    
  } catch (error) {
    console.error('❌ Error setting up indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

setupIndexes();
