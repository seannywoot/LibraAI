/**
 * Diagnose Interaction Tracking
 * 
 * Check if interactions are properly linked to books
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function diagnoseInteractions() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const interactions = db.collection("user_interactions");
    const books = db.collection("books");

    console.log("🔍 Diagnosing Interaction Tracking\n");

    // Get sample interactions
    const sampleInteractions = await interactions.find({}).limit(10).toArray();

    console.log(`📊 Sample Interactions (${sampleInteractions.length}):\n`);

    for (const interaction of sampleInteractions) {
      console.log(`Interaction ID: ${interaction._id}`);
      console.log(`  User: ${interaction.userId}`);
      console.log(`  Event: ${interaction.eventType}`);
      console.log(`  BookId: ${interaction.bookId}`);
      console.log(`  BookId Type: ${typeof interaction.bookId}`);
      
      if (interaction.bookId) {
        // Try to find the book
        let book = null;
        
        // Try as ObjectId
        if (ObjectId.isValid(interaction.bookId)) {
          book = await books.findOne({ _id: new ObjectId(interaction.bookId) });
        }
        
        // Try as string
        if (!book) {
          book = await books.findOne({ _id: interaction.bookId });
        }

        if (book) {
          console.log(`  ✅ Book Found: ${book.title}`);
          console.log(`     Categories: ${(book.categories || []).join(", ")}`);
        } else {
          console.log(`  ❌ Book NOT Found`);
        }
      } else {
        console.log(`  ⚠️  No bookId in interaction`);
      }
      console.log();
    }

    // Check interaction structure
    console.log("\n📋 Interaction Field Analysis:");
    const interactionFields = await interactions.findOne({});
    if (interactionFields) {
      console.log("Fields in interaction document:");
      Object.keys(interactionFields).forEach(key => {
        console.log(`  - ${key}: ${typeof interactionFields[key]}`);
      });
    }

    // Count interactions with/without bookId
    const totalInteractions = await interactions.countDocuments();
    const withBookId = await interactions.countDocuments({ bookId: { $exists: true, $ne: null } });
    const withoutBookId = totalInteractions - withBookId;

    console.log(`\n📊 Interaction Statistics:`);
    console.log(`  Total: ${totalInteractions}`);
    console.log(`  With bookId: ${withBookId} (${Math.round(withBookId/totalInteractions*100)}%)`);
    console.log(`  Without bookId: ${withoutBookId} (${Math.round(withoutBookId/totalInteractions*100)}%)`);

    if (withoutBookId > 0) {
      console.log(`\n⚠️  ${withoutBookId} interactions are missing bookId!`);
      console.log(`   This prevents category-based recommendations.`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await client.close();
  }
}

diagnoseInteractions();
