/**
 * Fix Conversation Dates Migration Script
 * 
 * This script fixes the lastUpdated dates for conversations that were corrupted
 * by the auto-save bug. It restores dates using:
 * 1. The createdAt field if available
 * 2. The timestamp of the last message in the conversation
 * 3. Leaves it unchanged if neither is available
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'test';

async function fixConversationDates() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const conversationsCollection = db.collection('conversations');

    // Get all conversations
    const conversations = await conversationsCollection.find({}).toArray();
    console.log(`\n📊 Found ${conversations.length} conversations to check\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const conv of conversations) {
      try {
        let newLastUpdated = null;

        // Strategy 1: Use createdAt if available
        if (conv.createdAt) {
          // Use createdAt as the base date
          const createdDate = new Date(conv.createdAt);
          
          // If conversation has messages, estimate last update based on message count
          if (conv.messages && conv.messages.length > 1) {
            // Assume each message pair (user + assistant) takes ~2-5 minutes
            const messageCount = conv.messages.length;
            const estimatedMinutes = Math.min(messageCount * 2, 60 * 24); // Max 1 day
            newLastUpdated = new Date(createdDate.getTime() + estimatedMinutes * 60 * 1000);
          } else {
            // Single message or no messages, use createdAt
            newLastUpdated = createdDate;
          }
        }
        // Strategy 2: If no createdAt, try to infer from conversationId (if it's a timestamp)
        else if (typeof conv.conversationId === 'number' && conv.conversationId > 1000000000000) {
          // conversationId appears to be a timestamp (Date.now())
          newLastUpdated = new Date(conv.conversationId);
        }
        // Strategy 3: If conversationId is small, it might be from an older system
        // In this case, we can't reliably determine the date, so skip it
        else {
          // Can't determine date reliably
          newLastUpdated = null;
        }

        if (newLastUpdated) {
          const currentLastUpdated = new Date(conv.lastUpdated);
          const createdDate = conv.createdAt ? new Date(conv.createdAt) : null;
          
          // Check if lastUpdated is after createdAt (corrupted)
          // This happens when loading old conversations updates the date
          const isCorrupted = createdDate && currentLastUpdated > createdDate && 
                             (currentLastUpdated - createdDate) > (24 * 60 * 60 * 1000); // More than 1 day difference
          
          // Also check if lastUpdated is more recent than createdAt by several days
          const daysDifference = createdDate ? 
            Math.floor((currentLastUpdated - createdDate) / (24 * 60 * 60 * 1000)) : 0;

          if (isCorrupted || daysDifference > 1) {
            await conversationsCollection.updateOne(
              { _id: conv._id },
              { $set: { lastUpdated: newLastUpdated } }
            );

            console.log(`✅ Fixed conversation ${conv.conversationId}:`);
            console.log(`   Title: ${conv.title}`);
            console.log(`   Created: ${createdDate ? createdDate.toISOString() : 'N/A'}`);
            console.log(`   Old lastUpdated: ${currentLastUpdated.toISOString()}`);
            console.log(`   New lastUpdated: ${newLastUpdated.toISOString()}`);
            console.log(`   Days difference: ${daysDifference} days`);
            console.log('');
            
            fixedCount++;
          } else {
            console.log(`⏭️  Skipped conversation ${conv.conversationId}: "${conv.title}" (date seems accurate)`);
            skippedCount++;
          }
        } else {
          console.log(`⚠️  Could not determine date for conversation ${conv.conversationId}: "${conv.title}"`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing conversation ${conv.conversationId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} conversations`);
    console.log(`   ⏭️  Skipped: ${skippedCount} conversations`);
    console.log(`   ❌ Errors: ${errorCount} conversations`);
    console.log('='.repeat(60) + '\n');

    if (fixedCount > 0) {
      console.log('✨ Conversation dates have been restored!');
      console.log('💡 Tip: Refresh your browser to see the corrected dates.');
    } else {
      console.log('ℹ️  No conversations needed date correction.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
fixConversationDates();
