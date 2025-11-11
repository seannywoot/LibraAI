/**
 * Check User Recommendations Profile
 * 
 * This script checks a user's interaction history and recommendation profile
 * to diagnose why recommendations might not be personalized.
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function checkUserRecommendations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Get the most recent user with interactions
    const interactions = db.collection("user_interactions");
    const transactions = db.collection("transactions");
    const bookmarks = db.collection("bookmarks");
    const notes = db.collection("notes");
    const books = db.collection("books");

    console.log("🔍 Checking User Recommendation Profiles\n");

    // Get users with recent activity
    const recentUsers = await interactions
      .aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ])
      .toArray();

    if (recentUsers.length === 0) {
      console.log("⚠️  No users with interactions found");
      return;
    }

    for (const userStat of recentUsers) {
      const userId = userStat._id;
      console.log(`\n${"=".repeat(60)}`);
      console.log(`👤 User: ${userId}`);
      console.log(`${"=".repeat(60)}`);

      // Get interaction counts
      const interactionCount = await interactions.countDocuments({ userId });
      const transactionCount = await transactions.countDocuments({ userId });
      const bookmarkCount = await bookmarks.countDocuments({ userId });
      const noteCount = await notes.countDocuments({ userId });

      console.log(`\n📊 Activity Summary:`);
      console.log(`   Interactions: ${interactionCount}`);
      console.log(`   Transactions: ${transactionCount}`);
      console.log(`   Bookmarks: ${bookmarkCount}`);
      console.log(`   Notes: ${noteCount}`);

      // Get recent interactions
      const recentInteractions = await interactions
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();

      console.log(`\n📚 Recent Interactions (last 10):`);
      for (const interaction of recentInteractions) {
        const book = await books.findOne({ _id: interaction.bookId });
        if (book) {
          console.log(`   ${interaction.eventType}: ${book.title}`);
          console.log(`      Categories: ${(book.categories || []).join(", ")}`);
        }
      }

      // Get borrowed books
      const borrowedBooks = await transactions
        .find({ 
          userId,
          status: { $in: ["borrowed", "returned"] }
        })
        .limit(5)
        .toArray();

      if (borrowedBooks.length > 0) {
        console.log(`\n📖 Borrowed Books:`);
        for (const transaction of borrowedBooks) {
          const book = await books.findOne({ _id: transaction.bookId });
          if (book) {
            console.log(`   ${book.title}`);
            console.log(`      Categories: ${(book.categories || []).join(", ")}`);
          }
        }
      }

      // Analyze category preferences
      const categoryPreferences = {};
      
      // From interactions
      for (const interaction of recentInteractions) {
        const book = await books.findOne({ _id: interaction.bookId });
        if (book && book.categories) {
          book.categories.forEach(cat => {
            categoryPreferences[cat] = (categoryPreferences[cat] || 0) + 1;
          });
        }
      }

      // From borrowed books
      for (const transaction of borrowedBooks) {
        const book = await books.findOne({ _id: transaction.bookId });
        if (book && book.categories) {
          book.categories.forEach(cat => {
            categoryPreferences[cat] = (categoryPreferences[cat] || 0) + 2; // Weight borrowed books higher
          });
        }
      }

      console.log(`\n🎯 Category Preferences:`);
      const sortedPrefs = Object.entries(categoryPreferences)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      if (sortedPrefs.length > 0) {
        sortedPrefs.forEach(([cat, count]) => {
          console.log(`   ${cat}: ${count} interactions`);
        });
      } else {
        console.log(`   ⚠️  No category preferences detected`);
      }

      // Check if user has enough data for personalization
      const totalActivity = interactionCount + transactionCount * 2 + bookmarkCount;
      console.log(`\n📈 Personalization Score: ${totalActivity}`);
      
      if (totalActivity < 5) {
        console.log(`   ⚠️  LOW - Need more activity for personalized recommendations`);
        console.log(`   💡 Showing popular books as fallback`);
      } else if (totalActivity < 15) {
        console.log(`   ⚠️  MODERATE - Some personalization, supplemented with popular books`);
      } else {
        console.log(`   ✅ HIGH - Fully personalized recommendations`);
      }
    }

    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`📋 RECOMMENDATION THRESHOLDS`);
    console.log(`${"=".repeat(60)}`);
    console.log(`Personalization Score = Interactions + (Transactions × 2) + Bookmarks`);
    console.log(`\n< 5:  Popular books fallback`);
    console.log(`5-15: Hybrid (personalized + popular)`);
    console.log(`> 15: Fully personalized`);
    console.log(`\n💡 To get personalized recommendations:`);
    console.log(`   - View more books (creates interactions)`);
    console.log(`   - Borrow books (weighted 2x)`);
    console.log(`   - Bookmark books`);
    console.log(`   - Take notes on books`);

  } catch (error) {
    console.error("\n❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkUserRecommendations();
