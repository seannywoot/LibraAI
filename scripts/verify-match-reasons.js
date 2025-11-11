/**
 * Verify Match Reasons
 * 
 * Checks if the match reasons shown on recommendation cards accurately reflect
 * the book's actual categories.
 * 
 * Usage: node scripts/verify-match-reasons.js <userEmail>
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function verifyMatchReasons(userEmail) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const users = db.collection("users");
    const books = db.collection("books");
    const interactions = db.collection("user_interactions");

    // Get user
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      return;
    }

    console.log(`👤 User: ${userEmail}\n`);

    // Get user's top categories
    const userInteractions = await interactions
      .find({ userId: user._id, eventType: "view" })
      .toArray();

    const categoryCount = {};
    userInteractions.forEach(int => {
      if (int.bookCategories) {
        int.bookCategories.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      }
    });

    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log("📊 User's Top Categories:");
    console.log("─".repeat(80));
    topCategories.forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} views`);
    });

    // Get some recommended books
    console.log("\n\n📚 Checking Recommended Books:");
    console.log("═".repeat(80));

    // Get books that match user's top categories
    const topCategoryNames = topCategories.map(([cat]) => cat);
    
    const recommendedBooks = await books
      .find({
        categories: { $in: topCategoryNames },
        status: "available"
      })
      .limit(10)
      .toArray();

    console.log(`\nFound ${recommendedBooks.length} books matching user's interests:\n`);

    for (const book of recommendedBooks) {
      console.log(`📖 ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   Actual Categories: ${book.categories?.join(", ") || "NONE"}`);
      
      // Determine what match reason would be shown
      const matchedCategories = book.categories?.filter(cat => 
        topCategoryNames.includes(cat)
      ) || [];

      if (matchedCategories.length > 0) {
        const matchReason = `You like ${matchedCategories[0]}`;
        console.log(`   Match Reason: "${matchReason}"`);
        
        // Verify accuracy
        const isAccurate = book.categories?.includes(matchedCategories[0]);
        if (isAccurate) {
          console.log(`   ✓ ACCURATE - Book actually has ${matchedCategories[0]} category`);
        } else {
          console.log(`   ✗ INACCURATE - Book doesn't have ${matchedCategories[0]} category!`);
        }
      } else {
        console.log(`   Match Reason: Would show "Popular with students" or similar`);
        console.log(`   ⚠️  No category match with user's interests`);
      }
      
      console.log();
    }

    // Check specific books from the screenshot
    console.log("\n\n🔍 Checking Specific Books:");
    console.log("═".repeat(80));

    const specificBooks = [
      "The Story of Art",
      "Cosmos",
      "How to Win Friends and Influence People"
    ];

    for (const title of specificBooks) {
      const book = await books.findOne({ title: { $regex: title, $options: "i" } });
      
      if (book) {
        console.log(`\n📖 ${book.title}`);
        console.log(`   Author: ${book.author}`);
        console.log(`   Categories: ${book.categories?.join(", ") || "NONE"}`);
        
        // Check what match reason would be shown
        const matchedCats = book.categories?.filter(cat => 
          topCategoryNames.includes(cat)
        ) || [];

        if (matchedCats.length > 0) {
          console.log(`   Would show: "You like ${matchedCats[0]}"`);
          console.log(`   ✓ Accurate - Book has ${matchedCats[0]}`);
        } else {
          console.log(`   Would show: "Popular with students" (no category match)`);
          console.log(`   ⚠️  Book categories don't match user's top categories`);
          console.log(`   User's top: ${topCategoryNames.join(", ")}`);
          console.log(`   Book's categories: ${book.categories?.join(", ") || "NONE"}`);
        }
      } else {
        console.log(`\n❌ Book not found: ${title}`);
      }
    }

    // Summary
    console.log("\n\n📋 Summary:");
    console.log("═".repeat(80));
    console.log("\nWhy you might see few Fiction books:");
    console.log("1. Diversity algorithm - prevents showing too many from same category");
    console.log("2. Availability - Fiction books might be checked out");
    console.log("3. Scoring - Other books scored higher due to multiple factors");
    console.log("4. Already viewed - Fiction books you viewed are excluded");
    console.log("\nMatch reasons are based on:");
    console.log("• Book's actual categories");
    console.log("• User's viewing history");
    console.log("• First matching category is shown");
    console.log("\nIf a book shows 'You like Fiction' but isn't Fiction:");
    console.log("• Check if book has multiple categories");
    console.log("• Book might be miscategorized in database");
    console.log("• Run Google Books enrichment to fix categories");

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the verification
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("Usage: node scripts/verify-match-reasons.js <email>");
  console.error("\nExample:");
  console.error("  node scripts/verify-match-reasons.js demo@student.com");
  process.exit(1);
}

console.log("🔍 Verifying Match Reasons\n");
console.log("═".repeat(80));

verifyMatchReasons(userEmail)
  .then(() => {
    console.log("\n✓ Verification completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
