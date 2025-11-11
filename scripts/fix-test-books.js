/**
 * Fix Test Books
 * 
 * Removes or fixes test books that don't have proper category data.
 * 
 * Usage: node scripts/fix-test-books.js
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function fixTestBooks() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const books = db.collection("books");
    const interactions = db.collection("user_interactions");

    // Find books without categories
    const booksWithoutCategories = await books.find({
      $or: [
        { categories: { $exists: false } },
        { categories: [] },
        { categories: null }
      ]
    }).toArray();

    console.log(`📚 Found ${booksWithoutCategories.length} books without categories\n`);

    if (booksWithoutCategories.length === 0) {
      console.log("✅ All books have categories!");
      return;
    }

    console.log("Books without categories:");
    console.log("═".repeat(80));

    for (const book of booksWithoutCategories) {
      console.log(`\n📖 ${book.title}`);
      console.log(`   Author: ${book.author || "Unknown"}`);
      console.log(`   ID: ${book._id}`);
      console.log(`   ISBN: ${book.isbn || "N/A"}`);

      // Check if this book has been viewed
      const viewCount = await interactions.countDocuments({
        bookId: book._id,
        eventType: "view"
      });

      console.log(`   Views: ${viewCount}`);

      // Determine if this is a test book
      const isTestBook = 
        !book.isbn || 
        book.title.toLowerCase().includes("test") ||
        book.title.toLowerCase().includes("pogi") ||
        book.author === "Test Author";

      if (isTestBook) {
        console.log(`   ⚠️  Appears to be TEST DATA`);
        console.log(`   Action: Will delete this book and its interactions`);

        // Delete the book
        await books.deleteOne({ _id: book._id });
        
        // Delete interactions for this book
        const deleteResult = await interactions.deleteMany({ bookId: book._id });
        
        console.log(`   ✓ Deleted book`);
        console.log(`   ✓ Deleted ${deleteResult.deletedCount} interactions`);
      } else {
        console.log(`   ℹ️  Real book, needs category enrichment`);
        console.log(`   Action: Add default "General" category`);

        // Add a default category
        await books.updateOne(
          { _id: book._id },
          { $set: { categories: ["General"], tags: [] } }
        );

        console.log(`   ✓ Added "General" category`);
      }
    }

    console.log("\n\n📋 Summary:");
    console.log("═".repeat(80));
    console.log("✓ Fixed all books without categories");
    console.log("✓ Deleted test books and their interactions");
    console.log("✓ Added default categories to real books");
    console.log("\n💡 Next Steps:");
    console.log("   1. User should view books with proper categories");
    console.log("   2. Run: node scripts/verify-interaction-tracking.js demo@student.com");
    console.log("   3. Should now see categories in user profile");

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

console.log("🔧 Fixing Test Books\n");
console.log("═".repeat(80));

fixTestBooks()
  .then(() => {
    console.log("\n✓ Fix completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fix failed:", error);
    process.exit(1);
  });
