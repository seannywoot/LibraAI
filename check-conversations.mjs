// Quick script to check conversations in database
import clientPromise from "./src/lib/mongodb.js";


async function checkConversations() {
    try {
        console.log("🔍 Checking conversations...");

        const client = await clientPromise;
        const db = client.db();
        const conversationsCollection = db.collection("conversations");

        // Get all conversations
        const allConversations = await conversationsCollection.find({}).toArray();
        console.log(`\n📊 Total conversations in database: ${allConversations.length}`);

        // Group by userId
        const byUser = {};
        allConversations.forEach(conv => {
            const uid = conv.userId;
            if (!byUser[uid]) byUser[uid] = [];
            byUser[uid].push(conv);
        });

        console.log(`\n👥 Conversations by user:`);
        for (const [userId, convs] of Object.entries(byUser)) {
            console.log(`  ${userId}: ${convs.length} conversations`);
            convs.forEach(c => {
                console.log(`    - ID: ${c.conversationId}, Title: ${c.title?.substring(0, 50) || 'No title'}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkConversations();
