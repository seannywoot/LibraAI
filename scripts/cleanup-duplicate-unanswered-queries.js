/**
 * Cleanup Duplicate Unanswered Queries
 * 
 * This script merges duplicate unanswered query entries into single entries
 * with correct totalAttempts count.
 * 
 * Run with: node scripts/cleanup-duplicate-unanswered-queries.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error('Please make sure .env.local file exists with MONGODB_URI');
  process.exit(1);
}

async function cleanupDuplicates() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('unanswered_queries');
    
    // Find all duplicate groups (same userId + query + conversationId)
    const duplicates = await collection.aggregate([
      {
        $match: { resolved: false }
      },
      {
        $group: {
          _id: {
            userId: '$userId',
            query: { $toLower: '$query' }, // Case-insensitive grouping
            conversationId: '$conversationId'
          },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } } // Only groups with duplicates
      }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} groups with duplicates`);
    
    let totalMerged = 0;
    let totalDeleted = 0;
    
    for (const group of duplicates) {
      const docs = group.docs;
      
      // Sort by timestamp (oldest first)
      docs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Keep the first (oldest) entry
      const keepDoc = docs[0];
      const deleteIds = docs.slice(1).map(d => d._id);
      
      // Calculate total attempts
      const totalAttempts = docs.reduce((sum, doc) => sum + (doc.totalAttempts || 1), 0);
      
      // Get timestamps
      const firstAttempt = docs[0].firstAttemptTimestamp || docs[0].timestamp;
      const lastAttempt = docs[docs.length - 1].lastAttemptTimestamp || docs[docs.length - 1].timestamp;
      
      console.log(`\nMerging: "${keepDoc.query}"`);
      console.log(`  User: ${keepDoc.userName}`);
      console.log(`  Duplicates: ${docs.length}`);
      console.log(`  Total Attempts: ${totalAttempts}`);
      
      // Update the kept document
      await collection.updateOne(
        { _id: keepDoc._id },
        {
          $set: {
            totalAttempts,
            attemptNumber: totalAttempts,
            firstAttemptTimestamp: firstAttempt,
            lastAttemptTimestamp: lastAttempt
          }
        }
      );
      
      // Delete the duplicate documents
      const deleteResult = await collection.deleteMany({
        _id: { $in: deleteIds }
      });
      
      totalMerged++;
      totalDeleted += deleteResult.deletedCount;
      
      console.log(`  ✓ Merged into 1 entry, deleted ${deleteResult.deletedCount} duplicates`);
    }
    
    console.log('\n=== Cleanup Summary ===');
    console.log(`Groups merged: ${totalMerged}`);
    console.log(`Duplicate entries deleted: ${totalDeleted}`);
    console.log(`✓ Cleanup complete!`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupDuplicates().catch(console.error);
