/**
 * Migrate Transaction Covers
 * 
 * This script adds book cover images to existing transactions
 * that don't have them yet.
 * 
 * Usage:
 *   node scripts/migrate-transaction-covers.js
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function migrateTransactionCovers() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const transactions = db.collection("transactions");
    const books = db.collection("books");

    // Find transactions without cover images
    const query = {
      $or: [
        { bookCoverImage: { $exists: false } },
        { bookCoverImage: null },
        { bookThumbnail: { $exists: false } },
        { bookThumbnail: null }
      ]
    };

    const transactionsToUpdate = await transactions.find(query).toArray();
    console.log(`📚 Found ${transactionsToUpdate.length} transactions to update\n`);

    if (transactionsToUpdate.length === 0) {
      console.log("✅ All transactions already have cover images!");
      return;
    }

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < transactionsToUpdate.length; i++) {
      const transaction = transactionsToUpdate[i];
      const progress = `[${i + 1}/${transactionsToUpdate.length}]`;

      console.log(`${progress} Processing: ${transaction.bookTitle}`);

      try {
        // Find the book
        const book = await books.findOne({ _id: transaction.bookId });

        if (!book) {
          console.log(`   ⚠️  Book not found in database\n`);
          notFound++;
          continue;
        }

        // Get cover image from book
        const coverImage = book.coverImage || book.thumbnail || null;
        const thumbnail = book.thumbnail || book.coverImage || null;

        if (!coverImage && !thumbnail) {
          console.log(`   ⚠️  Book has no cover image\n`);
          notFound++;
          continue;
        }

        // Update transaction
        await transactions.updateOne(
          { _id: transaction._id },
          {
            $set: {
              bookCoverImage: coverImage,
              bookThumbnail: thumbnail,
              updatedAt: new Date()
            }
          }
        );

        console.log(`   ✅ Added cover image\n`);
        updated++;

      } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
        errors++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Updated: ${updated} transactions`);
    console.log(`⚠️  Not found: ${notFound} transactions (book not found or no cover)`);
    console.log(`❌ Errors: ${errors} transactions`);
    console.log("=".repeat(60));

    // Show statistics
    if (updated > 0) {
      console.log("\n📊 Transaction Statistics:");
      
      const totalTransactions = await transactions.countDocuments();
      const transactionsWithCovers = await transactions.countDocuments({ 
        bookCoverImage: { $exists: true, $ne: null } 
      });

      console.log(`   Total transactions: ${totalTransactions}`);
      console.log(`   Transactions with covers: ${transactionsWithCovers} (${Math.round(transactionsWithCovers/totalTransactions*100)}%)`);

      // Status breakdown
      console.log("\n📋 By Status:");
      const statusStats = await transactions.aggregate([
        { $match: { bookCoverImage: { $exists: true, $ne: null } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      statusStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} transactions`);
      });
    }

    console.log("\n✅ Done! Transaction covers have been migrated.");
    console.log("\n💡 Next steps:");
    console.log("   - Check the dashboard to see borrowed book covers");
    console.log("   - Check My Library > Borrowed Books tab");
    console.log("   - Verify covers display correctly");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the script
console.log("🚀 Transaction Covers Migration Script");
console.log("=".repeat(60));

migrateTransactionCovers();
