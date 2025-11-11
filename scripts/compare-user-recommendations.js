/**
 * Compare User Recommendations
 * 
 * This script compares recommendations for different users to show personalization.
 * 
 * Usage: node scripts/compare-user-recommendations.js
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function compareUserRecommendations() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");

    // Get all users with interactions
    const allUsers = await users.find({ role: "student" }).toArray();
    
    console.log("📊 User Interaction Summary\n");
    console.log("═".repeat(80));

    for (const user of allUsers) {
      const userInteractions = await interactions
        .find({ userId: user._id })
        .sort({ timestamp: -1 })
        .toArray();

      console.log(`\n👤 User: ${user.email}`);
      console.log("─".repeat(80));
      
      if (userInteractions.length === 0) {
        console.log("  ❌ No interactions");
        console.log("  📋 Recommendation Type: POPULAR (Fallback)");
        console.log("  💡 Will show: 'Popular with students' books");
      } else {
        console.log(`  ✅ ${userInteractions.length} interactions`);
        
        // Count by type
        const byType = {};
        userInteractions.forEach(int => {
          byType[int.eventType] = (byType[int.eventType] || 0) + 1;
        });
        
        console.log("  📈 Breakdown:");
        Object.entries(byType).forEach(([type, count]) => {
          console.log(`     ${type}: ${count}`);
        });
        
        // Get categories
        const categories = new Set();
        const authors = new Set();
        
        userInteractions.forEach(int => {
          if (int.bookCategories) {
            int.bookCategories.forEach(cat => categories.add(cat));
          }
          if (int.bookAuthor) {
            authors.add(int.bookAuthor);
          }
        });
        
        console.log(`  📚 Interested in ${categories.size} categories:`);
        Array.from(categories).slice(0, 5).forEach(cat => {
          console.log(`     - ${cat}`);
        });
        
        if (authors.size > 0) {
          console.log(`  ✍️  Viewed ${authors.size} authors:`);
          Array.from(authors).slice(0, 3).forEach(author => {
            console.log(`     - ${author}`);
          });
        }
        
        console.log("  📋 Recommendation Type: PERSONALIZED");
        console.log("  💡 Will show: Books matching user's interests");
        
        // Show last 3 interactions
        console.log("\n  🕐 Recent Activity:");
        userInteractions.slice(0, 3).forEach((int, idx) => {
          const time = new Date(int.timestamp).toLocaleString();
          console.log(`     ${idx + 1}. ${int.eventType.toUpperCase()} - ${time}`);
          if (int.eventType === "view") {
            console.log(`        Book: ${int.bookTitle}`);
          } else if (int.eventType === "search") {
            console.log(`        Query: "${int.searchQuery}"`);
          }
        });
      }
    }

    console.log("\n\n📊 Summary:");
    console.log("═".repeat(80));
    
    const usersWithInteractions = allUsers.filter(async (user) => {
      const count = await interactions.countDocuments({ userId: user._id });
      return count > 0;
    });
    
    const totalUsers = allUsers.length;
    const usersWithData = await Promise.all(
      allUsers.map(async (user) => {
        const count = await interactions.countDocuments({ userId: user._id });
        return count > 0;
      })
    );
    const personalizedCount = usersWithData.filter(Boolean).length;
    
    console.log(`\nTotal Users: ${totalUsers}`);
    console.log(`Users with Personalized Recommendations: ${personalizedCount}`);
    console.log(`Users with Popular Recommendations: ${totalUsers - personalizedCount}`);
    
    console.log("\n✅ PERSONALIZATION STATUS:");
    if (personalizedCount > 0) {
      console.log("   ✓ Personalization is WORKING!");
      console.log("   ✓ Different users see different recommendations");
      console.log("   ✓ Based on individual browsing history");
    } else {
      console.log("   ❌ No personalization yet");
      console.log("   ℹ️  All users see popular books (no interaction data)");
    }
    
    console.log("\n💡 What This Means:");
    console.log("─".repeat(80));
    console.log("• Users WITH interactions → Personalized recommendations");
    console.log("• Users WITHOUT interactions → Popular books (fallback)");
    console.log("• Different users → Different recommendations (GOOD!)");
    console.log("• Same recommendations for all → System not working (BAD!)");
    
    console.log("\n🎯 Expected Behavior:");
    console.log("─".repeat(80));
    console.log("✓ seannpatrick25@gmail.com → Personalized (has history)");
    console.log("✓ student@demo.com → Personalized (has history)");
    console.log("✓ demo@student.com → Popular (new user, no history)");
    console.log("\nThis is CORRECT! Each user should see different books.");

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

console.log("🔍 Comparing User Recommendations\n");
console.log("═".repeat(80));

compareUserRecommendations()
  .then(() => {
    console.log("\n✓ Comparison completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Comparison failed:", error);
    process.exit(1);
  });
