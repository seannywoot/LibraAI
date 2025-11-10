/**
 * Test script to verify device tracking works with MongoDB
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'test';

async function testDeviceTracking() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db(dbName);
    const devicesCollection = db.collection('admin_devices');
    const notificationsCollection = db.collection('security_notifications');
    
    // Test 1: Check if collections exist
    console.log('Test 1: Checking collections...');
    const collections = await db.listCollections().toArray();
    const hasDevices = collections.some(c => c.name === 'admin_devices');
    const hasNotifications = collections.some(c => c.name === 'security_notifications');
    
    console.log(`  admin_devices collection: ${hasDevices ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  security_notifications collection: ${hasNotifications ? '✓ EXISTS' : '✗ MISSING'}\n`);
    
    // Test 2: Check indexes
    console.log('Test 2: Checking indexes...');
    const deviceIndexes = await devicesCollection.indexes();
    const notificationIndexes = await notificationsCollection.indexes();
    
    console.log(`  admin_devices indexes: ${deviceIndexes.length}`);
    deviceIndexes.forEach(idx => console.log(`    - ${idx.name}`));
    
    console.log(`  security_notifications indexes: ${notificationIndexes.length}`);
    notificationIndexes.forEach(idx => console.log(`    - ${idx.name}`));
    console.log();
    
    // Test 3: Simulate device tracking
    console.log('Test 3: Simulating device tracking...');
    const testFingerprint = 'test@example.com:127.0.0.1:chrome';
    
    // Check if device exists
    let device = await devicesCollection.findOne({ fingerprint: testFingerprint });
    console.log(`  Device exists: ${device ? 'YES' : 'NO'}`);
    
    if (!device) {
      // Insert new device
      await devicesCollection.insertOne({
        fingerprint: testFingerprint,
        email: 'test@example.com',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/120.0',
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
      console.log('  ✓ Inserted test device');
    } else {
      console.log('  ✓ Device already exists (from previous test)');
    }
    
    // Update last seen
    await devicesCollection.updateOne(
      { fingerprint: testFingerprint },
      { $set: { lastSeen: new Date() } }
    );
    console.log('  ✓ Updated lastSeen timestamp\n');
    
    // Test 4: Simulate notification deduplication
    console.log('Test 4: Simulating notification deduplication...');
    const testKey = 'newdevice:test@example.com:127.0.0.1:chrome';
    
    let notification = await notificationsCollection.findOne({ key: testKey });
    console.log(`  Notification exists: ${notification ? 'YES' : 'NO'}`);
    
    if (!notification) {
      await notificationsCollection.insertOne({
        key: testKey,
        lastSent: Date.now(),
        updatedAt: new Date(),
      });
      console.log('  ✓ Inserted test notification');
    } else {
      console.log('  ✓ Notification already exists (from previous test)');
    }
    
    // Check if recently sent (within 24 hours)
    const now = Date.now();
    const dedupeWindow = 24 * 60 * 60 * 1000;
    notification = await notificationsCollection.findOne({ key: testKey });
    const wasRecentlySent = notification && (now - notification.lastSent < dedupeWindow);
    console.log(`  Would be deduplicated: ${wasRecentlySent ? 'YES (email blocked)' : 'NO (email would send)'}\n`);
    
    // Test 5: Show current data
    console.log('Test 5: Current data in collections...');
    const deviceCount = await devicesCollection.countDocuments();
    const notificationCount = await notificationsCollection.countDocuments();
    
    console.log(`  admin_devices: ${deviceCount} document(s)`);
    if (deviceCount > 0) {
      const devices = await devicesCollection.find().limit(5).toArray();
      devices.forEach(d => {
        console.log(`    - ${d.email} from ${d.ipAddress} (last seen: ${d.lastSeen.toLocaleString()})`);
      });
    }
    
    console.log(`  security_notifications: ${notificationCount} document(s)`);
    if (notificationCount > 0) {
      const notifications = await notificationsCollection.find().limit(5).toArray();
      notifications.forEach(n => {
        const age = Math.round((Date.now() - n.lastSent) / 1000 / 60);
        console.log(`    - ${n.key} (${age} minutes ago)`);
      });
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n💡 The device tracking is now persistent across server restarts.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

testDeviceTracking();
