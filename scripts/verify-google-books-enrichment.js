/**
 * Verify Google Books Enrichment
 * 
 * This script verifies that books have been properly enriched with Google Books data
 * and checks database indexes
 * 
 * Usage:
 *   node scripts/verify-google-books-enrichment.js
 */

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function verifyEnrichment() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db();
    const books = db.collection("books");

    console.log("=" .repeat(60));
    console.log("📊 GOOGLE BOOKS ENRICHMENT VERIFICATION");
    console.log("=" .repeat(60));

    // Total books
    const totalBooks = await books.countDocuments();
    console.log(`\n📚 Total Books: ${totalBooks}`);

    // Books with covers
    const booksWithCovers = await books.countDocuments({ 
      coverImage: { $exists: true, $ne: null, $ne: "" } 
    });
    const coverPercentage = Math.round((booksWithCovers / totalBooks) * 100);
    console.log(`\n📸 Books with Cover Images:`);
    console.log(`   ${booksWithCovers} / ${totalBooks} (${coverPercentage}%)`);
    
    if (coverPercentage >= 80) {
      console.log(`   ✅ Excellent coverage!`);
    } else if (coverPercentage >= 60) {
      console.log(`   ⚠️  Good, but could be better`);
    } else {
      console.log(`   ❌ Low coverage - run upsert script`);
    }

    // Books with categories
    const booksWithCategories = await books.countDocuments({ 
      categories: { $exists: true, $not: { $size: 0 } } 
    });
    const categoryPercentage = Math.round((booksWithCategories / totalBooks) * 100);
    console.log(`\n📂 Books with Categories:`);
    console.log(`   ${booksWithCategories} / ${totalBooks} (${categoryPercentage}%)`);
    
    if (categoryPercentage >= 90) {
      console.log(`   ✅ Excellent categorization!`);
    } else if (categoryPercentage >= 70) {
      console.log(`   ⚠️  Good, but some books need categories`);
    } else {
      console.log(`   ❌ Poor categorization - run upsert script`);
    }

    // Books with descriptions
    const booksWithDescriptions = await books.countDocuments({ 
      description: { $exists: true, $ne: null, $ne: "" } 
    });
    const descriptionPercentage = Math.round((booksWithDescriptions / totalBooks) * 100);
    console.log(`\n📝 Books with Descriptions:`);
    console.log(`   ${booksWithDescriptions} / ${totalBooks} (${descriptionPercentage}%)`);
    
    if (descriptionPercentage >= 80) {
      console.log(`   ✅ Great descriptions!`);
    } else if (descriptionPercentage >= 60) {
      console.log(`   ⚠️  Decent, but more would help`);
    } else {
      console.log(`   ❌ Many books missing descriptions`);
    }

    // Books enriched by Google Books
    const enrichedBooks = await books.countDocuments({ 
      googleBooksEnriched: true 
    });
    console.log(`\n🔍 Books Enriched by Google Books:`);
    console.log(`   ${enrichedBooks} / ${totalBooks} (${Math.round((enrichedBooks / totalBooks) * 100)}%)`);

    // Category distribution
    console.log(`\n📂 Category Distribution (Top 15):`);
    const categoryStats = await books.aggregate([
      { $match: { categories: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$categories" },
      { $group: { _id: "$categories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]).toArray();

    categoryStats.forEach((stat, index) => {
      const bar = "█".repeat(Math.ceil(stat.count / 2));
      console.log(`   ${(index + 1).toString().padStart(2)}. ${stat._id.padEnd(25)} ${stat.count.toString().padStart(3)} ${bar}`);
    });

    // Books with tags
    const booksWithTags = await books.countDocuments({ 
      tags: { $exists: true, $not: { $size: 0 } } 
    });
    console.log(`\n🏷️  Books with Tags:`);
    console.log(`   ${booksWithTags} / ${totalBooks} (${Math.round((booksWithTags / totalBooks) * 100)}%)`);

    // Sample enriched books
    console.log(`\n📖 Sample Enriched Books (5 random):`);
    const sampleBooks = await books.aggregate([
      { $match: { coverImage: { $exists: true, $ne: null } } },
      { $sample: { size: 5 } }
    ]).toArray();

    sampleBooks.forEach((book, index) => {
      console.log(`\n   ${index + 1}. ${book.title}`);
      console.log(`      Author: ${book.author}`);
      console.log(`      Cover: ${book.coverImage ? '✅ Yes' : '❌ No'}`);
      console.log(`      Categories: ${book.categories?.join(', ') || 'None'}`);
      console.log(`      Tags: ${book.tags?.length || 0} tags`);
      console.log(`      Description: ${book.description ? `${book.description.substring(0, 80)}...` : 'None'}`);
    });

    // Check indexes
    console.log(`\n\n📊 Database Indexes:`);
    const indexes = await books.indexes();
    console.log(`   Total indexes: ${indexes.length}`);
    
    const requiredIndexes = ['isbn', 'categories', 'tags', 'coverImage', 'googleBooksId'];
    const existingIndexNames = indexes.map(idx => idx.name);
    
    console.log(`\n   Required indexes:`);
    requiredIndexes.forEach(indexName => {
      const exists = existingIndexNames.some(name => name.includes(indexName));
      console.log(`      ${exists ? '✅' : '❌'} ${indexName}`);
    });

    console.log(`\n   All indexes:`);
    indexes.forEach(index => {
      const keys = Object.keys(index.key).join(', ');
      console.log(`      - ${index.name} (${keys})`);
    });

    // Books missing data
    console.log(`\n\n⚠️  Books Missing Data:`);
    
    const missingCovers = await books.countDocuments({ 
      $or: [
        { coverImage: { $exists: false } },
        { coverImage: null },
        { coverImage: "" }
      ]
    });
    console.log(`   Missing covers: ${missingCovers}`);
    
    const missingCategories = await books.countDocuments({ 
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } }
      ]
    });
    console.log(`   Missing categories: ${missingCategories}`);
    
    const missingDescriptions = await books.countDocuments({ 
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: "" }
      ]
    });
    console.log(`   Missing descriptions: ${missingDescriptions}`);

    if (missingCovers > 0 || missingCategories > 0) {
      console.log(`\n   💡 Tip: Run the upsert script to enrich these books:`);
      console.log(`      node scripts/upsert-google-books-data.js`);
    }

    // Overall health score
    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`📈 OVERALL ENRICHMENT HEALTH SCORE`);
    console.log(`${"=".repeat(60)}`);
    
    const healthScore = Math.round(
      (coverPercentage * 0.4) + 
      (categoryPercentage * 0.4) + 
      (descriptionPercentage * 0.2)
    );
    
    console.log(`\n   Score: ${healthScore}/100`);
    
    if (healthScore >= 90) {
      console.log(`   Grade: A+ 🌟`);
      console.log(`   Status: Excellent! Your library is well-enriched.`);
    } else if (healthScore >= 80) {
      console.log(`   Grade: A 👍`);
      console.log(`   Status: Great! Minor improvements possible.`);
    } else if (healthScore >= 70) {
      console.log(`   Grade: B 👌`);
      console.log(`   Status: Good, but could use more enrichment.`);
    } else if (healthScore >= 60) {
      console.log(`   Grade: C ⚠️`);
      console.log(`   Status: Needs improvement. Run upsert script.`);
    } else {
      console.log(`   Grade: D ❌`);
      console.log(`   Status: Poor enrichment. Definitely run upsert script.`);
    }

    console.log(`\n✅ Verification complete!\n`);

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyEnrichment();
