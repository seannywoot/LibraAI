/**
 * Seed Books Script
 * 
 * This script seeds the database with 40+ diverse books across different categories,
 * formats, and shelves.
 * 
 * Usage:
 *   node scripts/seed-books.js
 * 
 * Requirements:
 *   - Server must be running (npm run dev)
 *   - Admin user must be logged in (use credentials from .env.local)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function seedBooks() {
  console.log('📚 Starting book seeding process...\n');

  try {
    console.log('🌱 Seeding books...');
    const response = await fetch(`${BASE_URL}/api/admin/books/seed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('\n✅ Books seeded successfully!');
    console.log(`   📖 Inserted: ${data.inserted} new books`);
    console.log(`   🔄 Updated: ${data.updated} existing books`);
    console.log(`   📊 Total: ${data.total} books processed\n`);

    // Fetch and display summary
    console.log('📊 Fetching book summary...');
    const summaryResponse = await fetch(`${BASE_URL}/api/admin/books?pageSize=100`);
    
    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      console.log(`   Total books in database: ${summaryData.total}\n`);
      
      // Group by category
      const categories = {};
      summaryData.items.forEach(book => {
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
      summaryData.items.forEach(book => {
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
      summaryData.items.forEach(book => {
        const status = book.status || 'unknown';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      
      console.log('\n📊 Books by Status:');
      Object.entries(statuses)
        .sort((a, b) => b[1] - a[1])
        .forEach(([status, count]) => {
          console.log(`   ${status}: ${count}`);
        });
    }

    console.log('\n✨ Seeding complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error seeding books:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Make sure the development server is running (npm run dev)');
    console.error('  2. Ensure you have admin credentials configured');
    console.error('  3. Check that MongoDB is connected\n');
    process.exit(1);
  }
}

// Run the seed function
seedBooks();
