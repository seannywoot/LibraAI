/**
 * Seed Test User with Interactions
 * 
 * Creates a test user and seeds realistic interaction data for testing
 * the recommendation engine's personalization logic.
 * 
 * Usage: node scripts/seed-test-user-with-interactions.js
 */

const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

// Test user credentials
const TEST_USER = {
  email: "rectest@student.edu",
  password: "TestRec2025!",
  name: "Recommendation Tester",
  role: "student",
};

// Interaction patterns to seed
const INTERACTION_PATTERNS = {
  // Heavy interest in Science Fiction
  scienceFiction: {
    views: 8,
    bookmarks: 2,
    searches: ["space exploration", "sci-fi novels", "future technology"],
  },
  // Moderate interest in History
  history: {
    views: 4,
    bookmarks: 1,
    searches: ["world war", "ancient civilizations"],
  },
  // Light interest in Fantasy
  fantasy: {
    views: 2,
    bookmarks: 0,
    searches: ["fantasy books"],
  },
};

async function seedTestUser() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const users = db.collection("users");
    const books = db.collection("books");
    const interactions = db.collection("user_interactions");

    // Step 1: Create or update user
    console.log("📝 Step 1: Creating test user...");
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
    
    const existingUser = await users.findOne({ email: TEST_USER.email });
    let userId;

    if (existingUser) {
      console.log(`   ⚠️  User exists, updating: ${TEST_USER.email}`);
      await users.updateOne(
        { email: TEST_USER.email },
        {
          $set: {
            password: hashedPassword,
            passwordHash: hashedPassword,
            name: TEST_USER.name,
            role: TEST_USER.role,
            updatedAt: new Date(),
          },
        }
      );
      userId = existingUser._id;
    } else {
      const result = await users.insertOne({
        email: TEST_USER.email,
        password: hashedPassword,
        passwordHash: hashedPassword,
        name: TEST_USER.name,
        role: TEST_USER.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      userId = result.insertedId;
      console.log(`   ✅ User created: ${TEST_USER.email}`);
    }

    console.log(`   User ID: ${userId}\n`);

    // Step 2: Clear existing interactions for this user
    console.log("🧹 Step 2: Clearing old interactions...");
    const deleteResult = await interactions.deleteMany({ userId: userId.toString() });
    console.log(`   Deleted ${deleteResult.deletedCount} old interactions\n`);

    // Step 3: Get books by category
    console.log("📚 Step 3: Fetching books by category...");
    const sciFiBooks = await books
      .find({ categories: { $in: ["Science Fiction", "Sci-Fi"] } })
      .limit(10)
      .toArray();
    const historyBooks = await books
      .find({ categories: "History" })
      .limit(6)
      .toArray();
    const fantasyBooks = await books
      .find({ categories: "Fantasy" })
      .limit(3)
      .toArray();

    console.log(`   Found ${sciFiBooks.length} Science Fiction books`);
    console.log(`   Found ${historyBooks.length} History books`);
    console.log(`   Found ${fantasyBooks.length} Fantasy books\n`);

    if (sciFiBooks.length === 0 || historyBooks.length === 0) {
      console.log("⚠️  Warning: Not enough books found. Run seed scripts first:");
      console.log("   node scripts/seed-recommendation-test-data.js");
      console.log("\nContinuing with available books...\n");
    }

    // Step 4: Seed interactions
    console.log("💾 Step 4: Seeding interactions...");
    const now = Date.now();
    const interactionsToInsert = [];
    let viewCount = 0;
    let bookmarkCount = 0;
    let searchCount = 0;

    // Helper to create interaction
    const createInteraction = (type, bookId, category, daysAgo = 0) => {
      const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
      return {
        userId: userId.toString(),
        type,
        bookId: bookId.toString(),
        category,
        timestamp: new Date(timestamp),
        createdAt: new Date(timestamp),
      };
    };

    // Science Fiction interactions (heavy)
    sciFiBooks.slice(0, INTERACTION_PATTERNS.scienceFiction.views).forEach((book, idx) => {
      interactionsToInsert.push(createInteraction("view", book._id, "Science Fiction", idx));
      viewCount++;
    });
    sciFiBooks.slice(0, INTERACTION_PATTERNS.scienceFiction.bookmarks).forEach((book, idx) => {
      interactionsToInsert.push(createInteraction("bookmark", book._id, "Science Fiction", idx));
      bookmarkCount++;
    });
    INTERACTION_PATTERNS.scienceFiction.searches.forEach((query, idx) => {
      interactionsToInsert.push({
        userId: userId.toString(),
        type: "search",
        query,
        timestamp: new Date(now - idx * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - idx * 24 * 60 * 60 * 1000),
      });
      searchCount++;
    });

    // History interactions (moderate)
    historyBooks.slice(0, INTERACTION_PATTERNS.history.views).forEach((book, idx) => {
      interactionsToInsert.push(createInteraction("view", book._id, "History", idx + 1));
      viewCount++;
    });
    historyBooks.slice(0, INTERACTION_PATTERNS.history.bookmarks).forEach((book, idx) => {
      interactionsToInsert.push(createInteraction("bookmark", book._id, "History", idx + 1));
      bookmarkCount++;
    });
    INTERACTION_PATTERNS.history.searches.forEach((query, idx) => {
      interactionsToInsert.push({
        userId: userId.toString(),
        type: "search",
        query,
        timestamp: new Date(now - (idx + 3) * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - (idx + 3) * 24 * 60 * 60 * 1000),
      });
      searchCount++;
    });

    // Fantasy interactions (light)
    fantasyBooks.slice(0, INTERACTION_PATTERNS.fantasy.views).forEach((book, idx) => {
      interactionsToInsert.push(createInteraction("view", book._id, "Fantasy", idx + 2));
      viewCount++;
    });
    INTERACTION_PATTERNS.fantasy.searches.forEach((query, idx) => {
      interactionsToInsert.push({
        userId: userId.toString(),
        type: "search",
        query,
        timestamp: new Date(now - (idx + 5) * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - (idx + 5) * 24 * 60 * 60 * 1000),
      });
      searchCount++;
    });

    if (interactionsToInsert.length > 0) {
      await interactions.insertMany(interactionsToInsert);
      console.log(`   ✅ Inserted ${interactionsToInsert.length} interactions`);
      console.log(`      - ${viewCount} views`);
      console.log(`      - ${bookmarkCount} bookmarks`);
      console.log(`      - ${searchCount} searches\n`);
    } else {
      console.log("   ⚠️  No interactions to insert\n");
    }

    // Step 5: Verify interactions
    console.log("🔍 Step 5: Verifying interactions...");
    const userInteractions = await interactions
      .find({ userId: userId.toString() })
      .sort({ timestamp: -1 })
      .toArray();

    const byType = userInteractions.reduce((acc, int) => {
      acc[int.type] = (acc[int.type] || 0) + 1;
      return acc;
    }, {});

    const byCategory = userInteractions
      .filter((int) => int.category)
      .reduce((acc, int) => {
        acc[int.category] = (acc[int.category] || 0) + 1;
        return acc;
      }, {});

    console.log("   Interaction Summary:");
    console.log("   ─".repeat(40));
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    console.log("\n   Category Breakdown:");
    console.log("   ─".repeat(40));
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} interactions`);
      });

    // Final output
    console.log("\n" + "═".repeat(80));
    console.log("✅ TEST USER READY FOR RECOMMENDATION TESTING");
    console.log("═".repeat(80));
    console.log(`\n📧 Email: ${TEST_USER.email}`);
    console.log(`🔑 Password: ${TEST_USER.password}`);
    console.log(`👤 Name: ${TEST_USER.name}`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`📊 Total Interactions: ${userInteractions.length}`);

    console.log("\n🎯 Expected Recommendation Behavior:");
    console.log("─".repeat(80));
    console.log("1. Top Match: 'You love Science Fiction' (8 views, 2 bookmarks)");
    console.log("2. Second Match: 'You like History' (4 views, 1 bookmark)");
    console.log("3. Third Match: 'Try Fantasy' (2 views, exploration)");
    console.log("4. Search-based: Books matching 'space', 'sci-fi', 'history'");

    console.log("\n🧪 Testing Steps:");
    console.log("─".repeat(80));
    console.log("1. Login at: http://localhost:3000");
    console.log(`2. Email: ${TEST_USER.email}`);
    console.log(`3. Password: ${TEST_USER.password}`);
    console.log("4. Go to Dashboard → Check 'For You' recommendations");
    console.log("5. Go to Catalog → Check sidebar recommendations");
    console.log("6. Verify match reasons show correct categories");
    console.log("7. View more books to see recommendations update");

    console.log("\n📝 Manual Testing:");
    console.log("─".repeat(80));
    console.log("• View 3-4 more Science Fiction books");
    console.log("• Click 'Refresh' button on recommendations");
    console.log("• Should see updated recommendations immediately");
    console.log("• Try viewing books in a new category (e.g., Mystery)");
    console.log("• Refresh again to see new category appear");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    throw error;
  } finally {
    await client.close();
  }
}

console.log("🌱 Seeding Test User with Interactions\n");
console.log("═".repeat(80));

seedTestUser()
  .then(() => {
    console.log("\n✓ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  });
