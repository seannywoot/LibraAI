// Quick script to create a test borrowed book for due date reminders
// Run with: node scripts/create-test-borrow.js

const { MongoClient, ObjectId } = require('mongodb');

async function createTestBorrow() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://seannpatrick26_db_user:UgGrNUyqMDqMYC4K@libraai.7d6zeau.mongodb.net/test';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');

    console.log('🔧 Creating test borrowed book for due date reminders\n');

    // Calculate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('📅 Available test dates:');
    console.log(`   1. Week reminder (7 days): ${weekFromNow.toISOString().split('T')[0]}`);
    console.log(`   2. Three-day reminder: ${threeDaysFromNow.toISOString().split('T')[0]}`);
    console.log(`   3. Tomorrow reminder: ${tomorrow.toISOString().split('T')[0]}`);
    console.log(`   4. Due today: ${today.toISOString().split('T')[0]}\n`);

    // Get a book to borrow
    const books = db.collection('books');
    const book = await books.findOne({ status: 'available' });

    if (!book) {
      console.log('❌ No available books found. Please add a book first.');
      return;
    }

    console.log(`📚 Using book: "${book.title}"\n`);

    // Get student user
    const users = db.collection('users');
    const student = await users.findOne({ email: 'student@demo.edu' });

    if (!student) {
      console.log('❌ Student user not found. Please create student@demo.edu first.');
      return;
    }

    // Ensure emailNotifications is enabled
    if (student.emailNotifications === false) {
      console.log('⚠️  Email notifications are disabled for this user.');
      console.log('   Enabling them now...');
      await users.updateOne(
        { email: 'student@demo.edu' },
        { $set: { emailNotifications: true } }
      );
      console.log('   ✅ Email notifications enabled\n');
    }

    console.log(`👤 Using student: ${student.email}\n`);

    // Create transaction with due date 7 days from now (easiest to test)
    const transactions = db.collection('transactions');
    
    const transaction = {
      bookId: book._id,
      userId: student.email,
      status: 'borrowed',
      borrowedAt: new Date(),
      dueDate: weekFromNow,  // Change this to test different reminders
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await transactions.insertOne(transaction);

    console.log('✅ Test transaction created!');
    console.log(`   Transaction ID: ${result.insertedId}`);
    console.log(`   Book: "${book.title}"`);
    console.log(`   Student: ${student.email}`);
    console.log(`   Due Date: ${weekFromNow.toISOString().split('T')[0]}`);
    console.log(`   Reminder Type: Week reminder (7 days)\n`);

    // Update book status
    await books.updateOne(
      { _id: book._id },
      { $set: { status: 'borrowed', borrowedBy: student.email } }
    );

    console.log('📧 Now test the reminder:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Trigger cron: curl http://localhost:3000/api/cron/due-reminders');
    console.log('   3. Check email inbox for student@demo.edu\n');

    console.log('💡 To test other reminder types, update the transaction:');
    console.log(`   db.transactions.updateOne(`);
    console.log(`     { _id: ObjectId("${result.insertedId}") },`);
    console.log(`     { $set: { dueDate: new Date("${threeDaysFromNow.toISOString().split('T')[0]}") } }`);
    console.log(`   )\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createTestBorrow();
