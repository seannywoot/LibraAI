/**
 * Migration script to add slugs to existing books
 * Run with: node scripts/add-slugs-to-books.js
 */

const { MongoClient } = require('mongodb');

function slugify(text) {
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

function generateBookSlug(title, author) {
  const baseSlug = slugify(title);
  const authorSlug = slugify(author);
  return `${baseSlug}-${authorSlug}`;
}

async function addSlugsToBooks() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const books = db.collection('books');

    // Find all books without slugs
    const booksWithoutSlugs = await books.find({ slug: { $exists: false } }).toArray();
    console.log(`Found ${booksWithoutSlugs.length} books without slugs`);

    if (booksWithoutSlugs.length === 0) {
      console.log('All books already have slugs!');
      return;
    }

    let updated = 0;
    const slugCounts = new Map();

    for (const book of booksWithoutSlugs) {
      const baseSlug = generateBookSlug(book.title, book.author);
      let slug = baseSlug;
      
      // Check if slug already exists
      const count = slugCounts.get(baseSlug) || 0;
      if (count > 0) {
        slug = `${baseSlug}-${count}`;
      }
      
      // Ensure uniqueness in database
      let counter = count;
      while (await books.findOne({ slug })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      
      slugCounts.set(baseSlug, counter + 1);

      // Update the book with the slug
      await books.updateOne(
        { _id: book._id },
        { $set: { slug } }
      );

      updated++;
      console.log(`Updated: "${book.title}" -> ${slug}`);
    }

    console.log(`\nSuccessfully added slugs to ${updated} books`);

    // Create index on slug field
    await books.createIndex({ slug: 1 }, { unique: true });
    console.log('Created unique index on slug field');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

addSlugsToBooks();
