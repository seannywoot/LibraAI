/**
 * Diagnose Recommendation System
 * Checks if interactions are being tracked and recommendations are working
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function diagnose() {
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

    // Get your user email (replace with your actual email)
    const userEmail = process.argv[2] || "student@demo.edu";
    console.log(`🔍 Diagnosing for user: ${userEmail}\n`);

    const users = db.collection("users");
    const interactions = db.collection("user_interactions");
    const books = db.collection("books");
    const transactions = db.collection("transactions");

    // 1. Check if user exists
    console.log("1️⃣ Checking User Account");
    console.log("─".repeat(50));
    const user = await users.findOne({ email: userEmail });
    
    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      console.log("\nTry running with your email:");
      console.log(`node scripts/diagnose-recommendations.js your-email@example.com`);
      process.exit(1);
    }
    
    console.log(`✅ User found: ${user.name || user.email}`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Role: ${user.role}\n`);

    // 2. Check interactions
    console.log("2️⃣ Checking User Interactions");
    console.log("─".repeat(50));
    
    const interactionCount = await interactions.countDocuments({
      userId: user._id,
    });
    
    console.log(`Total interactions: ${interactionCount}`);
    
    if (interactionCount === 0) {
      console.log("❌ No interactions found!");
      console.log("\n💡 This means:");
      console.log("   - View tracking is not working");
      console.log("   - User hasn't viewed any books yet");
      console.log("   - Interactions are not being saved\n");
    } else {
      console.log(`✅ Found ${interactionCount} interactions\n`);
      
      // Show breakdown by type
      const breakdown = await interactions
        .aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: "$eventType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray();

      console.log("Interaction breakdown:");
      breakdown.forEach((item) => {
        console.log(`   ${item._id}: ${item.count}`);
      });
      console.log();

      // Show recent interactions
      const recent = await interactions
        .find({ userId: user._id })
        .sort({ timestamp: -1 })
        .limit(5)
        .toArray();

      console.log("Recent interactions:");
      recent.forEach((item, index) => {
        const date = new Date(item.timestamp).toLocaleString();
        console.log(`   ${index + 1}. ${item.eventType} - ${item.bookTitle || item.searchQuery || "N/A"} (${date})`);
      });
      console.log();
    }

    // 3. Check transactions
    console.log("3️⃣ Checking Transaction History");
    console.log("─".repeat(50));
    
    const transactionCount = await transactions.countDocuments({
      userId: userEmail,
    });
    
    console.log(`Total transactions: ${transactionCount}`);
    
    if (transactionCount > 0) {
      const transactionBreakdown = await transactions
        .aggregate([
          { $match: { userId: userEmail } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray();

      console.log("Transaction breakdown:");
      transactionBreakdown.forEach((item) => {
        console.log(`   ${item._id}: ${item.count}`);
      });
    }
    console.log();

    // 4. Check available books
    console.log("4️⃣ Checking Available Books");
    console.log("─".repeat(50));
    
    const availableBooks = await books.countDocuments({ status: "available" });
    console.log(`Available books: ${availableBooks}`);
    
    if (availableBooks === 0) {
      console.log("❌ No available books found!");
      console.log("   Recommendations need available books to work\n");
    } else {
      console.log(`✅ ${availableBooks} books available for recommendations\n`);
      
      // Check if books have categories/tags
      const booksWithCategories = await books.countDocuments({
        status: "available",
        categories: { $exists: true, $ne: [] },
      });
      
      const booksWithTags = await books.countDocuments({
        status: "available",
        tags: { $exists: true, $ne: [] },
      });
      
      console.log(`Books with categories: ${booksWithCategories}`);
      console.log(`Books with tags: ${booksWithTags}`);
      
      if (booksWithCategories === 0 && booksWithTags === 0) {
        console.log("⚠️  Books have no categories or tags!");
        console.log("   This limits personalization\n");
      } else {
        console.log();
      }
    }

    // 5. Test recommendation API
    console.log("5️⃣ Testing Recommendation Logic");
    console.log("─".repeat(50));
    
    if (interactionCount === 0 && transactionCount === 0) {
      console.log("⚠️  No user history - will return popular books");
      console.log("   This is expected for new users\n");
    } else {
      console.log("✅ User has history - should get personalized recommendations\n");
      
      // Analyze what categories user is interested in
      const viewedBooks = await interactions
        .find({
          userId: user._id,
          eventType: "view",
          bookCategories: { $exists: true },
        })
        .toArray();

      if (viewedBooks.length > 0) {
        const allCategories = viewedBooks.flatMap((v) => v.bookCategories || []);
        const categoryFreq = {};
        allCategories.forEach((cat) => {
          categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;
        });

        const topCategories = Object.entries(categoryFreq)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        if (topCategories.length > 0) {
          console.log("User's top categories:");
          topCategories.forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count} views`);
          });
          console.log();
        }
      }
    }

    // 6. Check for issues
    console.log("6️⃣ Potential Issues");
    console.log("─".repeat(50));
    
    const issues = [];
    
    if (interactionCount === 0) {
      issues.push("❌ No interactions tracked - view tracking may not be working");
    }
    
    if (availableBooks === 0) {
      issues.push("❌ No available books - add books to the catalog");
    }
    
    const booksWithCategoriesCount = await books.countDocuments({
      status: "available",
      categories: { $exists: true, $ne: [] },
    });
    
    const booksWithTagsCount = await books.countDocuments({
      status: "available",
      tags: { $exists: true, $ne: [] },
    });
    
    if (booksWithCategoriesCount === 0 && booksWithTagsCount === 0) {
      issues.push("⚠️  Books missing categories/tags - limits personalization");
    }
    
    if (issues.length === 0) {
      console.log("✅ No issues detected!\n");
    } else {
      issues.forEach((issue) => console.log(issue));
      console.log();
    }

    // 7. Recommendations
    console.log("7️⃣ Recommendations");
    console.log("─".repeat(50));
    
    if (interactionCount === 0 && transactionCount === 0) {
      console.log("💡 To get personalized recommendations:");
      console.log("   1. View 5-10 books in the catalog");
      console.log("   2. Search for topics you're interested in");
      console.log("   3. Borrow books (high-value signal)");
      console.log("   4. Refresh the dashboard\n");
    } else {
      console.log("💡 Your recommendations should be personalized!");
      console.log("   If you're only seeing 'Atomic Habits':");
      console.log("   1. Check browser console for errors");
      console.log("   2. Clear browser cache");
      console.log("   3. Try hard refresh (Ctrl+Shift+R)");
      console.log("   4. Check Network tab for API calls\n");
    }

    console.log("✅ Diagnosis complete!");

  } catch (error) {
    console.error("\n❌ Error during diagnosis:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

diagnose();
