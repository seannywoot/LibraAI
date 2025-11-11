/**
 * Test Archive Sorting
 * Verify that archived transactions are sorted by archivedAt (newest first)
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function testArchiveSorting() {
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

    console.log("📋 Testing Archive Sorting Order...\n");

    // Get archived transactions sorted by archivedAt (newest first)
    const archivedTransactions = await transactions
      .find({ archived: true })
      .sort({ archivedAt: -1, requestedAt: -1 })
      .limit(10)
      .toArray();

    if (archivedTransactions.length === 0) {
      console.log("⚠️  No archived transactions found.");
      return;
    }

    console.log(`✅ Found ${archivedTransactions.length} archived transactions\n`);
    console.log("Showing in order (newest archived first):\n");

    archivedTransactions.forEach((t, idx) => {
      const archivedDate = t.archivedAt ? new Date(t.archivedAt).toLocaleString() : "N/A";
      console.log(`${idx + 1}. "${t.bookTitle}"`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Archived: ${archivedDate}`);
      console.log(`   Archived By: ${t.archivedBy || "N/A"}`);
      console.log("");
    });

    // Verify sorting is correct
    console.log("🔍 Verifying Sort Order...\n");
    let sortedCorrectly = true;
    
    for (let i = 0; i < archivedTransactions.length - 1; i++) {
      const current = archivedTransactions[i].archivedAt;
      const next = archivedTransactions[i + 1].archivedAt;
      
      if (current && next && new Date(current) < new Date(next)) {
        sortedCorrectly = false;
        console.log(`❌ Sort order incorrect at position ${i + 1}`);
        console.log(`   Current: ${new Date(current).toLocaleString()}`);
        console.log(`   Next: ${new Date(next).toLocaleString()}`);
        break;
      }
    }

    if (sortedCorrectly) {
      console.log("✅ Sort order is correct (newest archived first)");
    }

    console.log("\n📊 Archive Date Range:");
    if (archivedTransactions.length > 0) {
      const newest = archivedTransactions[0].archivedAt;
      const oldest = archivedTransactions[archivedTransactions.length - 1].archivedAt;
      
      console.log(`   Newest: ${newest ? new Date(newest).toLocaleString() : "N/A"}`);
      console.log(`   Oldest: ${oldest ? new Date(oldest).toLocaleString() : "N/A"}`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

testArchiveSorting();
