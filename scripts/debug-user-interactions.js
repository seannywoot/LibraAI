/**
 * Debug User Interactions
 * 
 * Shows detailed interaction data for a specific user to debug tracking issues.
 * 
 * Usage: node scripts/debug-user-interactions.js demo@student.com
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function debugUserInteractions(userEmail) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");

    // Get user
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`👤 User: ${userEmail}`);
    console.log(`   ID: ${user._id}`);
    console.log("═".repeat(80));

    // Get all interactions
    const allInteractions = await interactions
      .find({ userId: user._id })
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`\n📊 Total Interactions: ${allInteractions.length}\n`);

    if (allInteractions.length === 0) {
      console.log("❌ No interactions found!");
      console.log("\nPossible reasons:");
      console.log("1. User hasn't viewed any books yet");
      console.log("2. View tracking not working");
      console.log("3. Browser cache - old JavaScript loaded");
      console.log("4. JavaScript errors preventing tracking");
      return;
    }

    // Group by type
    const byType = {};
    allInteractions.forEach(int => {
      byType[int.eventType] = (byType[int.eventType] || 0) + 1;
    });

    console.log("📈 Breakdown by Type:");
    console.log("─".repeat(80));
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    // Show all interactions with full details
    console.log("\n\n📋 All Interactions (Most Recent First):");
    console.log("═".repeat(80));

    allInteractions.forEach((int, idx) => {
      const time = new Date(int.timestamp).toLocaleString();
      console.log(`\n${idx + 1}. ${int.eventType.toUpperCase()} - ${time}`);
      console.log(`   Interaction ID: ${int._id}`);
      
      if (int.eventType === "view" || int.eventType === "bookmark") {
        console.log(`   Book ID: ${int.bookId || "MISSING!"}`);
        console.log(`   Book Title: ${int.bookTitle || "MISSING!"}`);
        console.log(`   Book Author: ${int.bookAuthor || "MISSING!"}`);
        console.log(`   Categories: ${int.bookCategories?.length > 0 ? int.bookCategories.join(", ") : "NONE/MISSING!"}`);
        console.log(`   Tags: ${int.bookTags?.length > 0 ? int.bookTags.join(", ") : "NONE/MISSING!"}`);
        
        // Check for missing data
        if (!int.bookCategories || int.bookCategories.length === 0) {
          console.log(`   ⚠️  WARNING: No categories! Book may not have categories in database.`);
        }
      } else if (int.eventType === "search") {
        console.log(`   Query: "${int.searchQuery || "MISSING!"}"`);
        if (int.searchFilters && Object.keys(int.searchFilters).length > 0) {
          console.log(`   Filters: ${JSON.stringify(int.searchFilters)}`);
        }
      }
    });

    // Check for issues
    console.log("\n\n🔍 Issue Detection:");
    console.log("═".repeat(80));

    const viewInteractions = allInteractions.filter(i => i.eventType === "view");
    const bookmarkInteractions = allInteractions.filter(i => i.eventType === "bookmark");
    const searchInteractions = allInteractions.filter(i => i.eventType === "search");

    console.log(`\nView Interactions: ${viewInteractions.length}`);
    if (viewInteractions.length === 0) {
      console.log("  ❌ NO VIEW INTERACTIONS!");
      console.log("  Problem: User viewed books but tracking didn't record them");
      console.log("  Possible causes:");
      console.log("    1. Browser cache - old JavaScript without view tracking");
      console.log("    2. JavaScript error preventing trackBookView()");
      console.log("    3. Book detail page not calling tracker");
      console.log("  Fix: Hard refresh browser (Ctrl + Shift + R)");
    } else {
      console.log("  ✓ View interactions recorded");
      
      // Check if views have categories
      const viewsWithoutCategories = viewInteractions.filter(
        i => !i.bookCategories || i.bookCategories.length === 0
      );
      
      if (viewsWithoutCategories.length > 0) {
        console.log(`  ⚠️  ${viewsWithoutCategories.length} views missing categories!`);
        console.log("  Problem: Books in database don't have categories");
        console.log("  Fix: Run Google Books enrichment to add categories");
      }
    }

    console.log(`\nBookmark Interactions: ${bookmarkInteractions.length}`);
    if (bookmarkInteractions.length === 0) {
      console.log("  ℹ️  No bookmarks yet (this is okay)");
    } else {
      console.log("  ✓ Bookmark interactions recorded");
    }

    console.log(`\nSearch Interactions: ${searchInteractions.length}`);
    if (searchInteractions.length > 0) {
      console.log("  ✓ Search tracking working");
    }

    // Check if only searches exist
    if (searchInteractions.length > 0 && viewInteractions.length === 0 && bookmarkInteractions.length === 0) {
      console.log("\n❌ CRITICAL ISSUE DETECTED:");
      console.log("─".repeat(80));
      console.log("Only SEARCH interactions exist, no VIEW or BOOKMARK interactions!");
      console.log("\nThis means:");
      console.log("  • Search tracking is working ✓");
      console.log("  • View tracking is NOT working ✗");
      console.log("  • User viewed books but they weren't tracked");
      console.log("\nMost likely cause:");
      console.log("  Browser is using OLD JavaScript (before view tracking was added)");
      console.log("\nFix:");
      console.log("  1. Hard refresh browser: Ctrl + Shift + R (or Cmd + Shift + R)");
      console.log("  2. Or restart dev server: rm -rf .next && npm run dev");
      console.log("  3. Then view a book again");
      console.log("  4. Check Network tab for POST to /api/student/books/track");
    }

    // Summary
    console.log("\n\n📋 Summary:");
    console.log("═".repeat(80));
    
    if (viewInteractions.length === 0) {
      console.log("❌ View tracking NOT working for this user");
      console.log("   Action: Hard refresh browser and try viewing a book");
    } else {
      const categoriesFound = viewInteractions.some(
        i => i.bookCategories && i.bookCategories.length > 0
      );
      
      if (categoriesFound) {
        console.log("✓ View tracking working correctly");
      } else {
        console.log("⚠️  View tracking working but books have no categories");
        console.log("   Action: Enrich books with Google Books data");
      }
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the debug
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("Usage: node scripts/debug-user-interactions.js <email>");
  console.error("\nExample:");
  console.error("  node scripts/debug-user-interactions.js demo@student.com");
  process.exit(1);
}

console.log("🔍 Debugging User Interactions\n");
console.log("═".repeat(80));

debugUserInteractions(userEmail)
  .then(() => {
    console.log("\n✓ Debug completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Debug failed:", error);
    process.exit(1);
  });
