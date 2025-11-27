/**
 * Quick script to check Pride and Prejudice view count
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
const DB_NAME = process.env.MONGODB_DB_NAME || 'test';

async function checkPrideViews() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const interactions = db.collection('user_interactions');

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Count all Pride and Prejudice views in last 30 days
        const prideViewsCount = await interactions.countDocuments({
            eventType: 'view',
            bookTitle: 'Pride and Prejudice',
            timestamp: { $gte: thirtyDaysAgo }
        });

        console.log(`\n📊 Pride and Prejudice Views (Last 30 Days): ${prideViewsCount}`);

        // Get the most recent view
        const latestView = await interactions.findOne(
            {
                eventType: 'view',
                bookTitle: 'Pride and Prejudice'
            },
            { sort: { timestamp: -1 } }
        );

        if (latestView) {
            console.log(`\n🕐 Latest view:`);
            console.log(`   User: ${latestView.userEmail}`);
            console.log(`   Time: ${latestView.timestamp}`);
            console.log(`   BookID: ${latestView.bookId}`);
        }

        // Check your specific user's views
        const yourViews = await interactions.find({
            eventType: 'view',
            userEmail: 'seannpatrick25@gmail.com',
            bookTitle: 'Pride and Prejudice'
        }).sort({ timestamp: -1 }).toArray();

        console.log(`\n👤 Your views of Pride and Prejudice: ${yourViews.length}`);
        yourViews.forEach((view, i) => {
            console.log(`   ${i + 1}. ${view.timestamp}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkPrideViews();
