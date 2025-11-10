/**
 * Migration script to add slugs to existing books, authors, and shelves
 * Run with: node scripts/add-slugs.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

/**
 * Generate a URL-friendly slug from a string
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Generate a unique slug for a book
 */
function generateBookSlug(title, author) {
  const baseSlug = slugify(title);
  const authorSlug = slugify(author);
  return `${baseSlug}-${authorSlug}`;
}

/**
 * Generate a unique slug for an author
 */
function generateAuthorSlug(name) {
  return slugify(name);
}

/**
 * Generate a unique slug for a shelf (use the code as slug)
 */
function generateShelfSlug(code) {
  return slugify(code);
}

async function addSlugs() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Add slugs to books
    console.log('\n📚 Adding slugs to books...');
    const books = db.collection('books');
    const booksToUpdate = await books.find({ slug: { $exists: false } }).toArray();
    
    console.log(`Found ${booksToUpdate.length} books without slugs`);
    
    let booksUpdated = 0;
    for (const book of booksToUpdate) {
      const slug = generateBookSlug(book.title, book.author);
      await books.updateOne(
        { _id: book._id },
        { $set: { slug } }
      );
      booksUpdated++;
      if (booksUpdated % 100 === 0) {
        console.log(`  Updated ${booksUpdated}/${booksToUpdate.length} books...`);
      }
    }
    console.log(`✅ Updated ${booksUpdated} books with slugs`);

    // Add slugs to authors
    console.log('\n👤 Adding slugs to authors...');
    const authors = db.collection('authors');
    const authorsToUpdate = await authors.find({ slug: { $exists: false } }).toArray();
    
    console.log(`Found ${authorsToUpdate.length} authors without slugs`);
    
    let authorsUpdated = 0;
    for (const author of authorsToUpdate) {
      const slug = generateAuthorSlug(author.name);
      await authors.updateOne(
        { _id: author._id },
        { $set: { slug } }
      );
      authorsUpdated++;
    }
    console.log(`✅ Updated ${authorsUpdated} authors with slugs`);

    // Add slugs to shelves
    console.log('\n📦 Adding slugs to shelves...');
    const shelves = db.collection('shelves');
    const shelvesToUpdate = await shelves.find({ slug: { $exists: false } }).toArray();
    
    console.log(`Found ${shelvesToUpdate.length} shelves without slugs`);
    
    let shelvesUpdated = 0;
    for (const shelf of shelvesToUpdate) {
      const slug = generateShelfSlug(shelf.code);
      await shelves.updateOne(
        { _id: shelf._id },
        { $set: { slug } }
      );
      shelvesUpdated++;
    }
    console.log(`✅ Updated ${shelvesUpdated} shelves with slugs`);

    console.log('\n✨ Migration completed successfully!');
    console.log(`\nSummary:`);
    console.log(`  Books: ${booksUpdated} updated`);
    console.log(`  Authors: ${authorsUpdated} updated`);
    console.log(`  Shelves: ${shelvesUpdated} updated`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the migration
addSlugs();
