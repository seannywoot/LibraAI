/**
 * Migration Script: Fix Conversation Timestamps
 * 
 * This script fixes conversation lastUpdated timestamps by using the conversationId
 * (which is a Unix timestamp) as the conversation date.
 * 
 * Run with: node scripts/fix-conversation-timestamps.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixConversationTimestamps() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB');

        const db = client.db();
        const conversationsCollection = db.collection('conversations');

        // Get all conversations
        const conversations = await conversationsCollection.find({}).toArray();
        console.log(`📊 Found ${conversations.length} total conversations`);

        let updatedCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const conv of conversations) {
            try {
                if (!conv.messages || conv.messages.length === 0) {
                    console.warn(`⚠️  Skipping conversation ${conv.conversationId} (no messages)`);
                    skippedCount++;
                    continue;
                }

                // The conversationId is a Unix timestamp in milliseconds
                // Use it as the conversation creation/last update time
                const conversationTimestamp = new Date(conv.conversationId);

                if (isNaN(conversationTimestamp.getTime())) {
                    console.warn(`⚠️  Skipping conversation ${conv.conversationId} (invalid conversationId as timestamp)`);
                    skippedCount++;
                    continue;
                }

                // Update the conversation's lastUpdated to match the conversationId timestamp
                await conversationsCollection.updateOne(
                    {
                        _id: conv._id
                    },
                    {
                        $set: {
                            lastUpdated: conversationTimestamp
                        }
                    }
                );

                console.log(`✅ Fixed conversation ${conv.conversationId} - ${conv.title.substring(0, 50)}...`);
                console.log(`   Old: ${conv.lastUpdated} | New: ${conversationTimestamp}`);
                updatedCount++;
            } catch (error) {
                console.error(`❌ Error fixing conversation ${conv.conversationId}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📋 Migration Summary:');
        console.log(`   Total conversations: ${conversations.length}`);
        console.log(`   ✅ Successfully updated: ${updatedCount}`);
        console.log(`   ⚠️  Skipped: ${skippedCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the migration
fixConversationTimestamps()
    .then(() => {
        console.log('\n✨ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
