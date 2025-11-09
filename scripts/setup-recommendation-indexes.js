/**
 * Setup Database Indexes for Recommendation Engine v3.0
 * Run this script to create optimal indexes for the recommendation system
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function setupIndexes() {
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

    // User Interactions Collection
    console.log("\n📊 Creating indexes for user_interactions...");
    const interactions = db.collection("user_interactions");
    
    try {
      await interactions.createIndex({ userId: 1, timestamp: -1 });
      console.log("  ✓ userId + timestamp");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  userId + timestamp (already exists)");
      } else {
        throw err;
      }
    }
    
    try {
      await interactions.createIndex({ eventType: 1, timestamp: -1 });
      console.log("  ✓ eventType + timestamp");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  eventType + timestamp (already exists)");
      } else {
        throw err;
      }
    }
    
    try {
      await interactions.createIndex({ bookId: 1 });
      console.log("  ✓ bookId");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  bookId (already exists)");
      } else {
        throw err;
      }
    }

    // Books Collection
    console.log("\n📚 Creating indexes for books...");
    const books = db.collection("books");
    
    const bookIndexes = [
      { index: { status: 1, categories: 1 }, name: "status + categories" },
      { index: { status: 1, tags: 1 }, name: "status + tags" },
      { index: { status: 1, author: 1 }, name: "status + author" },
      { index: { status: 1, publisher: 1 }, name: "status + publisher" },
      { index: { status: 1, format: 1 }, name: "status + format" },
      { index: { status: 1, year: 1 }, name: "status + year" },
      { index: { popularityScore: -1 }, name: "popularityScore" },
    ];

    for (const { index, name } of bookIndexes) {
      try {
        await books.createIndex(index);
        console.log(`  ✓ ${name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠️  ${name} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    // Transactions Collection
    console.log("\n📋 Creating indexes for transactions...");
    const transactions = db.collection("transactions");
    
    const transactionIndexes = [
      { index: { userId: 1, status: 1, borrowedAt: -1 }, name: "userId + status + borrowedAt" },
      { index: { bookId: 1, status: 1 }, name: "bookId + status" },
    ];

    for (const { index, name } of transactionIndexes) {
      try {
        await transactions.createIndex(index);
        console.log(`  ✓ ${name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠️  ${name} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    // Bookmarks Collection
    console.log("\n🔖 Creating indexes for bookmarks...");
    const bookmarks = db.collection("bookmarks");
    
    const bookmarkIndexes = [
      { index: { userId: 1 }, name: "userId" },
      { index: { bookId: 1 }, name: "bookId" },
    ];

    for (const { index, name } of bookmarkIndexes) {
      try {
        await bookmarks.createIndex(index);
        console.log(`  ✓ ${name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠️  ${name} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    // Notes Collection
    console.log("\n📝 Creating indexes for notes...");
    const notes = db.collection("notes");
    
    const noteIndexes = [
      { index: { userId: 1 }, name: "userId" },
      { index: { bookId: 1 }, name: "bookId" },
    ];

    for (const { index, name } of noteIndexes) {
      try {
        await notes.createIndex(index);
        console.log(`  ✓ ${name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠️  ${name} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    // Personal Libraries Collection
    console.log("\n📖 Creating indexes for personal_libraries...");
    const personalLibraries = db.collection("personal_libraries");
    
    const libraryIndexes = [
      { index: { userId: 1 }, name: "userId" },
      { index: { isbn: 1 }, name: "isbn" },
    ];

    for (const { index, name } of libraryIndexes) {
      try {
        await personalLibraries.createIndex(index);
        console.log(`  ✓ ${name}`);
      } catch (err) {
        if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠️  ${name} (already exists)`);
        } else {
          throw err;
        }
      }
    }

    // Users Collection
    console.log("\n👤 Creating indexes for users...");
    const users = db.collection("users");
    
    try {
      await users.createIndex({ email: 1 }, { unique: true });
      console.log("  ✓ email (unique)");
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log("  ⚠️  email (already exists)");
      } else {
        throw err;
      }
    }

    console.log("\n✅ All indexes created successfully!");
    console.log("\n📊 Index Statistics:");

    // Show index stats
    const collections = [
      "user_interactions",
      "books",
      "transactions",
      "bookmarks",
      "notes",
      "personal_libraries",
      "users",
    ];

    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      console.log(`\n${collectionName}: ${indexes.length} indexes`);
      indexes.forEach((index) => {
        console.log(`  - ${index.name}`);
      });
    }

  } catch (error) {
    console.error("\n❌ Error setting up indexes:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

setupIndexes();
