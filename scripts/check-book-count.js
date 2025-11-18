import { getDb } from "../src/lib/mongodb.js";

async function checkBookCount() {
  try {
    console.log("Connecting to database...");
    const db = await getDb();
    const booksCollection = db.collection("books");

    // Get total count
    const totalBooks = await booksCollection.countDocuments({});
    console.log(`\n📚 Total books in database: ${totalBooks}`);

    // Get count by status
    const availableBooks = await booksCollection.countDocuments({ status: "available" });
    const borrowedBooks = await booksCollection.countDocuments({ status: "borrowed" });
    const reservedBooks = await booksCollection.countDocuments({ status: "reserved" });

    console.log(`\n📊 Books by status:`);
    console.log(`  ✅ Available: ${availableBooks}`);
    console.log(`  📖 Borrowed: ${borrowedBooks}`);
    console.log(`  🔒 Reserved: ${reservedBooks}`);

    // Get category distribution
    const categoryStats = await booksCollection.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    console.log(`\n📂 Top 10 categories:`);
    categoryStats.forEach(cat => {
      console.log(`  ${cat._id || 'Uncategorized'}: ${cat.count} books`);
    });

    // Sample a few books
    const sampleBooks = await booksCollection.find({}).limit(5).toArray();
    console.log(`\n📖 Sample books:`);
    sampleBooks.forEach((book, idx) => {
      console.log(`  ${idx + 1}. "${book.title}" by ${book.author} (${book.year || 'N/A'})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkBookCount();
