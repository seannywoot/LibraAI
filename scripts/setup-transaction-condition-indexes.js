/**
 * Setup Database Indexes for Transaction Book Condition Tracking
 * Run this script to create indexes for efficient querying of book conditions
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function setupConditionIndexes() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db();
    const transactions = db.collection("transactions");

    console.log("\n📋 Creating indexes for transaction book condition tracking...");

    // Index for querying transactions by book condition
    try {
      await transactions.createIndex({ bookCondition: 1 });
      console.log("  ✓ bookCondition");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  bookCondition (already exists)");
      } else {
        throw err;
      }
    }

    // Compound index for finding damaged books by status
    try {
      await transactions.createIndex({ status: 1, bookCondition: 1 });
      console.log("  ✓ status + bookCondition");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  status + bookCondition (already exists)");
      } else {
        throw err;
      }
    }

    // Compound index for finding damaged books by specific book
    try {
      await transactions.createIndex({ bookId: 1, bookCondition: 1 });
      console.log("  ✓ bookId + bookCondition");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  bookId + bookCondition (already exists)");
      } else {
        throw err;
      }
    }

    // Index for archived transactions
    try {
      await transactions.createIndex({ archived: 1, archivedAt: -1 });
      console.log("  ✓ archived + archivedAt");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  archived + archivedAt (already exists)");
      } else {
        throw err;
      }
    }

    // Compound index for filtering archived transactions by status
    try {
      await transactions.createIndex({ archived: 1, status: 1 });
      console.log("  ✓ archived + status");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  archived + status (already exists)");
      } else {
        throw err;
      }
    }

    console.log("\n✅ All condition tracking indexes created successfully!");

    // Show current transaction indexes
    console.log("\n📊 Current Transaction Indexes:");
    const indexes = await transactions.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Show sample statistics
    console.log("\n📈 Transaction Statistics:");
    const totalTransactions = await transactions.countDocuments({});
    const returnedTransactions = await transactions.countDocuments({ status: "returned" });
    const archivedTransactions = await transactions.countDocuments({ archived: true });
    const damagedBooks = await transactions.countDocuments({ bookCondition: "damaged" });
    const fairBooks = await transactions.countDocuments({ bookCondition: "fair" });
    const goodBooks = await transactions.countDocuments({ bookCondition: "good" });

    console.log(`  Total Transactions: ${totalTransactions}`);
    console.log(`  Returned: ${returnedTransactions}`);
    console.log(`  Archived: ${archivedTransactions}`);
    console.log(`  Book Conditions:`);
    console.log(`    - Good: ${goodBooks}`);
    console.log(`    - Fair: ${fairBooks}`);
    console.log(`    - Damaged: ${damagedBooks}`);

  } catch (error) {
    console.error("\n❌ Error setting up indexes:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

setupConditionIndexes();
