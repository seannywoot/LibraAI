/**
 * Quick verification script to check if Atomic Habits has a description
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function verifyBook() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/library';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const booksCollection = db.collection('books');

    const book = await booksCollection.findOne({ title: "Atomic Habits" });

    if (!book) {
      console.log('❌ Atomic Habits not found in database');
      return;
    }

    console.log('📚 Book Found: Atomic Habits');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Title: ${book.title}`);
    console.log(`Author: ${book.author}`);
    console.log(`Year: ${book.year}`);
    console.log(`Shelf: ${book.shelf}`);
    console.log(`Category: ${book.category}`);
    console.log(`Status: ${book.status}`);
    console.log(`ISBN: ${book.isbn}`);
    console.log('\n📝 Description:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (book.description) {
      console.log(`✅ ${book.description}`);
    } else {
      console.log('❌ NO DESCRIPTION FOUND');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Verification Complete!');
    
    if (book.description) {
      console.log('\n🎉 SUCCESS: Atomic Habits now has a searchable description!');
      console.log('   The chatbot can now find this book by:');
      console.log('   - Title: "Atomic Habits"');
      console.log('   - Author: "James Clear"');
      console.log('   - Topic: "habits", "productivity", "behavior change"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyBook();
