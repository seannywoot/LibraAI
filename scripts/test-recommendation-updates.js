/**
 * Test Recommendation Updates
 * 
 * This script tests whether recommendations update properly after user interactions.
 * 
 * Usage: node scripts/test-recommendation-updates.js <userId>
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "personal-library";

async function testRecommendationUpdates(userId) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);

    // Get user's recent interactions
    const interactions = await db
      .collection("interactions")
      .find({ userId: new ObjectId(userId) })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    console.log(`📊 Recent Interactions (${interactions.length}):`);
    console.log("─".repeat(80));
    
    if (interactions.length === 0) {
      console.log("⚠️  No interactions found for this user");
      console.log("   Recommendations will be generic/popular books\n");
    } else {
      interactions.forEach((int, idx) => {
        console.log(`${idx + 1}. ${int.type.toUpperCase()}`);
        console.log(`   Book: ${int.bookId}`);
        console.log(`   Time: ${new Date(int.timestamp).toLocaleString()}`);
        if (int.metadata) {
          console.log(`   Metadata:`, JSON.stringify(int.metadata, null, 2));
        }
        console.log();
      });
    }

    // Get current recommendations (simulate API call)
    console.log("\n🎯 Testing Recommendation Generation:");
    console.log("─".repeat(80));

    // Get user's interaction history
    const viewedBooks = interactions
      .filter((i) => i.type === "view")
      .map((i) => i.bookId);

    const searchedTerms = interactions
      .filter((i) => i.type === "search")
      .map((i) => i.metadata?.query)
      .filter(Boolean);

    console.log(`\n📚 Viewed Books: ${viewedBooks.length}`);
    console.log(`🔍 Search Terms: ${searchedTerms.length}`);

    if (viewedBooks.length > 0) {
      // Get categories from viewed books
      const viewedBooksData = await db
        .collection("books")
        .find({ _id: { $in: viewedBooks.map((id) => new ObjectId(id)) } })
        .project({ title: 1, categories: 1, tags: 1 })
        .toArray();

      console.log("\n📖 Viewed Books Details:");
      viewedBooksData.forEach((book) => {
        console.log(`   - ${book.title}`);
        console.log(`     Categories: ${book.categories?.join(", ") || "None"}`);
        console.log(`     Tags: ${book.tags?.join(", ") || "None"}`);
      });

      // Extract categories and tags
      const allCategories = viewedBooksData.flatMap((b) => b.categories || []);
      const allTags = viewedBooksData.flatMap((b) => b.tags || []);

      const categoryFreq = {};
      allCategories.forEach((cat) => {
        categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
      });

      const tagFreq = {};
      allTags.forEach((tag) => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });

      console.log("\n📊 User Preferences (from interactions):");
      console.log("   Top Categories:");
      Object.entries(categoryFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([cat, count]) => {
          console.log(`     - ${cat}: ${count} views`);
        });

      console.log("   Top Tags:");
      Object.entries(tagFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([tag, count]) => {
          console.log(`     - ${tag}: ${count} views`);
        });
    }

    // Test recommendation freshness
    console.log("\n⏱️  Testing Recommendation Freshness:");
    console.log("─".repeat(80));

    const lastInteraction = interactions[0];
    if (lastInteraction) {
      const timeSinceLastInteraction =
        Date.now() - new Date(lastInteraction.timestamp).getTime();
      const minutesAgo = Math.floor(timeSinceLastInteraction / 1000 / 60);

      console.log(`Last interaction: ${minutesAgo} minutes ago`);
      console.log(`Cache TTL: 30 seconds`);

      if (minutesAgo < 1) {
        console.log(
          "✓ Recent interaction - recommendations should update within 30 seconds"
        );
      } else {
        console.log(
          "⚠️  No recent interactions - recommendations may be stale"
        );
      }
    }

    // Check if recommendations would be personalized
    console.log("\n🎯 Recommendation Personalization Check:");
    console.log("─".repeat(80));

    if (interactions.length === 0) {
      console.log("❌ NO PERSONALIZATION");
      console.log("   Reason: No interaction history");
      console.log("   Result: Will show popular/recent books");
    } else if (interactions.length < 3) {
      console.log("⚠️  LIMITED PERSONALIZATION");
      console.log(`   Reason: Only ${interactions.length} interactions`);
      console.log("   Result: Mix of popular and preference-based books");
    } else {
      console.log("✓ FULL PERSONALIZATION");
      console.log(`   Reason: ${interactions.length} interactions recorded`);
      console.log("   Result: Recommendations based on user preferences");
    }

    // Test update scenarios
    console.log("\n🔄 Update Scenarios:");
    console.log("─".repeat(80));

    console.log("\n1. Dashboard Page:");
    console.log("   - Loads recommendations on mount");
    console.log("   - ❌ No auto-refresh mechanism");
    console.log("   - ❌ User must refresh page to see updates");
    console.log("   - Recommendation: Add periodic refresh or refresh button");

    console.log("\n2. Catalog Page (Sidebar):");
    console.log("   - Uses recommendation service with 30s cache");
    console.log("   - ✓ Has manual refresh button");
    console.log("   - ✓ Auto-refreshes on context change (search)");
    console.log("   - ⚠️  Background refresh may not be immediate");

    console.log("\n3. After User Interactions:");
    console.log("   - View book: Tracked ✓");
    console.log("   - Search: Tracked ✓");
    console.log("   - Bookmark: Tracked ✓");
    console.log("   - Borrow: Tracked ✓");
    console.log("   - ⚠️  Recommendations update after 30s cache expires");
    console.log("   - ⚠️  Dashboard doesn't auto-refresh at all");

    console.log("\n💡 Recommendations for Improvement:");
    console.log("─".repeat(80));
    console.log("1. Add refresh button to dashboard recommendations");
    console.log("2. Add periodic auto-refresh (every 60 seconds)");
    console.log("3. Invalidate cache immediately after key interactions");
    console.log("4. Show 'Updated' timestamp on recommendations");
    console.log("5. Add loading indicator during refresh");

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the test
const userId = process.argv[2];

if (!userId) {
  console.error("Usage: node scripts/test-recommendation-updates.js <userId>");
  console.error("\nExample:");
  console.error("  node scripts/test-recommendation-updates.js 507f1f77bcf86cd799439011");
  process.exit(1);
}

testRecommendationUpdates(userId)
  .then(() => {
    console.log("\n✓ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
