/**
 * Direct MongoDB Book Seeding Script
 * 
 * This script connects directly to MongoDB to seed books without requiring authentication.
 * 
 * Usage:
 *   node scripts/seed-books-direct.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env.local file manually
const envPath = path.join(__dirname, '..', '.env.local');
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) {
    MONGODB_URI = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables or .env.local');
  console.error('   Please set MONGODB_URI in your .env.local file');
  process.exit(1);
}

const SEED_BOOKS = [
  // Fiction
  { title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960, shelf: "A1", isbn: "9780061120084", publisher: "Harper Perennial", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard" },
  { title: "1984", author: "George Orwell", year: 1949, shelf: "A1", isbn: "9780451524935", publisher: "Signet Classic", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard" },
  { title: "Pride and Prejudice", author: "Jane Austen", year: 1813, shelf: "A2", isbn: "9780141439518", publisher: "Penguin Classics", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925, shelf: "A2", isbn: "9780743273565", publisher: "Scribner", format: "Physical Book", category: "Fiction", status: "checked-out", loanPolicy: "standard" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", year: 1951, shelf: "A3", isbn: "9780316769174", publisher: "Little, Brown", format: "Physical Book", category: "Fiction", status: "available", loanPolicy: "standard" },
  
  // Science
  { title: "A Brief History of Time", author: "Stephen Hawking", year: 1988, shelf: "B1", isbn: "9780553380163", publisher: "Bantam", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard" },
  { title: "The Selfish Gene", author: "Richard Dawkins", year: 1976, shelf: "B1", isbn: "9780198788607", publisher: "Oxford University Press", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard" },
  { title: "Cosmos", author: "Carl Sagan", year: 1980, shelf: "B2", isbn: "9780345539434", publisher: "Ballantine Books", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard" },
  { title: "The Origin of Species", author: "Charles Darwin", year: 1859, shelf: "B2", isbn: "9780451529060", publisher: "Signet Classic", format: "Physical Book", category: "Science", status: "reserved", loanPolicy: "reference-only" },
  { title: "Sapiens", author: "Yuval Noah Harari", year: 2011, shelf: "B3", isbn: "9780062316097", publisher: "Harper", format: "Physical Book", category: "Science", status: "available", loanPolicy: "standard" },
  
  // Technology
  { title: "Clean Code", author: "Robert C. Martin", year: 2008, shelf: "C1", isbn: "9780132350884", publisher: "Prentice Hall", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard" },
  { title: "The Pragmatic Programmer", author: "Andrew Hunt", year: 1999, shelf: "C1", isbn: "9780201616224", publisher: "Addison-Wesley", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard" },
  { title: "Design Patterns", author: "Erich Gamma", year: 1994, shelf: "C2", isbn: "9780201633610", publisher: "Addison-Wesley", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard" },
  { title: "Introduction to Algorithms", author: "Thomas H. Cormen", year: 2009, shelf: "C2", isbn: "9780262033848", publisher: "MIT Press", format: "Physical Book", category: "Technology", status: "checked-out", loanPolicy: "standard" },
  { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", year: 2020, shelf: "C3", isbn: "9780134610993", publisher: "Pearson", format: "Physical Book", category: "Technology", status: "available", loanPolicy: "standard" },
  { title: "Deep Learning", author: "Ian Goodfellow", year: 2016, shelf: null, isbn: "9780262035613", publisher: "MIT Press", format: "eBook", category: "Technology", status: "available", loanPolicy: null, ebookUrl: "https://www.deeplearningbook.org/" },
  
  // History
  { title: "Guns, Germs, and Steel", author: "Jared Diamond", year: 1997, shelf: "D1", isbn: "9780393317558", publisher: "W. W. Norton", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard" },
  { title: "The Diary of a Young Girl", author: "Anne Frank", year: 1947, shelf: "D1", isbn: "9780553296983", publisher: "Bantam", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard" },
  { title: "A People's History of the United States", author: "Howard Zinn", year: 1980, shelf: "D2", isbn: "9780062397348", publisher: "Harper Perennial", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard" },
  { title: "The Rise and Fall of the Third Reich", author: "William L. Shirer", year: 1960, shelf: "D2", isbn: "9781451651683", publisher: "Simon & Schuster", format: "Physical Book", category: "History", status: "available", loanPolicy: "standard" },
  
  // Biography
  { title: "Steve Jobs", author: "Walter Isaacson", year: 2011, shelf: "E1", isbn: "9781451648539", publisher: "Simon & Schuster", format: "Physical Book", category: "Biography", status: "available", loanPolicy: "standard" },
  { title: "The Autobiography of Malcolm X", author: "Malcolm X", year: 1965, shelf: "E1", isbn: "9780345350688", publisher: "Ballantine Books", format: "Physical Book", category: "Biography", status: "available", loanPolicy: "standard" },
  { title: "Long Walk to Freedom", author: "Nelson Mandela", year: 1994, shelf: "E2", isbn: "9780316548182", publisher: "Little, Brown", format: "Physical Book", category: "Biography", status: "available", loanPolicy: "standard" },
  { title: "Becoming", author: "Michelle Obama", year: 2018, shelf: "E2", isbn: "9781524763138", publisher: "Crown", format: "Physical Book", category: "Biography", status: "checked-out", loanPolicy: "standard" },
  
  // Self-Help
  { title: "Atomic Habits", author: "James Clear", year: 2018, shelf: "F1", isbn: "9780735211292", publisher: "Avery", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard" },
  { title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", year: 1989, shelf: "F1", isbn: "9781982137274", publisher: "Simon & Schuster", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard" },
  { title: "How to Win Friends and Influence People", author: "Dale Carnegie", year: 1936, shelf: "F2", isbn: "9780671027032", publisher: "Pocket Books", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard" },
  { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", year: 2011, shelf: "F2", isbn: "9780374533557", publisher: "Farrar, Straus and Giroux", format: "Physical Book", category: "Self-Help", status: "available", loanPolicy: "standard" },
  
  // Business
  { title: "The Lean Startup", author: "Eric Ries", year: 2011, shelf: "G1", isbn: "9780307887894", publisher: "Crown Business", format: "Physical Book", category: "Business", status: "available", loanPolicy: "standard" },
  { title: "Good to Great", author: "Jim Collins", year: 2001, shelf: "G1", isbn: "9780066620992", publisher: "HarperBusiness", format: "Physical Book", category: "Business", status: "available", loanPolicy: "standard" },
  { title: "Zero to One", author: "Peter Thiel", year: 2014, shelf: "G2", isbn: "9780804139298", publisher: "Crown Business", format: "Physical Book", category: "Business", status: "available", loanPolicy: "standard" },
  { title: "The Innovator's Dilemma", author: "Clayton M. Christensen", year: 1997, shelf: "G2", isbn: "9781633691780", publisher: "Harvard Business Review Press", format: "Physical Book", category: "Business", status: "reserved", loanPolicy: "standard" },
  
  // Non-Fiction
  { title: "Educated", author: "Tara Westover", year: 2018, shelf: "H1", isbn: "9780399590504", publisher: "Random House", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard" },
  { title: "The Immortal Life of Henrietta Lacks", author: "Rebecca Skloot", year: 2010, shelf: "H1", isbn: "9781400052189", publisher: "Broadway Books", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard" },
  { title: "Freakonomics", author: "Steven D. Levitt", year: 2005, shelf: "H2", isbn: "9780060731328", publisher: "William Morrow", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard" },
  { title: "Quiet: The Power of Introverts", author: "Susan Cain", year: 2012, shelf: "H2", isbn: "9780307352156", publisher: "Crown", format: "Physical Book", category: "Non-Fiction", status: "available", loanPolicy: "standard" },
  
  // Arts
  { title: "The Story of Art", author: "E.H. Gombrich", year: 1950, shelf: "I1", isbn: "9780714832470", publisher: "Phaidon Press", format: "Physical Book", category: "Arts", status: "available", loanPolicy: "standard" },
  { title: "Ways of Seeing", author: "John Berger", year: 1972, shelf: "I1", isbn: "9780140135152", publisher: "Penguin Books", format: "Physical Book", category: "Arts", status: "available", loanPolicy: "reference-only" },
  { title: "The Art Spirit", author: "Robert Henri", year: 1923, shelf: "I2", isbn: "9780465002634", publisher: "Basic Books", format: "Physical Book", category: "Arts", status: "available", loanPolicy: "standard" },
  
  // Education
  { title: "Pedagogy of the Oppressed", author: "Paulo Freire", year: 1970, shelf: "J1", isbn: "9780826412768", publisher: "Continuum", format: "Physical Book", category: "Education", status: "available", loanPolicy: "standard" },
  { title: "How Children Learn", author: "John Holt", year: 1967, shelf: "J1", isbn: "9780201484045", publisher: "Da Capo Press", format: "Physical Book", category: "Education", status: "available", loanPolicy: "standard" },
  { title: "Mindset: The New Psychology of Success", author: "Carol S. Dweck", year: 2006, shelf: "J2", isbn: "9780345472328", publisher: "Ballantine Books", format: "Physical Book", category: "Education", status: "available", loanPolicy: "standard" },
  
  // Children
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", year: 1997, shelf: "K1", isbn: "9780590353427", publisher: "Scholastic", format: "Physical Book", category: "Children", status: "available", loanPolicy: "standard" },
  { title: "Charlotte's Web", author: "E.B. White", year: 1952, shelf: "K1", isbn: "9780064400558", publisher: "Harper Collins", format: "Physical Book", category: "Children", status: "available", loanPolicy: "standard" },
  { title: "Where the Wild Things Are", author: "Maurice Sendak", year: 1963, shelf: "K2", isbn: "9780060254926", publisher: "Harper Collins", format: "Physical Book", category: "Children", status: "available", loanPolicy: "standard" },
  
  // Young Adult
  { title: "The Hunger Games", author: "Suzanne Collins", year: 2008, shelf: "L1", isbn: "9780439023481", publisher: "Scholastic", format: "Physical Book", category: "Young Adult", status: "available", loanPolicy: "standard" },
  { title: "The Fault in Our Stars", author: "John Green", year: 2012, shelf: "L1", isbn: "9780525478812", publisher: "Dutton Books", format: "Physical Book", category: "Young Adult", status: "checked-out", loanPolicy: "standard" },
  { title: "The Giver", author: "Lois Lowry", year: 1993, shelf: "L2", isbn: "9780544336261", publisher: "Houghton Mifflin", format: "Physical Book", category: "Young Adult", status: "available", loanPolicy: "standard" },
];

async function seedBooks() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('📚 Starting book seeding process...\n');
    console.log('🔌 Connecting to MongoDB...');
    
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('library');
    const books = db.collection('books');

    console.log('🌱 Seeding books...');
    
    const now = new Date();
    let insertedCount = 0;
    let updatedCount = 0;

    for (const book of SEED_BOOKS) {
      // Check if book already exists by ISBN
      const existing = await books.findOne({ isbn: book.isbn });

      if (existing) {
        // Update existing book
        await books.updateOne(
          { isbn: book.isbn },
          {
            $set: {
              ...book,
              updatedAt: now,
            },
          }
        );
        updatedCount++;
      } else {
        // Insert new book
        await books.insertOne({
          ...book,
          barcode: `BC-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
          createdAt: now,
          updatedAt: now,
        });
        insertedCount++;
      }
    }

    console.log('\n✅ Books seeded successfully!');
    console.log(`   📖 Inserted: ${insertedCount} new books`);
    console.log(`   🔄 Updated: ${updatedCount} existing books`);
    console.log(`   📊 Total: ${SEED_BOOKS.length} books processed\n`);

    // Fetch and display summary
    console.log('📊 Fetching book summary...');
    const allBooks = await books.find({}).toArray();
    console.log(`   Total books in database: ${allBooks.length}\n`);
    
    // Group by category
    const categories = {};
    allBooks.forEach(book => {
      const cat = book.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    
    console.log('📚 Books by Category:');
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count}`);
      });
    
    // Group by format
    const formats = {};
    allBooks.forEach(book => {
      const fmt = book.format || 'Unknown';
      formats[fmt] = (formats[fmt] || 0) + 1;
    });
    
    console.log('\n📦 Books by Format:');
    Object.entries(formats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([format, count]) => {
        console.log(`   ${format}: ${count}`);
      });
    
    // Group by status
    const statuses = {};
    allBooks.forEach(book => {
      const status = book.status || 'unknown';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    
    console.log('\n📊 Books by Status:');
    Object.entries(statuses)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

    console.log('\n✨ Seeding complete!\n');

  } catch (error) {
    console.error('\n❌ Error seeding books:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run the seed function
seedBooks();
