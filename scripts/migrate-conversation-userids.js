/**
 * Migrate conversations from email-based userId to ObjectId-based userId
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateConversations() {
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

        // Get the user by email
        const email = 'seannpatrick25@gmail.com';
        const user = await usersCollection.findOne({ email: email });

        if (!user) {
            console.log(`❌ User with email ${email} not found`);
            return;
        }

        const correctUserId = user._id.toString();
        console.log(`📧 Email: ${email}`);
        console.log(`🆔 Correct userId: ${correctUserId}\n`);

        // Find conversations with email as userId
        const emailConversations = await conversationsCollection
            .find({ userId: email })
            .toArray();

        console.log(`📊 Found ${emailConversations.length} conversations with email as userId\n`);

        if (emailConversations.length === 0) {
            console.log('✅ No conversations need migration');
            return;
        }

        console.log('🔄 Starting migration...\n');
        let migrated = 0;
        let failed = 0;

        for (const conv of emailConversations) {
            try {
                await conversationsCollection.updateOne(
                    { _id: conv._id },
                    { $set: { userId: correctUserId } }
                );
                console.log(`✅ Migrated: "${conv.title}" (ID: ${conv.conversationId})`);
                migrated++;
            } catch (error) {
                console.log(`❌ Failed: "${conv.title}" - ${error.message}`);
                failed++;
            }
        }

        console.log(`\n📊 Migration complete:`);
        console.log(`   ✅ Migrated: ${migrated}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`\n🎉 Your conversations should now appear in the chat!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

migrateConversations();
