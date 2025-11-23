/**
 * Find all conversations in the database and show their userIds
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

async function findConversations() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected\n');

        const db = client.db();
        const conversationsCollection = db.collection('conversations');

        // Get total count
        const total = await conversationsCollection.countDocuments();
        console.log(`📊 Total conversations: ${total}\n`);

        if (total === 0) {
            console.log('❌ No conversations found in database!');
            console.log('\nThis means your conversations were likely deleted or never migrated.');
            console.log('\nCheck localStorage in your browser:');
            console.log('  1. Open DevTools (F12)');
            console.log('  2. Go to Application tab');
            console.log('  3. Look for "chatHistory" in Local Storage');
        } else {
            // Get all conversations
            const conversations = await conversationsCollection.find({}).toArray();

            // Group by userId
            const byUser = {};
            conversations.forEach(conv => {
                const uid = String(conv.userId);
                if (!byUser[uid]) {
                    byUser[uid] = [];
                }
                byUser[uid].push(conv);
            });

            console.log('👥 Conversations grouped by userId:\n');
            for (const [userId, convs] of Object.entries(byUser)) {
                console.log(`📧 User: ${userId}`);
                console.log(`   Conversations: ${convs.length}`);
                convs.slice(0, 3).forEach((c, idx) => {
                    console.log(`   ${idx + 1}. Title: "${c.title || 'No title'}" (ID: ${c.conversationId})`);
                });
                if (convs.length > 3) {
                    console.log(`   ... and ${convs.length - 3} more`);
                }
                console.log('');
            }

            console.log('\n🔍 Your current session userId: 69070863dc3013a06fd0ccef');
            const yourConvs = conversations.filter(c => String(c.userId) === '69070863dc3013a06fd0ccef');
            console.log(`📌 Conversations matching your userId: ${yourConvs.length}`);

            if (yourConvs.length === 0 && total > 0) {
                console.log('\n⚠️  ISSUE FOUND:');
                console.log('   You have conversations in the database, but none match your current userId!');
                console.log('   This usually happens when:');
                console.log('   1. You logged in with a different account');
                console.log('   2. The userId format changed (email vs ID)');
                console.log('   3. Your user account was recreated');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

findConversations();
