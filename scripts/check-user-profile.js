/**
 * Check User Profile and Recommendation Data
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function checkProfile() {
  const uri = process.env.MONGODB_URI;
  const userEmail = process.argv[2] || "student@demo.edu";

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(`🔍 Checking profile for: ${userEmail}\n`);

    const db = client.db();
    const users = db.collection("users");
    const interactions = db.collection("user_interactions");

    const user = await users.findOne({ email: userEmail });
    if (!user) {
      console.error("❌ User not found");
      process.exit(1);
    }

    // Get viewed books with categories
    const viewedBooks = await interactions
      .find({
        userId: user._id,
        eventType: "view",
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    console.log("📚 Recently Viewed Books:");
    console.log("─".repeat(50));
    viewedBooks.forEach((view, index) => {
      console.log(`${index + 1}. ${view.bookTitle || "Unknown"}`);
      console.log(`   Categories: ${(view.bookCategories || []).join(", ") || "NONE"}`);
      console.log(`   Tags: ${(view.bookTags || []).join(", ") || "NONE"}`);
      console.log(`   Date: ${new Date(view.timestamp).toLocaleString()}\n`);
    });

    // Analyze categories
    const allCategories = viewedBooks.flatMap((v) => v.bookCategories || []);
    const categoryFreq = {};
    allCategories.forEach((cat) => {
      categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
    });

    console.log("\n📊 Your Top Categories:");
    console.log("─".repeat(50));
    const topCategories = Object.entries(categoryFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topCategories.length > 0) {
      topCategories.forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} views`);
      });
    } else {
      console.log("   ⚠️  No categories tracked!");
      console.log("   This means viewed books had no categories when viewed.");
    }

    // Check searches
    const searches = await interactions
      .find({
        userId: user._id,
        eventType: "search",
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    console.log("\n\n🔍 Recent Searches:");
    console.log("─".repeat(50));
    searches.forEach((search, index) => {
      console.log(`${index + 1}. "${search.searchQuery || "N/A"}"`);
    });

    console.log("\n\n💡 Recommendation:");
    if (allCategories.length === 0) {
      console.log("❌ Your viewed books have NO categories tracked!");
      console.log("   This happened because:");
      console.log("   1. Books didn't have categories when you viewed them");
      console.log("   2. View tracking didn't capture categories");
      console.log("\n   Solution:");
      console.log("   - View 5-10 books again (they now have categories)");
      console.log("   - Recommendations will update immediately");
    } else {
      console.log("✅ Your profile looks good!");
      console.log("   Clear browser cache and refresh to see new recommendations");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

checkProfile();
