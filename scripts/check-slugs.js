/**
 * Check if slugs exist in the database
 * Run with: node scripts/check-slugs.js
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function checkSlugs() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    // Check authors
    console.log('👤 Checking authors...');
    const authors = db.collection('authors');
    const sampleAuthor = await authors.findOne({});
    if (sampleAuthor) {
      console.log('Sample author:', {
        _id: sampleAuthor._id,
        name: sampleAuthor.name,
        slug: sampleAuthor.slug || '❌ NO SLUG',
      });
      const authorsWithSlug = await authors.countDocuments({ slug: { $exists: true, $ne: null } });
      const totalAuthors = await authors.countDocuments({});
      console.log(`Authors with slugs: ${authorsWithSlug}/${totalAuthors}\n`);
    } else {
      console.log('No authors found\n');
    }

    // Check shelves
    console.log('📦 Checking shelves...');
    const shelves = db.collection('shelves');
    const sampleShelf = await shelves.findOne({});
    if (sampleShelf) {
      console.log('Sample shelf:', {
        _id: sampleShelf._id,
        code: sampleShelf.code,
        slug: sampleShelf.slug || '❌ NO SLUG',
      });
      const shelvesWithSlug = await shelves.countDocuments({ slug: { $exists: true, $ne: null } });
      const totalShelves = await shelves.countDocuments({});
      console.log(`Shelves with slugs: ${shelvesWithSlug}/${totalShelves}\n`);
    } else {
      console.log('No shelves found\n');
    }

    // Check books
    console.log('📚 Checking books...');
    const books = db.collection('books');
    const sampleBook = await books.findOne({});
    if (sampleBook) {
      console.log('Sample book:', {
        _id: sampleBook._id,
        title: sampleBook.title,
        author: sampleBook.author,
        slug: sampleBook.slug || '❌ NO SLUG',
      });
      const booksWithSlug = await books.countDocuments({ slug: { $exists: true, $ne: null } });
      const totalBooks = await books.countDocuments({});
      console.log(`Books with slugs: ${booksWithSlug}/${totalBooks}\n`);
    } else {
      console.log('No books found\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the check
checkSlugs();
