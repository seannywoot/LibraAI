/**
 * Seed Test Data for Recommendation Engine Testing
 * Test Case 2: Genre Enthusiast (Science Fiction lover)
 * Test Case 3: Author Loyalty (J.K. Rowling fan)
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

// Helper function to generate slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedTestData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');
    const books = db.collection('books');
    const transactions = db.collection('transactions');
    const userInteractions = db.collection('user_interactions');

    // Clean up existing test data
    console.log('\n🧹 Cleaning up existing test data...');
    await users.deleteMany({ email: { $in: ['scifi.lover@test.com', 'rowling.fan@test.com'] } });
    await transactions.deleteMany({ 
      userId: { $in: [
        new ObjectId('000000000000000000000001'),
        new ObjectId('000000000000000000000002')
      ]}
    });
    await userInteractions.deleteMany({
      userId: { $in: [
        new ObjectId('000000000000000000000001'),
        new ObjectId('000000000000000000000002')
      ]}
    });

    // ============================================
    // CREATE TEST USERS
    // ============================================
    console.log('\n👥 Creating test users...');

    const testUser1 = {
      _id: new ObjectId('000000000000000000000001'),
      name: 'SciFi Lover',
      email: 'scifi.lover@test.com',
      role: 'student',
      createdAt: new Date(),
    };

    const testUser2 = {
      _id: new ObjectId('000000000000000000000002'),
      name: 'Rowling Fan',
      email: 'rowling.fan@test.com',
      role: 'student',
      createdAt: new Date(),
    };

    await users.insertMany([testUser1, testUser2]);
    console.log('✅ Created test users');

    // ============================================
    // CREATE SCIENCE FICTION BOOKS
    // ============================================
    console.log('\n📚 Creating Science Fiction books...');

    const sciFiBooks = [
      {
        title: 'Dune',
        slug: generateSlug('Dune'),
        author: 'Frank Herbert',
        isbn: '9780441172719',
        categories: ['Science Fiction', 'Adventure'],
        tags: ['Space Opera', 'Desert Planet', 'Politics'],
        publisher: 'Ace Books',
        year: 1965,
        format: 'Paperback',
        status: 'available',
        popularityScore: 180,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg',
      },
      {
        title: 'Foundation',
        slug: generateSlug('Foundation'),
        author: 'Isaac Asimov',
        isbn: '9780553293357',
        categories: ['Science Fiction'],
        tags: ['Space Opera', 'Galactic Empire', 'Psychohistory'],
        publisher: 'Bantam Books',
        year: 1951,
        format: 'Paperback',
        status: 'available',
        popularityScore: 165,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg',
      },
      {
        title: 'Neuromancer',
        slug: generateSlug('Neuromancer'),
        author: 'William Gibson',
        isbn: '9780441569595',
        categories: ['Science Fiction', 'Cyberpunk'],
        tags: ['Artificial Intelligence', 'Hacking', 'Virtual Reality'],
        publisher: 'Ace Books',
        year: 1984,
        format: 'Paperback',
        status: 'available',
        popularityScore: 155,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg',
      },
      {
        title: 'The Left Hand of Darkness',
        slug: generateSlug('The Left Hand of Darkness'),
        author: 'Ursula K. Le Guin',
        isbn: '9780441478125',
        categories: ['Science Fiction'],
        tags: ['Gender', 'Alien Worlds', 'Anthropology'],
        publisher: 'Ace Books',
        year: 1969,
        format: 'Paperback',
        status: 'available',
        popularityScore: 140,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780441478125-L.jpg',
      },
      {
        title: 'Ender\'s Game',
        slug: generateSlug('Ender\'s Game'),
        author: 'Orson Scott Card',
        isbn: '9780812550702',
        categories: ['Science Fiction', 'Young Adult'],
        tags: ['Military', 'Space', 'Strategy'],
        publisher: 'Tor Books',
        year: 1985,
        format: 'Paperback',
        status: 'available',
        popularityScore: 200,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780812550702-L.jpg',
      },
    ];

    const insertedSciFi = await books.insertMany(sciFiBooks);
    const sciFiBookIds = Object.values(insertedSciFi.insertedIds);
    console.log(`✅ Created ${sciFiBookIds.length} Science Fiction books`);

    // ============================================
    // CREATE J.K. ROWLING BOOKS
    // ============================================
    console.log('\n📚 Creating J.K. Rowling books...');

    const rowlingBooks = [
      {
        title: 'Harry Potter and the Philosopher\'s Stone',
        slug: generateSlug('Harry Potter and the Philosopher\'s Stone'),
        author: 'J.K. Rowling',
        isbn: '9780747532699',
        categories: ['Fantasy', 'Young Adult'],
        tags: ['Magic', 'Wizards', 'Coming of Age'],
        publisher: 'Bloomsbury',
        year: 1997,
        format: 'Hardcover',
        status: 'available',
        popularityScore: 250,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg',
      },
      {
        title: 'Harry Potter and the Chamber of Secrets',
        slug: generateSlug('Harry Potter and the Chamber of Secrets'),
        author: 'J.K. Rowling',
        isbn: '9780747538493',
        categories: ['Fantasy', 'Young Adult'],
        tags: ['Magic', 'Wizards', 'Mystery'],
        publisher: 'Bloomsbury',
        year: 1998,
        format: 'Hardcover',
        status: 'available',
        popularityScore: 240,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780747538493-L.jpg',
      },
      {
        title: 'Harry Potter and the Prisoner of Azkaban',
        slug: generateSlug('Harry Potter and the Prisoner of Azkaban'),
        author: 'J.K. Rowling',
        isbn: '9780747542155',
        categories: ['Fantasy', 'Young Adult'],
        tags: ['Magic', 'Wizards', 'Time Travel'],
        publisher: 'Bloomsbury',
        year: 1999,
        format: 'Hardcover',
        status: 'available',
        popularityScore: 245,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780747542155-L.jpg',
      },
      {
        title: 'The Casual Vacancy',
        slug: generateSlug('The Casual Vacancy'),
        author: 'J.K. Rowling',
        isbn: '9780316228532',
        categories: ['Fiction', 'Drama'],
        tags: ['Contemporary', 'Social Issues', 'Small Town'],
        publisher: 'Little, Brown',
        year: 2012,
        format: 'Hardcover',
        status: 'available',
        popularityScore: 120,
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780316228532-L.jpg',
      },
    ];

    const insertedRowling = await books.insertMany(rowlingBooks);
    const rowlingBookIds = Object.values(insertedRowling.insertedIds);
    console.log(`✅ Created ${rowlingBookIds.length} J.K. Rowling books`);

    // ============================================
    // CREATE ADDITIONAL RECOMMENDATION CANDIDATES
    // ============================================
    console.log('\n📚 Creating additional books for recommendations...');

    const additionalBooks = [
      // More Science Fiction
      {
        title: 'The Martian',
        slug: generateSlug('The Martian'),
        author: 'Andy Weir',
        isbn: '9780553418026',
        categories: ['Science Fiction', 'Adventure'],
        tags: ['Mars', 'Survival', 'Space'],
        publisher: 'Crown',
        year: 2014,
        format: 'Paperback',
        status: 'available',
        popularityScore: 190,
      },
      {
        title: 'Snow Crash',
        slug: generateSlug('Snow Crash'),
        author: 'Neal Stephenson',
        isbn: '9780553380958',
        categories: ['Science Fiction', 'Cyberpunk'],
        tags: ['Virtual Reality', 'Hacking', 'Dystopia'],
        publisher: 'Bantam Books',
        year: 1992,
        format: 'Paperback',
        status: 'available',
        popularityScore: 145,
      },
      // More Fantasy (for Rowling fans)
      {
        title: 'The Name of the Wind',
        slug: generateSlug('The Name of the Wind'),
        author: 'Patrick Rothfuss',
        isbn: '9780756404079',
        categories: ['Fantasy'],
        tags: ['Magic', 'Coming of Age', 'Adventure'],
        publisher: 'DAW Books',
        year: 2007,
        format: 'Hardcover',
        status: 'available',
        popularityScore: 175,
      },
      {
        title: 'The Hobbit',
        slug: generateSlug('The Hobbit'),
        author: 'J.R.R. Tolkien',
        isbn: '9780547928227',
        categories: ['Fantasy', 'Adventure'],
        tags: ['Dragons', 'Quest', 'Middle Earth'],
        publisher: 'Houghton Mifflin',
        year: 1937,
        format: 'Paperback',
        status: 'available',
        popularityScore: 220,
      },
      // Different genres for diversity
      {
        title: 'To Kill a Mockingbird',
        slug: generateSlug('To Kill a Mockingbird'),
        author: 'Harper Lee',
        isbn: '9780061120084',
        categories: ['Fiction', 'Classic'],
        tags: ['Social Justice', 'Coming of Age', 'American South'],
        publisher: 'Harper Perennial',
        year: 1960,
        format: 'Paperback',
        status: 'available',
        popularityScore: 210,
      },
    ];

    await books.insertMany(additionalBooks);
    console.log(`✅ Created ${additionalBooks.length} additional books`);

    // ============================================
    // TEST CASE 2: SCIENCE FICTION ENTHUSIAST
    // ============================================
    console.log('\n🧪 Setting up Test Case 2: Science Fiction Enthusiast...');

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Create borrow transactions for SciFi Lover
    const sciFiTransactions = [];
    const sciFiInteractions = [];

    for (let i = 0; i < 5; i++) {
      const book = sciFiBooks[i];
      const bookId = sciFiBookIds[i];
      const daysAgo = [7, 10, 15, 20, 25][i];
      const borrowDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      // Transaction
      sciFiTransactions.push({
        userId: testUser1._id,
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        status: 'returned',
        borrowedAt: borrowDate,
        returnedAt: new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        createdAt: borrowDate,
      });

      // Borrow interaction
      sciFiInteractions.push({
        userId: testUser1._id,
        eventType: 'borrow',
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        bookTags: book.tags,
        bookPublisher: book.publisher,
        bookFormat: book.format,
        bookYear: book.year,
        timestamp: borrowDate,
      });

      // View interactions (multiple views per book)
      for (let j = 0; j < 3; j++) {
        sciFiInteractions.push({
          userId: testUser1._id,
          eventType: 'view',
          bookId: bookId,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookCategories: book.categories,
          bookTags: book.tags,
          bookPublisher: book.publisher,
          bookFormat: book.format,
          bookYear: book.year,
          timestamp: new Date(borrowDate.getTime() - j * 24 * 60 * 60 * 1000),
        });
      }

      // Complete reading interaction
      sciFiInteractions.push({
        userId: testUser1._id,
        eventType: 'complete',
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        bookTags: book.tags,
        timestamp: new Date(borrowDate.getTime() + 10 * 24 * 60 * 60 * 1000),
      });
    }

    await transactions.insertMany(sciFiTransactions);
    await userInteractions.insertMany(sciFiInteractions);
    console.log(`✅ Created ${sciFiTransactions.length} transactions for SciFi Lover`);
    console.log(`✅ Created ${sciFiInteractions.length} interactions for SciFi Lover`);

    // ============================================
    // TEST CASE 3: AUTHOR LOYALTY (J.K. ROWLING FAN)
    // ============================================
    console.log('\n🧪 Setting up Test Case 3: Author Loyalty (J.K. Rowling Fan)...');

    const rowlingTransactions = [];
    const rowlingInteractions = [];

    for (let i = 0; i < 3; i++) {
      const book = rowlingBooks[i];
      const bookId = rowlingBookIds[i];
      const daysAgo = [5, 12, 20][i];
      const borrowDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

      // Transaction
      rowlingTransactions.push({
        userId: testUser2._id,
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        status: 'returned',
        borrowedAt: borrowDate,
        returnedAt: new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        createdAt: borrowDate,
      });

      // Borrow interaction
      rowlingInteractions.push({
        userId: testUser2._id,
        eventType: 'borrow',
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        bookTags: book.tags,
        bookPublisher: book.publisher,
        bookFormat: book.format,
        bookYear: book.year,
        timestamp: borrowDate,
      });

      // Multiple view interactions
      for (let j = 0; j < 5; j++) {
        rowlingInteractions.push({
          userId: testUser2._id,
          eventType: 'view',
          bookId: bookId,
          bookTitle: book.title,
          bookAuthor: book.author,
          bookCategories: book.categories,
          bookTags: book.tags,
          bookPublisher: book.publisher,
          bookFormat: book.format,
          bookYear: book.year,
          timestamp: new Date(borrowDate.getTime() - j * 24 * 60 * 60 * 1000),
        });
      }

      // Complete reading
      rowlingInteractions.push({
        userId: testUser2._id,
        eventType: 'complete',
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        bookTags: book.tags,
        timestamp: new Date(borrowDate.getTime() + 12 * 24 * 60 * 60 * 1000),
      });

      // Add bookmark
      rowlingInteractions.push({
        userId: testUser2._id,
        eventType: 'bookmark_add',
        bookId: bookId,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories,
        bookTags: book.tags,
        timestamp: new Date(borrowDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      });
    }

    await transactions.insertMany(rowlingTransactions);
    await userInteractions.insertMany(rowlingInteractions);
    console.log(`✅ Created ${rowlingTransactions.length} transactions for Rowling Fan`);
    console.log(`✅ Created ${rowlingInteractions.length} interactions for Rowling Fan`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST DATA SEEDED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • Test Users: 2`);
    console.log(`   • Science Fiction Books: ${sciFiBooks.length}`);
    console.log(`   • J.K. Rowling Books: ${rowlingBooks.length}`);
    console.log(`   • Additional Books: ${additionalBooks.length}`);
    console.log(`   • Total Books: ${sciFiBooks.length + rowlingBooks.length + additionalBooks.length}`);
    console.log(`   • Transactions: ${sciFiTransactions.length + rowlingTransactions.length}`);
    console.log(`   • Interactions: ${sciFiInteractions.length + rowlingInteractions.length}`);

    console.log('\n🧪 Test Cases Ready:');
    console.log('\n   TEST CASE 2: Genre Enthusiast (Science Fiction)');
    console.log('   User: scifi.lover@test.com');
    console.log('   Password: (use your auth system)');
    console.log('   Expected: 60-80% Science Fiction recommendations');
    console.log('   Expected: High relevance scores (70-90) for SciFi books');
    console.log('   Expected: Match reasons include "You like Science Fiction"');

    console.log('\n   TEST CASE 3: Author Loyalty (J.K. Rowling)');
    console.log('   User: rowling.fan@test.com');
    console.log('   Password: (use your auth system)');
    console.log('   Expected: "The Casual Vacancy" appears in recommendations');
    console.log('   Expected: High relevance score (80-90+) for Rowling books');
    console.log('   Expected: Match reasons include "By J.K. Rowling"');
    console.log('   Expected: Other Fantasy books also recommended');

    console.log('\n🔍 To Test:');
    console.log('   1. Log in as one of the test users');
    console.log('   2. Navigate to the books page or any page with recommendations');
    console.log('   3. Check the recommendations sidebar or API response');
    console.log('   4. Verify relevance scores and match reasons');
    console.log('   5. Check that profile shows correct engagement level');

    console.log('\n💡 API Testing:');
    console.log('   GET /api/student/recommendations?userId=scifi.lover@test.com');
    console.log('   GET /api/student/recommendations?userId=rowling.fan@test.com');

    console.log('\n');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed script
seedTestData()
  .then(() => {
    console.log('✅ Seed script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
