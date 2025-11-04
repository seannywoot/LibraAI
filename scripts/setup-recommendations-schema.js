/**
 * Database Schema Setup for Smart Book Recommendation System
 * 
 * This script:
 * 1. Creates user_interactions collection with indexes
 * 2. Adds categories and tags fields to existing books
 * 3. Sets up TTL index for automatic data cleanup
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, "..", ".env.local");
let uri;

try {
  const envContent = readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.startsWith("MONGODB_URI=") || line.startsWith("MONGODB_URL=") || line.startsWith("DATABASE_URL=")) {
      uri = line.split("=")[1].trim().replace(/['"]/g, "");
      break;
    }
  }
} catch (error) {
  console.error("❌ Could not read .env.local file");
}

if (!uri) {
  uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
}

if (!uri) {
  console.error("❌ Missing MONGODB_URI in environment");
  process.exit(1);
}

// Category mapping based on shelf codes and subjects
const CATEGORY_MAPPING = {
  "CS": ["Computer Science", "Programming"],
  "MATH": ["Mathematics", "Statistics"],
  "ENG": ["Engineering", "Technology"],
  "SCI": ["Science", "Research"],
  "BUS": ["Business", "Management"],
  "ART": ["Arts", "Humanities"],
  "MED": ["Medicine", "Health Sciences"],
  "LAW": ["Law", "Legal Studies"],
};

// Tag generation based on common keywords in titles
const TAG_KEYWORDS = {
  "javascript": ["javascript", "js", "node"],
  "python": ["python", "django", "flask"],
  "web-development": ["web", "html", "css", "frontend", "backend"],
  "machine-learning": ["machine learning", "ml", "ai", "artificial intelligence"],
  "data-science": ["data science", "analytics", "big data"],
  "algorithms": ["algorithm", "data structure"],
  "database": ["database", "sql", "mongodb", "nosql"],
  "security": ["security", "cryptography", "cyber"],
  "mobile": ["mobile", "android", "ios", "app"],
  "cloud": ["cloud", "aws", "azure", "devops"],
  "beginner": ["introduction", "beginner", "basics", "fundamentals"],
  "advanced": ["advanced", "expert", "professional"],
};

async function setupSchema() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db();
    
    // Step 1: Create user_interactions collection
    console.log("\n📦 Setting up user_interactions collection...");
    
    const collections = await db.listCollections({ name: "user_interactions" }).toArray();
    
    if (collections.length === 0) {
      await db.createCollection("user_interactions");
      console.log("✅ Created user_interactions collection");
    } else {
      console.log("ℹ️  user_interactions collection already exists");
    }
    
    // Step 2: Create indexes
    console.log("\n🔍 Creating indexes...");
    
    const interactionsCollection = db.collection("user_interactions");
    
    // Index for fast user history queries
    await interactionsCollection.createIndex(
      { userId: 1, timestamp: -1 },
      { name: "userId_timestamp_idx" }
    );
    console.log("✅ Created index: userId_timestamp_idx");
    
    // Index for filtering by event type
    await interactionsCollection.createIndex(
      { userEmail: 1, eventType: 1 },
      { name: "userEmail_eventType_idx" }
    );
    console.log("✅ Created index: userEmail_eventType_idx");
    
    // Index for book-specific lookups
    await interactionsCollection.createIndex(
      { bookId: 1 },
      { name: "bookId_idx", sparse: true }
    );
    console.log("✅ Created index: bookId_idx");
    
    // TTL index for automatic cleanup (90 days)
    await interactionsCollection.createIndex(
      { expiresAt: 1 },
      { name: "expiresAt_ttl_idx", expireAfterSeconds: 0 }
    );
    console.log("✅ Created TTL index: expiresAt_ttl_idx (90 days)");
    
    // Step 3: Add categories and tags to books collection
    console.log("\n📚 Updating books collection schema...");
    
    const booksCollection = db.collection("books");
    const booksCount = await booksCollection.countDocuments();
    
    console.log(`ℹ️  Found ${booksCount} books in collection`);
    
    if (booksCount > 0) {
      // Add categories and tags fields to books that don't have them
      const booksToUpdate = await booksCollection.find({
        $or: [
          { categories: { $exists: false } },
          { tags: { $exists: false } }
        ]
      }).toArray();
      
      console.log(`ℹ️  Updating ${booksToUpdate.length} books with categories and tags...`);
      
      let updatedCount = 0;
      
      for (const book of booksToUpdate) {
        const categories = generateCategories(book);
        const tags = generateTags(book);
        
        await booksCollection.updateOne(
          { _id: book._id },
          {
            $set: {
              categories: categories,
              tags: tags,
              popularityScore: 0, // Initialize popularity score
            }
          }
        );
        
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          process.stdout.write(`\r   Updated ${updatedCount}/${booksToUpdate.length} books...`);
        }
      }
      
      if (updatedCount > 0) {
        console.log(`\r✅ Updated ${updatedCount} books with categories and tags`);
      }
    }
    
    // Step 4: Create index on categories and tags for faster recommendations
    console.log("\n🔍 Creating indexes on books collection...");
    
    await booksCollection.createIndex(
      { categories: 1 },
      { name: "categories_idx" }
    );
    console.log("✅ Created index: categories_idx");
    
    await booksCollection.createIndex(
      { tags: 1 },
      { name: "tags_idx" }
    );
    console.log("✅ Created index: tags_idx");
    
    await booksCollection.createIndex(
      { popularityScore: -1 },
      { name: "popularityScore_idx" }
    );
    console.log("✅ Created index: popularityScore_idx");
    
    // Step 5: Verify setup
    console.log("\n✨ Verifying setup...");
    
    const interactionIndexes = await interactionsCollection.indexes();
    console.log(`✅ user_interactions has ${interactionIndexes.length} indexes`);
    
    const bookIndexes = await booksCollection.indexes();
    console.log(`✅ books collection has ${bookIndexes.length} indexes`);
    
    console.log("\n🎉 Schema setup completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Error setting up schema:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

/**
 * Generate categories for a book based on shelf code
 */
function generateCategories(book) {
  const categories = [];
  
  // Extract from shelf code
  if (book.shelf) {
    const shelfPrefix = book.shelf.split(/[0-9]/)[0].toUpperCase();
    const mappedCategories = CATEGORY_MAPPING[shelfPrefix];
    if (mappedCategories) {
      categories.push(...mappedCategories);
    }
  }
  
  // Default category if none found
  if (categories.length === 0) {
    categories.push("General");
  }
  
  return [...new Set(categories)]; // Remove duplicates
}

/**
 * Generate tags for a book based on title and author
 */
function generateTags(book) {
  const tags = [];
  const searchText = `${book.title || ""} ${book.author || ""}`.toLowerCase();
  
  // Check for keyword matches
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        tags.push(tag);
        break; // Only add tag once
      }
    }
  }
  
  // Add format as a tag
  if (book.format) {
    tags.push(book.format.toLowerCase());
  }
  
  // Add year-based tags
  if (book.year) {
    if (book.year >= 2020) {
      tags.push("recent");
    } else if (book.year >= 2010) {
      tags.push("modern");
    } else if (book.year < 2000) {
      tags.push("classic");
    }
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

// Run the setup
setupSchema();
