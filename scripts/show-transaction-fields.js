/**
 * Show Transaction Database Fields
 * This script displays the exact database structure and field names
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function showTransactionFields() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const transactions = db.collection("transactions");

    console.log("=" .repeat(80));
    console.log("DATABASE: " + db.databaseName);
    console.log("COLLECTION: transactions");
    console.log("=" .repeat(80));
    console.log("");

    // Show a sample rejected transaction with all fields
    console.log("📋 REJECTED TRANSACTION EXAMPLE:\n");
    const rejectedSample = await transactions.findOne({ 
      status: "rejected",
      rejectionReason: { $exists: true }
    });

    if (rejectedSample) {
      console.log("Document ID:", rejectedSample._id);
      console.log("");
      console.log("REJECTION FIELDS:");
      console.log("  status:", rejectedSample.status);
      console.log("  rejectionReason:", `"${rejectedSample.rejectionReason}"`);
      console.log("  rejectedBy:", rejectedSample.rejectedBy);
      console.log("  rejectedAt:", rejectedSample.rejectedAt);
      console.log("");
      console.log("BOOK INFO:");
      console.log("  bookTitle:", rejectedSample.bookTitle);
      console.log("  bookAuthor:", rejectedSample.bookAuthor);
      console.log("  bookId:", rejectedSample.bookId);
      console.log("");
      console.log("USER INFO:");
      console.log("  userId:", rejectedSample.userId);
      console.log("  userName:", rejectedSample.userName);
      console.log("");
      console.log("ARCHIVE INFO:");
      console.log("  archived:", rejectedSample.archived);
      console.log("  archivedAt:", rejectedSample.archivedAt);
      console.log("  archivedBy:", rejectedSample.archivedBy);
    } else {
      console.log("  No rejected transactions with reasons found.");
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Show a sample returned transaction with condition
    console.log("📦 RETURNED TRANSACTION EXAMPLE:\n");
    const returnedSample = await transactions.findOne({ 
      status: "returned",
      bookCondition: { $exists: true }
    });

    if (returnedSample) {
      console.log("Document ID:", returnedSample._id);
      console.log("");
      console.log("RETURN FIELDS:");
      console.log("  status:", returnedSample.status);
      console.log("  bookCondition:", `"${returnedSample.bookCondition}"`);
      console.log("  conditionNotes:", returnedSample.conditionNotes ? `"${returnedSample.conditionNotes}"` : "(none)");
      console.log("  returnedAt:", returnedSample.returnedAt);
      console.log("  returnProcessedAt:", returnedSample.returnProcessedAt);
      console.log("  returnProcessedBy:", returnedSample.returnProcessedBy);
      console.log("");
      console.log("BOOK INFO:");
      console.log("  bookTitle:", returnedSample.bookTitle);
      console.log("  bookAuthor:", returnedSample.bookAuthor);
      console.log("  bookId:", returnedSample.bookId);
      console.log("");
      console.log("USER INFO:");
      console.log("  userId:", returnedSample.userId);
      console.log("  userName:", returnedSample.userName);
      console.log("");
      console.log("BORROW INFO:");
      console.log("  borrowedAt:", returnedSample.borrowedAt);
      console.log("  dueDate:", returnedSample.dueDate);
      console.log("  approvedBy:", returnedSample.approvedBy);
      console.log("");
      console.log("ARCHIVE INFO:");
      console.log("  archived:", returnedSample.archived);
      console.log("  archivedAt:", returnedSample.archivedAt);
      console.log("  archivedBy:", returnedSample.archivedBy);
    } else {
      console.log("  No returned transactions with condition found.");
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Show all unique field names in the collection
    console.log("📊 ALL FIELDS IN TRANSACTIONS COLLECTION:\n");
    
    const sampleDoc = await transactions.findOne({});
    if (sampleDoc) {
      const allFields = Object.keys(sampleDoc).sort();
      console.log("Total fields found:", allFields.length);
      console.log("");
      
      allFields.forEach((field, idx) => {
        const value = sampleDoc[field];
        const type = Array.isArray(value) ? 'Array' : typeof value;
        console.log(`  ${(idx + 1).toString().padStart(2)}. ${field.padEnd(25)} (${type})`);
      });
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // MongoDB Query Examples
    console.log("🔍 MONGODB QUERY EXAMPLES:\n");
    console.log("To query rejected transactions with reasons:");
    console.log('  db.transactions.find({ status: "rejected", rejectionReason: { $exists: true } })');
    console.log("");
    console.log("To query returned books with condition:");
    console.log('  db.transactions.find({ status: "returned", bookCondition: { $exists: true } })');
    console.log("");
    console.log("To query damaged books:");
    console.log('  db.transactions.find({ bookCondition: "damaged" })');
    console.log("");
    console.log("To query archived transactions:");
    console.log('  db.transactions.find({ archived: true })');
    console.log("");

    console.log("=" .repeat(80) + "\n");

    // Summary statistics
    console.log("📈 FIELD USAGE STATISTICS:\n");
    
    const stats = {
      total: await transactions.countDocuments({}),
      withRejectionReason: await transactions.countDocuments({ rejectionReason: { $exists: true } }),
      withBookCondition: await transactions.countDocuments({ bookCondition: { $exists: true } }),
      withConditionNotes: await transactions.countDocuments({ conditionNotes: { $exists: true } }),
      archived: await transactions.countDocuments({ archived: true }),
      rejected: await transactions.countDocuments({ status: "rejected" }),
      returned: await transactions.countDocuments({ status: "returned" }),
    };

    console.log(`  Total Transactions: ${stats.total}`);
    console.log(`  With rejectionReason field: ${stats.withRejectionReason} (${((stats.withRejectionReason/stats.total)*100).toFixed(1)}%)`);
    console.log(`  With bookCondition field: ${stats.withBookCondition} (${((stats.withBookCondition/stats.total)*100).toFixed(1)}%)`);
    console.log(`  With conditionNotes field: ${stats.withConditionNotes} (${((stats.withConditionNotes/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Archived: ${stats.archived} (${((stats.archived/stats.total)*100).toFixed(1)}%)`);
    console.log(`  Status=rejected: ${stats.rejected}`);
    console.log(`  Status=returned: ${stats.returned}`);

    console.log("\n" + "=" .repeat(80));

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

showTransactionFields();
