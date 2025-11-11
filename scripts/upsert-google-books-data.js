/**
 * Upsert Google Books Data
 * 
 * This script enriches existing books with data from Google Books API:
 * - Book covers (thumbnail images)
 * - Categories and tags
 * - Descriptions
 * - Publisher information
 * - ISBN data
 * 
 * Usage:
 *   node scripts/upsert-google-books-data.js
 *   node scripts/upsert-google-books-data.js --force  (update all books)
 *   node scripts/upsert-google-books-data.js --isbn=9780134685991  (specific book)
 */

const { MongoClient } = require("mongodb");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const DELAY_MS = 1000; // 1 second delay between API calls to respect rate limits
const forceUpdate = process.argv.includes("--force");
const specificIsbn = process.argv.find(arg => arg.startsWith("--isbn="))?.split("=")[1];

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch book data from Google Books API
async function fetchGoogleBooksData(isbn, title, author) {
  return new Promise((resolve, reject) => {
    let query;
    
    if (isbn) {
      query = `isbn:${isbn}`;
    } else if (title && author) {
      query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`;
    } else if (title) {
      query = `intitle:${encodeURIComponent(title)}`;
    } else {
      resolve(null);
      return;
    }

    const url = `${GOOGLE_BOOKS_API}?q=${query}&maxResults=1`;

    https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.items && parsed.items.length > 0) {
            resolve(parsed.items[0]);
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", (err) => {
      reject(err);
    });
  });
}

// Process categories from Google Books format
function processCategories(volumeInfo) {
  let categories = [];
  
  if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
    // Google Books categories are like "Computers / Programming / Java"
    categories = volumeInfo.categories.flatMap(cat => 
      cat.split('/').map(c => c.trim())
    ).filter(c => c.length > 0);
    
    // Remove duplicates
    categories = [...new Set(categories)];
  }

  return categories.length > 0 ? categories : ["General"];
}

// Process tags/subjects from Google Books
function processTags(volumeInfo) {
  let tags = [];
  
  if (volumeInfo.subjects && Array.isArray(volumeInfo.subjects)) {
    tags = volumeInfo.subjects.map(s => s.trim()).filter(s => s.length > 0);
    tags = [...new Set(tags)];
  }

  return tags;
}

// Extract enriched data from Google Books response
function extractBookData(googleBook) {
  const volumeInfo = googleBook.volumeInfo;
  
  const data = {
    description: volumeInfo.description || null,
    publisher: volumeInfo.publisher || null,
    publishedDate: volumeInfo.publishedDate || null,
    year: volumeInfo.publishedDate ? parseInt(volumeInfo.publishedDate.substring(0, 4)) : null,
    pageCount: volumeInfo.pageCount || null,
    language: volumeInfo.language || null,
    thumbnail: volumeInfo.imageLinks?.thumbnail || null,
    coverImage: volumeInfo.imageLinks?.thumbnail || null,
    categories: processCategories(volumeInfo),
    tags: processTags(volumeInfo),
    googleBooksId: googleBook.id || null,
  };

  // Get ISBN-13 if available
  if (volumeInfo.industryIdentifiers) {
    const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
    if (isbn13) {
      data.isbn = isbn13.identifier;
    }
  }

  return data;
}

// Setup database indexes
async function setupIndexes(db) {
  console.log("\n📊 Setting up database indexes...");
  
  const books = db.collection("books");
  
  const indexes = [
    { index: { isbn: 1 }, options: { sparse: true }, name: "isbn" },
    { index: { title: 1, author: 1 }, name: "title + author" },
    { index: { categories: 1 }, name: "categories" },
    { index: { tags: 1 }, options: { sparse: true }, name: "tags" },
    { index: { googleBooksId: 1 }, options: { sparse: true }, name: "googleBooksId" },
    { index: { coverImage: 1 }, options: { sparse: true }, name: "coverImage" },
  ];

  for (const { index, options, name } of indexes) {
    try {
      await books.createIndex(index, options || {});
      console.log(`  ✓ ${name}`);
    } catch (err) {
      if (err.code === 85 || err.codeName === 'IndexOptionsConflict') {
        console.log(`  ⚠️  ${name} (already exists)`);
      } else {
        console.log(`  ⚠️  ${name} (error: ${err.message})`);
      }
    }
  }
}

async function upsertGoogleBooksData() {
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

    // Setup indexes first
    await setupIndexes(db);

    // Build query
    let query = {};
    
    if (specificIsbn) {
      query = { isbn: specificIsbn };
      console.log(`\n🔍 Processing specific book with ISBN: ${specificIsbn}\n`);
    } else if (!forceUpdate) {
      // Only update books without cover images or categories
      query = {
        $or: [
          { coverImage: { $exists: false } },
          { coverImage: null },
          { coverImage: "" },
          { categories: { $exists: false } },
          { categories: { $size: 0 } },
        ]
      };
      console.log("\n🔍 Processing books without cover images or categories\n");
    } else {
      console.log("\n🔍 Processing ALL books (--force mode)\n");
    }

    // Get books to process
    const booksToProcess = await books.find(query).toArray();
    console.log(`📚 Found ${booksToProcess.length} books to process\n`);

    if (booksToProcess.length === 0) {
      console.log("✅ No books need updating!");
      console.log("\nTip: Use --force to update all books");
      return;
    }

    let updated = 0;
    let notFound = 0;
    let errors = 0;
    let skipped = 0;

    for (let i = 0; i < booksToProcess.length; i++) {
      const book = booksToProcess[i];
      const progress = `[${i + 1}/${booksToProcess.length}]`;

      console.log(`${progress} Processing: ${book.title}`);
      console.log(`   Author: ${book.author}`);
      console.log(`   ISBN: ${book.isbn || "N/A"}`);

      try {
        // Fetch from Google Books API
        const googleBook = await fetchGoogleBooksData(
          book.isbn,
          book.title,
          book.author
        );

        if (!googleBook) {
          console.log(`   ⚠️  Not found in Google Books\n`);
          notFound++;
          await sleep(DELAY_MS);
          continue;
        }

        // Extract enriched data
        const enrichedData = extractBookData(googleBook);

        // Prepare update - only update fields that are missing or empty
        const updateFields = {};
        
        if (!book.description && enrichedData.description) {
          updateFields.description = enrichedData.description;
        }
        
        if (!book.publisher && enrichedData.publisher) {
          updateFields.publisher = enrichedData.publisher;
        }
        
        if (!book.year && enrichedData.year) {
          updateFields.year = enrichedData.year;
        }
        
        if (!book.coverImage && enrichedData.coverImage) {
          updateFields.coverImage = enrichedData.coverImage;
          updateFields.thumbnail = enrichedData.thumbnail;
        }
        
        if (!book.categories || book.categories.length === 0) {
          updateFields.categories = enrichedData.categories;
        }
        
        if (!book.tags || book.tags.length === 0) {
          updateFields.tags = enrichedData.tags;
        }
        
        if (!book.isbn && enrichedData.isbn) {
          updateFields.isbn = enrichedData.isbn;
        }
        
        if (enrichedData.googleBooksId) {
          updateFields.googleBooksId = enrichedData.googleBooksId;
        }

        if (enrichedData.pageCount) {
          updateFields.pageCount = enrichedData.pageCount;
        }

        if (enrichedData.language) {
          updateFields.language = enrichedData.language;
        }

        // Check if there's anything to update
        if (Object.keys(updateFields).length === 0) {
          console.log(`   ⏭️  Already has all data\n`);
          skipped++;
          await sleep(DELAY_MS);
          continue;
        }

        // Add metadata
        updateFields.updatedAt = new Date();
        updateFields.googleBooksEnriched = true;
        updateFields.googleBooksEnrichedAt = new Date();

        // Update the book
        await books.updateOne(
          { _id: book._id },
          { $set: updateFields }
        );

        console.log(`   ✅ Updated:`);
        if (updateFields.coverImage) console.log(`      - Cover image added`);
        if (updateFields.categories) console.log(`      - Categories: ${updateFields.categories.join(", ")}`);
        if (updateFields.tags && updateFields.tags.length > 0) console.log(`      - Tags: ${updateFields.tags.join(", ")}`);
        if (updateFields.description) console.log(`      - Description added`);
        if (updateFields.publisher) console.log(`      - Publisher: ${updateFields.publisher}`);
        if (updateFields.isbn) console.log(`      - ISBN: ${updateFields.isbn}`);
        console.log();

        updated++;

        // Rate limiting - wait between requests
        await sleep(DELAY_MS);

      } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
        errors++;
        await sleep(DELAY_MS);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Updated: ${updated} books`);
    console.log(`⏭️  Skipped: ${skipped} books (already complete)`);
    console.log(`⚠️  Not found: ${notFound} books`);
    console.log(`❌ Errors: ${errors} books`);
    console.log("=".repeat(60));

    // Show statistics
    if (updated > 0) {
      console.log("\n📊 Database Statistics:");
      
      const totalBooks = await books.countDocuments();
      const booksWithCovers = await books.countDocuments({ 
        coverImage: { $exists: true, $ne: null, $ne: "" } 
      });
      const booksWithCategories = await books.countDocuments({ 
        categories: { $exists: true, $not: { $size: 0 } } 
      });
      const booksWithDescriptions = await books.countDocuments({ 
        description: { $exists: true, $ne: null, $ne: "" } 
      });

      console.log(`   Total books: ${totalBooks}`);
      console.log(`   Books with covers: ${booksWithCovers} (${Math.round(booksWithCovers/totalBooks*100)}%)`);
      console.log(`   Books with categories: ${booksWithCategories} (${Math.round(booksWithCategories/totalBooks*100)}%)`);
      console.log(`   Books with descriptions: ${booksWithDescriptions} (${Math.round(booksWithDescriptions/totalBooks*100)}%)`);

      // Category distribution
      console.log("\n📂 Category Distribution:");
      const categoryStats = await books.aggregate([
        { $match: { categories: { $exists: true, $not: { $size: 0 } } } },
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      categoryStats.forEach(stat => {
        console.log(`   ${stat._id}: ${stat.count} books`);
      });
    }

    console.log("\n✅ Done! Books have been enriched with Google Books data.");
    console.log("\n💡 Next steps:");
    console.log("   - Verify the data in your admin panel");
    console.log("   - Check book covers are displaying correctly");
    console.log("   - Test recommendations with enriched categories");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the script
console.log("🚀 Google Books Data Upsert Script");
console.log("=" .repeat(60));

upsertGoogleBooksData();
