/**
 * Debug script to investigate book view tracking issues
 * 
 * This script queries the database to understand why book views are tracked
 * but not appearing in the Top Items section.
 * 
 * Run with: node debug-view-tracking.js
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
const DB_NAME = process.env.MONGODB_DB_NAME || 'test';

if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found in .env.local');
    console.error('   Please make sure .env.local exists and contains MONGODB_URI');
    process.exit(1);
}

async function debugViewTracking() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(DB_NAME);
        const interactions = db.collection('user_interactions');

        // Step 1: Check user's recent views
        console.log('📊 Step 1: Checking recent views for seannpatrick25@gmail.com...');
        const userViews = await interactions
            .find({
                userEmail: 'seannpatrick25@gmail.com',
                eventType: 'view'
            })
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        console.log(`Found ${userViews.length} view(s):`);
        userViews.forEach((view, i) => {
            console.log(`  ${i + 1}. "${view.bookTitle || 'NO TITLE'}" by ${view.bookAuthor || 'NO AUTHOR'}`);
            console.log(`     - bookId: ${view.bookId || 'MISSING'}`);
            console.log(`     - timestamp: ${view.timestamp}`);
        });
        console.log('');

        // Step 2: Check Pride and Prejudice specifically
        console.log('📚 Step 2: Checking all views for "Pride and Prejudice"...');
        const prideViews = await interactions
            .find({
                eventType: 'view',
                bookTitle: 'Pride and Prejudice'
            })
            .toArray();

        console.log(`Found ${prideViews.length} total view(s) for Pride and Prejudice`);
        if (prideViews.length > 0) {
            console.log('Sample view data:');
            console.log(JSON.stringify(prideViews[0], null, 2));
        }
        console.log('');

        // Step 3: Run the same aggregation as the analytics endpoint
        console.log('📈 Step 3: Running Top Books aggregation (last 30 days)...');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const topBooks = await interactions.aggregate([
            {
                $match: {
                    eventType: 'view',
                    timestamp: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: '$bookId',
                    title: { $first: '$bookTitle' },
                    author: { $first: '$bookAuthor' },
                    viewCount: { $sum: 1 }
                }
            },
            { $sort: { viewCount: -1 } },
            { $limit: 10 }
        ]).toArray();

        console.log(`Top ${topBooks.length} books by views:`);
        topBooks.forEach((book, i) => {
            console.log(`  ${i + 1}. "${book.title || 'Unknown'}" by ${book.author || 'Unknown'} - ${book.viewCount} views`);
            console.log(`     - bookId: ${book._id}`);
        });
        console.log('');

        // Step 4: Check for missing critical fields
        console.log('🔍 Step 4: Checking for views with missing critical fields...');
        const missingFields = await interactions
            .find({
                eventType: 'view',
                $or: [
                    { bookId: { $exists: false } },
                    { bookId: null },
                    { bookId: '' },
                    { bookTitle: { $exists: false } },
                    { bookTitle: null },
                    { bookTitle: '' }
                ]
            })
            .toArray();

        console.log(`Found ${missingFields.length} view(s) with missing bookId or bookTitle`);
        if (missingFields.length > 0) {
            console.log('Sample problematic record:');
            console.log(JSON.stringify(missingFields[0], null, 2));
        }
        console.log('');

        // Step 5: Check total view count in last 30 days
        console.log('📊 Step 5: Total view statistics...');
        const totalViews = await interactions.countDocuments({
            eventType: 'view',
            timestamp: { $gte: thirtyDaysAgo }
        });

        const uniqueBooks = await interactions.distinct('bookId', {
            eventType: 'view',
            timestamp: { $gte: thirtyDaysAgo }
        });

        console.log(`Total views in last 30 days: ${totalViews}`);
        console.log(`Unique books viewed: ${uniqueBooks.length}`);
        console.log('');

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 SUMMARY & RECOMMENDATIONS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const isPrideInTop10 = topBooks.some(b => b.title === 'Pride and Prejudice');

        if (prideViews.length === 0) {
            console.log('❌ ISSUE: No views found for "Pride and Prejudice"');
            console.log('   → The view tracking may have failed or used a different title');
            console.log('   → Check if the book exists and the title matches exactly');
        } else if (!isPrideInTop10) {
            const prideViewsLast30Days = prideViews.filter(v => v.timestamp >= thirtyDaysAgo).length;
            console.log(`⚠️  ISSUE: "Pride and Prejudice" has ${prideViewsLast30Days} view(s) in last 30 days but is NOT in top 10`);
            console.log(`   → There are ${uniqueBooks.length} unique books viewed`);
            console.log('   → Either:');
            console.log('      a) There are 10+ other books with more views');
            console.log('      b) The views are older than 30 days');
            console.log('      c) The bookId/bookTitle is inconsistent');
        } else {
            console.log('✅ "Pride and Prejudice" IS in the top 10!');
            console.log('   → The dashboard should be displaying it');
            console.log('   → Try refreshing the dashboard or checking for caching issues');
        }

        if (missingFields.length > 0) {
            console.log(`⚠️  WARNING: ${missingFields.length} view record(s) have missing bookId or bookTitle`);
            console.log('   → These views won\'t appear in analytics');
            console.log('   → Check the track-view endpoint implementation');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

// Run the debug script
debugViewTracking().catch(console.error);
