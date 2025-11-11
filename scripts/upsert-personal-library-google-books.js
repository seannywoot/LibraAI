/**
 * Upsert Google Books Data for Personal Libraries
 * 
 * This script enriches books in personal_libraries collection with Google Books data
 * (for books added via barcode scanning, PDF upload, etc.)
 * 
 * Usage:
 *   node scripts/upsert-personal-library-google-books.js
 *   node scripts/upsert-personal-library-google-books.js --force
 */

const { MongoClient } = require("mongodb");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

const GOOGLE_BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const DELAY_MS = 1000;
const forceUpdate = process.argv.includes("--force");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchGoogleBooksData(isbn, title, author) {
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
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.items && parsed.items.length > 0 ? parsed.items[0] : null);
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

function processCategories(volumeInfo) {
  let categories = [];
  if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
    categories = volumeInfo.categories.flatMap(cat => 
      cat.split('/').map(c => c.trim())
    ).filter(c => c.length > 0);
    categories = [...new Set(categories)];
  }
  return categories.length > 0 ? categories : ["General"];
}

function processTags(volumeInfo) {
  let tags = [];
  if (volumeInfo.subjects && Array.isArray(volumeInfo.subjects)) {
    tags = volumeInfo.subjects.map(s => s.trim()).filter(s => s.length > 0);
    tags = [...new Set(tags)];
  }
  return tags;
}

function extractBookData(googleBook) {
  const volumeInfo = googleBook.volumeInfo;
  
  const data = {
    description: volumeInfo.description || null,
    publisher: volumeInfo.publisher || null,
    publishedDate: volumeInfo.publishedDate || null,
    year: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : null,
    pageCount: volumeInfo.pageCount || null,
    language: volumeInfo.language || null,
    thumbnail: volumeInfo.imageLinks?.thumbnail || null,
    categories: processCategories(volumeInfo),
    tags: processTags(volumeInfo),
    googleBooksId: googleBook.id || null,
  };

  if (volumeInfo.industryIdentifiers) {
    const isbn13 = volumeInfo.industryIdentifiers.find(id => id.type === "ISBN_13");
    if (isbn13) {
      data.isbn = isbn13.identifier;
    }
  }

  return data;
}

async function setupIndexes(db) {
  console.log("\n📊 Setting up database indexes...");
  
  const personalLibraries = db.collection("personal_libraries");
  
  const indexes = [
    { index: { userId: 1, addedAt: -1 }, name: "userId + addedAt" },
    { index: { isbn: 1 }, options: { sparse: true }, name: "isbn" },
    { index: { userId: 1, isbn: 1 }, options: { sparse: true }, name: "userId + isbn" },
    { index: { categories: 1 }, name: "categories" },
    { index: { tags: 1 }, options: { sparse: true }, name: "tags" },
    { index: { addedMethod: 1 }, name: "addedMethod" },
  ];

  for (const { index, options, name } of indexes) {
    try {
      await personalLibraries.createIndex(index, options || {});
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

async function upsertPersonalLibraryData() {
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
    const personalLibraries = db.collection("personal_libraries");

    await setupIndexes(db);

    let query = {};
    
    if (!forceUpdate) {
      query = {
        $or: [
          { thumbnail: { $exists: false } },
          { thumbnail: null },
          { thumbnail: "" },
          { categories: { $exists: false } },
          { categories: { $size: 0 } },
        ]
      };
      console.log("\n🔍 Processing personal library books without covers or categories\n");
    } else {
      console.log("\n🔍 Processing ALL personal library books (--force mode)\n");
    }

    const booksToProcess = await personalLibraries.find(query).toArray();
    console.log(`📚 Found ${booksToProcess.length} personal library books to process\n`);

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
      console.log(`   Added by: ${book.addedMethod || "unknown"}`);

      try {
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

        const enrichedData = extractBookData(googleBook);
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
        
        if (!book.thumbnail && enrichedData.thumbnail) {
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

        if (Object.keys(updateFields).length === 0) {
          console.log(`   ⏭️  Already has all data\n`);
          skipped++;
          await sleep(DELAY_MS);
          continue;
        }

        updateFields.googleBooksEnriched = true;
        updateFields.googleBooksEnrichedAt = new Date();

        await personalLibraries.updateOne(
          { _id: book._id },
          { $set: updateFields }
        );

        console.log(`   ✅ Updated:`);
        if (updateFields.thumbnail) console.log(`      - Cover image added`);
        if (updateFields.categories) console.log(`      - Categories: ${updateFields.categories.join(", ")}`);
        if (updateFields.tags && updateFields.tags.length > 0) console.log(`      - Tags: ${updateFields.tags.join(", ")}`);
        if (updateFields.description) console.log(`      - Description added`);
        if (updateFields.publisher) console.log(`      - Publisher: ${updateFields.publisher}`);
        console.log();

        updated++;
        await sleep(DELAY_MS);

      } catch (err) {
        console.log(`   ❌ Error: ${err.message}\n`);
        errors++;
        await sleep(DELAY_MS);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Updated: ${updated} books`);
    console.log(`⏭️  Skipped: ${skipped} books (already complete)`);
    console.log(`⚠️  Not found: ${notFound} books`);
    console.log(`❌ Errors: ${errors} books`);
    console.log("=".repeat(60));

    if (updated > 0) {
      console.log("\n📊 Personal Library Statistics:");
      
      const totalBooks = await personalLibraries.countDocuments();
      const booksWithCovers = await personalLibraries.countDocuments({ 
        thumbnail: { $exists: true, $ne: null, $ne: "" } 
      });
      const booksWithCategories = await personalLibraries.countDocuments({ 
        categories: { $exists: true, $not: { $size: 0 } } 
      });

      console.log(`   Total personal library books: ${totalBooks}`);
      console.log(`   Books with covers: ${booksWithCovers} (${Math.round(booksWithCovers/totalBooks*100)}%)`);
      console.log(`   Books with categories: ${booksWithCategories} (${Math.round(booksWithCategories/totalBooks*100)}%)`);

      console.log("\n📂 Category Distribution:");
      const categoryStats = await personalLibraries.aggregate([
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

    console.log("\n✅ Done! Personal library books enriched with Google Books data.");

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

console.log("🚀 Personal Library Google Books Enrichment");
console.log("=".repeat(60));

upsertPersonalLibraryData();
