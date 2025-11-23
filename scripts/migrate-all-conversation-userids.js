/**
 * Migrate ALL conversations from email-based userId to ObjectId-based userId
 * This fixes the missing conversation history issue for all users
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateAllConversations() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db();
        const conversationsCollection = db.collection('conversations');
        const usersCollection = db.collection('users');

        // Get all conversations
        const allConversations = await conversationsCollection.find({}).toArray();
        console.log(`📊 Total conversations in database: ${allConversations.length}\n`);

        // Find conversations where userId looks like an email (contains @)
        const emailBasedConversations = allConversations.filter(conv =>
            typeof conv.userId === 'string' && conv.userId.includes('@')
        );

        console.log(`📧 Conversations with email-based userId: ${emailBasedConversations.length}`);

        if (emailBasedConversations.length === 0) {
            console.log('✅ No conversations need migration\n');
            return;
        }

        // Group by email
        const conversationsByEmail = {};
        emailBasedConversations.forEach(conv => {
            const email = conv.userId;
            if (!conversationsByEmail[email]) {
                conversationsByEmail[email] = [];
            }
            conversationsByEmail[email].push(conv);
        });

        console.log(`👥 Unique users to migrate: ${Object.keys(conversationsByEmail).length}\n`);
        console.log('🔄 Starting migration...\n');

        let totalMigrated = 0;
        let totalFailed = 0;
        let usersProcessed = 0;
        let usersNotFound = 0;

        for (const [email, conversations] of Object.entries(conversationsByEmail)) {
            console.log(`\n📧 Processing user: ${email}`);
            console.log(`   Conversations: ${conversations.length}`);

            // Find the user by email
            const user = await usersCollection.findOne({ email: email });

            if (!user) {
                console.log(`   ⚠️  User not found in database - skipping`);
                usersNotFound++;
                totalFailed += conversations.length;
                continue;
            }

            const correctUserId = user._id.toString();
            console.log(`   🆔 ObjectId: ${correctUserId}`);

            // Migrate all conversations for this user
            let migrated = 0;
            let failed = 0;

            for (const conv of conversations) {
                try {
                    await conversationsCollection.updateOne(
                        { _id: conv._id },
                        { $set: { userId: correctUserId } }
                    );
                    migrated++;
                    totalMigrated++;
                } catch (error) {
                    console.log(`   ❌ Failed to migrate conversation: ${error.message}`);
                    failed++;
                    totalFailed++;
                }
            }

            console.log(`   ✅ Migrated: ${migrated}, ❌ Failed: ${failed}`);
            usersProcessed++;
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 MIGRATION SUMMARY:`);
        console.log(`   👥 Users processed: ${usersProcessed}`);
        console.log(`   ⚠️  Users not found: ${usersNotFound}`);
        console.log(`   ✅ Conversations migrated: ${totalMigrated}`);
        console.log(`   ❌ Conversations failed: ${totalFailed}`);
        console.log(`${'='.repeat(60)}\n`);

        if (totalMigrated > 0) {
            console.log('🎉 Migration complete! All users should now see their chat history.\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await client.close();
    }
}

migrateAllConversations();
