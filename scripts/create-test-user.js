/**
 * Create Test User
 * 
 * Creates a new student user account for testing.
 * 
 * Usage: node scripts/create-test-user.js
 */

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";

async function createTestUser() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✓ Connected to MongoDB\n");

    const db = client.db(DB_NAME);
    const users = db.collection("users");

    const email = "recommendation@test.com";
    const password = "LibraAI2025";
    const name = "Recommendation Test User";

    // Check if user already exists
    const existing = await users.findOne({ email });
    if (existing) {
      console.log(`⚠️  User already exists: ${email}`);
      console.log(`   User ID: ${existing._id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`   Role: ${existing.role}`);
      console.log("\n   To reset password, delete and recreate:");
      console.log(`   db.users.deleteOne({ email: "${email}" })`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await users.insertOne({
      email,
      password: hashedPassword,
      name,
      role: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ User created successfully!\n");
    console.log("═".repeat(80));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Name: ${name}`);
    console.log(`Role: student`);
    console.log(`User ID: ${result.insertedId}`);
    console.log("═".repeat(80));

    console.log("\n📋 Next Steps:");
    console.log("1. Login at: http://localhost:3000");
    console.log(`2. Email: ${email}`);
    console.log(`3. Password: ${password}`);
    console.log("4. View some books to build interaction history");
    console.log("5. Check recommendations to see personalization");

    console.log("\n🧪 Testing Recommendations:");
    console.log("─".repeat(80));
    console.log("1. View 5-6 books in Science Fiction category");
    console.log("2. View 2-3 books in History category");
    console.log("3. Bookmark 1-2 books");
    console.log("4. Search for 'space exploration'");
    console.log("5. Go to dashboard and check recommendations");
    console.log("6. Should see:");
    console.log("   - 'You love Science Fiction' (top category)");
    console.log("   - 'You like History' (2nd category)");
    console.log("   - 'Try [Category]' (exploration)");

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

console.log("👤 Creating Test User\n");
console.log("═".repeat(80));

createTestUser()
  .then(() => {
    console.log("\n✓ User creation completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ User creation failed:", error);
    process.exit(1);
  });
