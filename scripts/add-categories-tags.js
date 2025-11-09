/**
 * Add Categories and Tags to Books
 * Automatically categorizes books based on title/author
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

// Category and tag mappings based on keywords
const categoryMappings = {
  "Computer Science": ["programming", "code", "software", "algorithm", "data structure", "computer", "javascript", "python", "java", "web", "design patterns"],
  "Business": ["business", "management", "leadership", "entrepreneur", "marketing", "finance", "economics", "startup"],
  "Self-Help": ["habits", "atomic", "mindset", "success", "productivity", "motivation", "self-help", "personal development"],
  "Fiction": ["novel", "story", "fiction", "tale", "mockingbird", "gatsby"],
  "Science": ["science", "physics", "chemistry", "biology", "universe", "cosmos"],
  "Mathematics": ["math", "calculus", "algebra", "geometry", "statistics"],
  "History": ["history", "historical", "war", "ancient", "civilization"],
  "Philosophy": ["philosophy", "ethics", "logic", "thinking", "mind"],
  "Psychology": ["psychology", "mental", "behavior", "cognitive", "brain"],
  "Education": ["education", "teaching", "learning", "pedagogy", "school"],
};

const tagMappings = {
  "Programming": ["programming", "code", "coding", "software", "developer"],
  "Algorithms": ["algorithm", "data structure", "complexity"],
  "Web Development": ["web", "javascript", "html", "css", "react", "node"],
  "Software Engineering": ["software engineering", "design patterns", "architecture", "refactoring"],
  "Leadership": ["leadership", "management", "team", "leader"],
  "Productivity": ["productivity", "habits", "efficiency", "time management"],
  "Success": ["success", "achievement", "goals", "mindset"],
  "Fiction": ["fiction", "novel", "story"],
  "Non-Fiction": ["non-fiction", "biography", "memoir"],
  "Science": ["science", "scientific", "research"],
  "Business Strategy": ["strategy", "business", "competitive"],
};

function categorizeBook(book) {
  const searchText = `${book.title} ${book.author} ${book.description || ""}`.toLowerCase();
  
  const categories = [];
  const tags = [];

  // Find matching categories
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      categories.push(category);
    }
  }

  // Find matching tags
  for (const [tag, keywords] of Object.entries(tagMappings)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Default category if none found
  if (categories.length === 0) {
    categories.push("General");
  }

  // Default tags if none found
  if (tags.length === 0) {
    tags.push("General Interest");
  }

  return { categories, tags };
}

async function addCategoriesAndTags() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI not found");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const books = db.collection("books");

    // Get all books
    const allBooks = await books.find({}).toArray();
    console.log(`📚 Found ${allBooks.length} books\n`);

    let updated = 0;
    let skipped = 0;

    for (const book of allBooks) {
      // Skip if already has categories and tags
      if (book.categories && book.categories.length > 0 && book.tags && book.tags.length > 0) {
        skipped++;
        continue;
      }

      const { categories, tags } = categorizeBook(book);

      await books.updateOne(
        { _id: book._id },
        {
          $set: {
            categories,
            tags,
            updatedAt: new Date(),
          },
        }
      );

      console.log(`✅ ${book.title}`);
      console.log(`   Categories: ${categories.join(", ")}`);
      console.log(`   Tags: ${tags.join(", ")}\n`);

      updated++;
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Updated: ${updated} books`);
    console.log(`⏭️  Skipped: ${skipped} books (already had categories/tags)`);
    console.log("=".repeat(50));

    // Show summary
    console.log("\n📊 Category Distribution:");
    const categoryStats = await books.aggregate([
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    categoryStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} books`);
    });

    console.log("\n✅ Done! Recommendations should now be personalized.");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

addCategoriesAndTags();
