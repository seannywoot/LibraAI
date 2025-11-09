/**
 * Fix User Interactions - Add Categories/Tags to Existing Views
 * Updates old interactions with current book categories/tags
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function fixInteractions() {
  const uri = process.env.MONGODB_URI;
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error("❌ Please provide user email:");
    console.error("   node scripts/fix-user-interactions.js your-email@example.com");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const users = db.collection("users");
    const interactions = db.collection("user_interactions");
    const books = db.collection("books");

    // Get user
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`🔧 Fixing interactions for: ${user.name || userEmail}\n`);

    // Get all view interactions without categories
    const viewsToFix = await interactions
      .find({
        userId: user._id,
        eventType: "view",
        $or: [
          { bookCategories: { $exists: false } },
          { bookCategories: [] },
          { bookCategories: null },
        ],
      })
      .toArray();

    console.log(`Found ${viewsToFix.length} interactions to fix\n`);

    let fixed = 0;
    let notFound = 0;

    for (const interaction of viewsToFix) {
      // Find the book by title
      const book = await books.findOne({
        title: interaction.bookTitle,
      });

      if (!book) {
        console.log(`⚠️  Book not found: ${interaction.bookTitle}`);
        notFound++;
        continue;
      }

      // Update interaction with book's current categories/tags
      await interactions.updateOne(
        { _id: interaction._id },
        {
          $set: {
            bookCategories: book.categories || [],
            bookTags: book.tags || [],
            bookAuthor: book.author,
            bookFormat: book.format,
            bookPublisher: book.publisher,
            bookYear: book.year,
          },
        }
      );

      console.log(`✅ Fixed: ${interaction.bookTitle}`);
      console.log(`   Categories: ${(book.categories || []).join(", ")}`);
      console.log(`   Tags: ${(book.tags || []).join(", ")}\n`);

      fixed++;
    }

    console.log("=".repeat(50));
    console.log(`✅ Fixed: ${fixed} interactions`);
    console.log(`⚠️  Not found: ${notFound} interactions`);
    console.log("=".repeat(50));

    console.log("\n✅ Done! Recommendations should now be personalized.");
    console.log("   Refresh your dashboard to see updated recommendations.");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixInteractions();
