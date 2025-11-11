/**
 * Check Book Categories
 * 
 * Checks if books in the database have category data.
 * 
 * Usage: node scripts/check-book-categories.js
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function checkBookCategories() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const books = db.collection("books");

    // Get total book count
    const totalBooks = await books.countDocuments();
    console.log(`📚 Total Books: ${totalBooks}\n`);

    if (totalBooks === 0) {
      console.log("❌ No books in database!");
      return;
    }

    // Count books with categories
    const booksWithCategories = await books.countDocuments({
      categories: { $exists: true, $ne: [], $ne: null }
    });

    const booksWithoutCategories = totalBooks - booksWithCategories;

    console.log("📊 Category Status:");
    console.log("═".repeat(80));
    console.log(`Books WITH categories: ${booksWithCategories} (${Math.round(booksWithCategories/totalBooks*100)}%)`);
    console.log(`Books WITHOUT categories: ${booksWithoutCategories} (${Math.round(booksWithoutCategories/totalBooks*100)}%)`);

    // Show sample books without categories
    if (booksWithoutCategories > 0) {
      console.log("\n\n❌ Sample Books WITHOUT Categories:");
      console.log("─".repeat(80));
      
      const samplesWithout = await books
        .find({
          $or: [
            { categories: { $exists: false } },
            { categories: [] },
            { categories: null }
          ]
        })
        .limit(10)
        .toArray();

      samplesWithout.forEach((book, idx) => {
        console.log(`\n${idx + 1}. ${book.title}`);
        console.log(`   Author: ${book.author}`);
        console.log(`   ID: ${book._id}`);
        console.log(`   Categories: ${book.categories || "NONE"}`);
        console.log(`   ISBN: ${book.isbn || "N/A"}`);
      });

      console.log("\n\n⚠️  ISSUE DETECTED:");
      console.log("─".repeat(80));
      console.log(`${booksWithoutCategories} books are missing category data!`);
      console.log("\nThis causes:");
      console.log("  • View interactions recorded without categories");
      console.log("  • User profiles show 0 categories");
      console.log("  • Recommendations can't match by category");
      console.log("  • Reduced personalization quality");
      console.log("\nFix:");
      console.log("  Run Google Books enrichment to add categories:");
      console.log("  node scripts/upsert-google-books-data.js");
    }

    // Show sample books with categories
    if (booksWithCategories > 0) {
      console.log("\n\n✅ Sample Books WITH Categories:");
      console.log("─".repeat(80));
      
      const samplesWith = await books
        .find({
          categories: { $exists: true, $ne: [], $ne: null }
        })
        .limit(5)
        .toArray();

      samplesWith.forEach((book, idx) => {
        console.log(`\n${idx + 1}. ${book.title}`);
        console.log(`   Author: ${book.author}`);
        console.log(`   Categories: ${book.categories.join(", ")}`);
        if (book.tags && book.tags.length > 0) {
          console.log(`   Tags: ${book.tags.join(", ")}`);
        }
      });
    }

    // Check category distribution
    console.log("\n\n📊 Category Distribution:");
    console.log("═".repeat(80));

    const categoryAgg = await books.aggregate([
      { $match: { categories: { $exists: true, $ne: [], $ne: null } } },
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();

    if (categoryAgg.length > 0) {
      console.log("\nTop Categories:");
      categoryAgg.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. ${cat._id}: ${cat.count} books`);
      });
    } else {
      console.log("  No categories found in any books!");
    }

    // Summary
    console.log("\n\n📋 Summary:");
    console.log("═".repeat(80));

    if (booksWithoutCategories === 0) {
      console.log("✅ All books have categories!");
      console.log("   Personalization should work correctly.");
    } else if (booksWithoutCategories === totalBooks) {
      console.log("❌ NO books have categories!");
      console.log("   CRITICAL: Run Google Books enrichment immediately!");
      console.log("\n   Command:");
      console.log("   node scripts/upsert-google-books-data.js");
    } else {
      console.log(`⚠️  ${booksWithoutCategories} books missing categories (${Math.round(booksWithoutCategories/totalBooks*100)}%)`);
      console.log("   Recommendation: Enrich all books with Google Books data");
      console.log("\n   Command:");
      console.log("   node scripts/upsert-google-books-data.js");
    }

    // Check if recently viewed books have categories
    console.log("\n\n🔍 Checking Recently Viewed Books:");
    console.log("═".repeat(80));

    const interactions = db.collection("user_interactions");
    const recentViews = await interactions
      .find({ 
        eventType: "view",
        bookId: { $exists: true }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    if (recentViews.length > 0) {
      console.log(`\nFound ${recentViews.length} recent view interactions:`);
      
      for (const view of recentViews) {
        const book = await books.findOne({ _id: view.bookId });
        const hasCategories = book && book.categories && book.categories.length > 0;
        
        console.log(`\n  • ${view.bookTitle || "Unknown"}`);
        console.log(`    Tracked categories: ${view.bookCategories?.length || 0}`);
        console.log(`    Book has categories: ${hasCategories ? "✓" : "✗"}`);
        
        if (!hasCategories && book) {
          console.log(`    ⚠️  Book exists but has no categories!`);
        }
      }
    } else {
      console.log("\n  No recent view interactions found.");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

console.log("🔍 Checking Book Categories\n");
console.log("═".repeat(80));

checkBookCategories()
  .then(() => {
    console.log("\n✓ Check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Check failed:", error);
    process.exit(1);
  });
