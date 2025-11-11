/**
 * Verify Interaction Tracking
 * 
 * This script checks if user interactions are being properly tracked and stored.
 * 
 * Usage: node scripts/verify-interaction-tracking.js [userEmail]
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function verifyInteractionTracking(userEmail = null) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");

    // Check if collection exists
    const collections = await db.listCollections({ name: "user_interactions" }).toArray();
    if (collections.length === 0) {
      console.log("❌ Collection 'user_interactions' does not exist!");
      console.log("   This means no interactions have been tracked yet.\n");
      return;
    }

    console.log("✓ Collection 'user_interactions' exists\n");

    // Get total interaction count
    const totalCount = await interactions.countDocuments();
    console.log(`📊 Total Interactions: ${totalCount}`);

    if (totalCount === 0) {
      console.log("\n⚠️  No interactions found in database!");
      console.log("   Possible reasons:");
      console.log("   1. Users haven't viewed any books yet");
      console.log("   2. Users haven't searched for books yet");
      console.log("   3. Tracking API is not being called");
      console.log("   4. Tracking API is failing silently\n");
      return;
    }

    // Get interaction breakdown by type
    const byType = await interactions.aggregate([
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    console.log("\n📈 Interactions by Type:");
    console.log("─".repeat(50));
    byType.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    // Get recent interactions
    console.log("\n🕐 Recent Interactions (Last 10):");
    console.log("─".repeat(80));
    
    const recent = await interactions
      .find()
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    if (recent.length === 0) {
      console.log("  No recent interactions found");
    } else {
      recent.forEach((int, idx) => {
        const time = new Date(int.timestamp).toLocaleString();
        console.log(`\n${idx + 1}. ${int.eventType.toUpperCase()} - ${time}`);
        console.log(`   User: ${int.userEmail}`);
        
        if (int.eventType === "view") {
          console.log(`   Book: ${int.bookTitle} by ${int.bookAuthor}`);
          console.log(`   Categories: ${int.bookCategories?.join(", ") || "None"}`);
        } else if (int.eventType === "search") {
          console.log(`   Query: "${int.searchQuery}"`);
          if (int.searchFilters && Object.keys(int.searchFilters).length > 0) {
            console.log(`   Filters: ${JSON.stringify(int.searchFilters)}`);
          }
        }
      });
    }

    // If specific user email provided
    if (userEmail) {
      console.log(`\n\n👤 Interactions for ${userEmail}:`);
      console.log("─".repeat(80));

      const user = await users.findOne({ email: userEmail });
      if (!user) {
        console.log(`  ⚠️  User not found: ${userEmail}`);
        return;
      }

      const userInteractions = await interactions
        .find({ userId: user._id })
        .sort({ timestamp: -1 })
        .toArray();

      console.log(`  Total: ${userInteractions.length} interactions`);

      if (userInteractions.length === 0) {
        console.log(`  ⚠️  No interactions found for this user`);
        console.log(`     User exists but hasn't interacted with any books yet`);
      } else {
        // Group by type
        const userByType = {};
        userInteractions.forEach(int => {
          userByType[int.eventType] = (userByType[int.eventType] || 0) + 1;
        });

        console.log("\n  Breakdown:");
        Object.entries(userByType).forEach(([type, count]) => {
          console.log(`    ${type}: ${count}`);
        });

        // Show last 5
        console.log("\n  Last 5 interactions:");
        userInteractions.slice(0, 5).forEach((int, idx) => {
          const time = new Date(int.timestamp).toLocaleString();
          console.log(`    ${idx + 1}. ${int.eventType} - ${time}`);
          if (int.eventType === "view") {
            console.log(`       Book: ${int.bookTitle}`);
          } else if (int.eventType === "search") {
            console.log(`       Query: "${int.searchQuery}"`);
          }
        });
      }
    }

    // Check for tracking issues
    console.log("\n\n🔍 Diagnostic Checks:");
    console.log("─".repeat(80));

    // Check for interactions without user info
    const missingUser = await interactions.countDocuments({ 
      $or: [
        { userId: { $exists: false } },
        { userEmail: { $exists: false } }
      ]
    });
    
    if (missingUser > 0) {
      console.log(`  ⚠️  ${missingUser} interactions missing user information`);
    } else {
      console.log(`  ✓ All interactions have user information`);
    }

    // Check for view interactions without book info
    const missingBookInfo = await interactions.countDocuments({ 
      eventType: "view",
      $or: [
        { bookTitle: { $exists: false } },
        { bookAuthor: { $exists: false } }
      ]
    });
    
    if (missingBookInfo > 0) {
      console.log(`  ⚠️  ${missingBookInfo} view interactions missing book information`);
    } else {
      console.log(`  ✓ All view interactions have book information`);
    }

    // Check for search interactions without query
    const missingQuery = await interactions.countDocuments({ 
      eventType: "search",
      $or: [
        { searchQuery: { $exists: false } },
        { searchQuery: "" }
      ]
    });
    
    if (missingQuery > 0) {
      console.log(`  ⚠️  ${missingQuery} search interactions missing query`);
    } else {
      console.log(`  ✓ All search interactions have queries`);
    }

    // Check for old interactions (> 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const oldInteractions = await interactions.countDocuments({
      timestamp: { $lt: ninetyDaysAgo }
    });
    
    if (oldInteractions > 0) {
      console.log(`  ⚠️  ${oldInteractions} interactions older than 90 days (should be cleaned up)`);
    } else {
      console.log(`  ✓ No old interactions (all within 90 days)`);
    }

    // Check for interactions in last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentCount = await interactions.countDocuments({
      timestamp: { $gte: oneHourAgo }
    });
    
    console.log(`\n  📊 Interactions in last hour: ${recentCount}`);
    
    if (recentCount === 0) {
      console.log(`     ⚠️  No recent activity - users may not be browsing`);
    } else {
      console.log(`     ✓ Active tracking - users are browsing`);
    }

    // Check indexes
    console.log("\n\n🔧 Index Check:");
    console.log("─".repeat(80));
    
    const indexes = await interactions.indexes();
    console.log(`  Total indexes: ${indexes.length}`);
    
    const hasUserIdIndex = indexes.some(idx => idx.key.userId);
    const hasTimestampIndex = indexes.some(idx => idx.key.timestamp);
    const hasExpiresIndex = indexes.some(idx => idx.key.expiresAt);
    
    console.log(`  userId index: ${hasUserIdIndex ? '✓' : '❌ Missing'}`);
    console.log(`  timestamp index: ${hasTimestampIndex ? '✓' : '❌ Missing'}`);
    console.log(`  expiresAt (TTL) index: ${hasExpiresIndex ? '✓' : '❌ Missing'}`);
    
    if (!hasUserIdIndex || !hasTimestampIndex || !hasExpiresIndex) {
      console.log("\n  ⚠️  Some indexes are missing. Run setup script:");
      console.log("     node scripts/setup-interaction-indexes.js");
    }

    // Summary
    console.log("\n\n📋 Summary:");
    console.log("─".repeat(80));
    
    if (totalCount === 0) {
      console.log("  ❌ No interactions tracked yet");
      console.log("     Action: Test by viewing books and searching");
    } else if (recentCount === 0) {
      console.log("  ⚠️  Tracking exists but no recent activity");
      console.log("     Action: Check if users are actively browsing");
    } else {
      console.log("  ✓ Tracking is working!");
      console.log(`     ${totalCount} total interactions`);
      console.log(`     ${recentCount} in last hour`);
      console.log("     Recommendations should be personalized");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the verification
const userEmail = process.argv[2];

console.log("🔍 Verifying Interaction Tracking\n");
console.log("═".repeat(80));

verifyInteractionTracking(userEmail)
  .then(() => {
    console.log("\n✓ Verification completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
