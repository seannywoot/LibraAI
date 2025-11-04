/**
 * Performance Monitoring Script for Recommendation System
 * 
 * Monitors:
 * - API response times
 * - Database query performance
 * - Cache hit rates
 * - System load
 * 
 * Run with: node scripts/performance-monitor.js
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, "..", ".env.local");
let uri;

try {
  const envContent = readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    if (line.startsWith("MONGODB_URI=") || line.startsWith("MONGODB_URL=") || line.startsWith("DATABASE_URL=")) {
      uri = line.split("=")[1].trim().replace(/['"]/g, "");
      break;
    }
  }
} catch (error) {
  console.error("❌ Could not read .env.local file");
}

if (!uri) {
  uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
}

if (!uri) {
  console.error("❌ Missing MONGODB_URI in environment");
  process.exit(1);
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatTime(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getStatus(value, target, reverse = false) {
  const ratio = value / target;
  if (reverse) {
    return ratio > 1 ? 'red' : ratio > 0.8 ? 'yellow' : 'green';
  }
  return ratio < 1 ? 'green' : ratio < 1.5 ? 'yellow' : 'red';
}

async function checkDatabasePerformance() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║           Database Performance Analysis                   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Check user_interactions collection
    log('\n📊 user_interactions Collection', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const interactions = db.collection("user_interactions");
    
    const startCount = Date.now();
    const interactionCount = await interactions.countDocuments();
    const countTime = Date.now() - startCount;
    
    log(`  Documents: ${interactionCount.toLocaleString()}`, 'blue');
    log(`  Count query time: ${formatTime(countTime)}`, getStatus(countTime, 100));

    // Check indexes
    const interactionIndexes = await interactions.indexes();
    log(`  Indexes: ${interactionIndexes.length}`, 'blue');
    interactionIndexes.forEach(idx => {
      log(`    - ${idx.name}`, 'yellow');
    });

    // Sample query performance
    if (interactionCount > 0) {
      const startQuery = Date.now();
      await interactions.find().limit(10).toArray();
      const queryTime = Date.now() - startQuery;
      log(`  Sample query (10 docs): ${formatTime(queryTime)}`, getStatus(queryTime, 50));
    }

    // Check books collection
    log('\n📚 books Collection', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const books = db.collection("books");
    
    const startBooksCount = Date.now();
    const booksCount = await books.countDocuments();
    const booksCountTime = Date.now() - startBooksCount;
    
    log(`  Documents: ${booksCount.toLocaleString()}`, 'blue');
    log(`  Count query time: ${formatTime(booksCountTime)}`, getStatus(booksCountTime, 100));

    // Check for categories and tags
    const startCategoriesCheck = Date.now();
    const booksWithCategories = await books.countDocuments({ categories: { $exists: true, $ne: [] } });
    const booksWithTags = await books.countDocuments({ tags: { $exists: true, $ne: [] } });
    const categoriesCheckTime = Date.now() - startCategoriesCheck;
    
    log(`  Books with categories: ${booksWithCategories} (${((booksWithCategories/booksCount)*100).toFixed(1)}%)`, 'blue');
    log(`  Books with tags: ${booksWithTags} (${((booksWithTags/booksCount)*100).toFixed(1)}%)`, 'blue');
    log(`  Metadata check time: ${formatTime(categoriesCheckTime)}`, getStatus(categoriesCheckTime, 100));

    // Check indexes
    const bookIndexes = await books.indexes();
    log(`  Indexes: ${bookIndexes.length}`, 'blue');
    bookIndexes.forEach(idx => {
      log(`    - ${idx.name}`, 'yellow');
    });

    // Test recommendation query performance
    log('\n🔍 Recommendation Query Performance', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const testCategories = ['Computer Science', 'Programming'];
    const testTags = ['javascript', 'web-development'];

    const startRecQuery = Date.now();
    const candidateBooks = await books.find({
      $or: [
        { categories: { $in: testCategories } },
        { tags: { $in: testTags } }
      ],
      status: 'available'
    }).limit(30).toArray();
    const recQueryTime = Date.now() - startRecQuery;

    log(`  Candidate books found: ${candidateBooks.length}`, 'blue');
    log(`  Query time: ${formatTime(recQueryTime)}`, getStatus(recQueryTime, 200));
    
    const target = 500;
    if (recQueryTime < target) {
      log(`  ✓ Performance target met (< ${target}ms)`, 'green');
    } else {
      log(`  ⚠ Performance target missed (> ${target}ms)`, 'yellow');
      log(`    Consider adding compound indexes`, 'yellow');
    }

    // Check TTL index
    log('\n⏰ TTL Index Status', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const ttlIndex = interactionIndexes.find(idx => idx.name === 'expiresAt_ttl_idx');
    if (ttlIndex) {
      log(`  ✓ TTL index exists`, 'green');
      log(`  Expire after: ${ttlIndex.expireAfterSeconds} seconds`, 'blue');
    } else {
      log(`  ✗ TTL index not found`, 'red');
    }

    // Check for old interactions
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oldInteractions = await interactions.countDocuments({
      timestamp: { $lt: ninetyDaysAgo }
    });
    
    if (oldInteractions > 0) {
      log(`  ⚠ ${oldInteractions} interactions older than 90 days`, 'yellow');
      log(`    TTL cleanup may be pending`, 'yellow');
    } else {
      log(`  ✓ No old interactions (TTL working)`, 'green');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await client.close();
  }
}

async function analyzeInteractionPatterns() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║           User Interaction Analysis                       ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const interactions = db.collection("user_interactions");

    const totalInteractions = await interactions.countDocuments();
    
    if (totalInteractions === 0) {
      log('\n  ℹ No interactions recorded yet', 'yellow');
      return;
    }

    // Event type distribution
    log('\n📈 Event Type Distribution', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const eventTypes = await interactions.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    eventTypes.forEach(type => {
      const percentage = ((type.count / totalInteractions) * 100).toFixed(1);
      log(`  ${type._id}: ${type.count} (${percentage}%)`, 'blue');
    });

    // Recent activity
    log('\n📅 Recent Activity (Last 7 Days)', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentInteractions = await interactions.countDocuments({
      timestamp: { $gte: sevenDaysAgo }
    });

    log(`  Recent interactions: ${recentInteractions}`, 'blue');
    log(`  Average per day: ${(recentInteractions / 7).toFixed(1)}`, 'blue');

    // Top categories
    log('\n🏷️  Top Categories', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const topCategories = await interactions.aggregate([
      { $match: { eventType: 'view' } },
      { $unwind: '$bookCategories' },
      { $group: { _id: '$bookCategories', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    if (topCategories.length > 0) {
      topCategories.forEach((cat, idx) => {
        log(`  ${idx + 1}. ${cat._id}: ${cat.count} views`, 'blue');
      });
    } else {
      log('  No category data available', 'yellow');
    }

    // Top tags
    log('\n🔖 Top Tags', 'magenta');
    log('═══════════════════════════════════════════════════════════', 'cyan');

    const topTags = await interactions.aggregate([
      { $match: { eventType: 'view' } },
      { $unwind: '$bookTags' },
      { $group: { _id: '$bookTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    if (topTags.length > 0) {
      topTags.forEach((tag, idx) => {
        log(`  ${idx + 1}. ${tag._id}: ${tag.count} views`, 'blue');
      });
    } else {
      log('  No tag data available', 'yellow');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await client.close();
  }
}

function printPerformanceTargets() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║           Performance Targets & Recommendations           ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  log('\n🎯 Target Metrics', 'magenta');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('  Tracking API: < 200ms response time', 'blue');
  log('  Recommendations API: < 500ms response time', 'blue');
  log('  Database queries: < 100ms for simple queries', 'blue');
  log('  Recommendation query: < 200ms', 'blue');
  log('  Cache hit rate: > 70%', 'blue');

  log('\n💡 Optimization Recommendations', 'magenta');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('  1. Monitor API response times in production', 'yellow');
  log('  2. Add compound indexes if queries are slow', 'yellow');
  log('  3. Implement rate limiting (100 req/min tracking, 20 req/min recommendations)', 'yellow');
  log('  4. Consider Redis for caching in production', 'yellow');
  log('  5. Monitor TTL cleanup effectiveness', 'yellow');
  log('  6. Track cache hit rates', 'yellow');
  log('  7. Set up alerts for slow queries (> 1s)', 'yellow');
  log('  8. Monitor database connection pool', 'yellow');

  log('\n📊 Monitoring Tools', 'magenta');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('  - MongoDB Atlas: Built-in performance monitoring', 'yellow');
  log('  - New Relic / DataDog: APM for production', 'yellow');
  log('  - Custom logging: Add timing logs to API routes', 'yellow');
  log('  - Browser DevTools: Network tab for client-side performance', 'yellow');

  log('\n');
}

async function runPerformanceMonitoring() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Smart Book Recommendation System - Performance Monitor  ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════╝', 'cyan');

  await checkDatabasePerformance();
  await analyzeInteractionPatterns();
  printPerformanceTargets();

  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('Performance monitoring complete!', 'green');
  log('═══════════════════════════════════════════════════════════\n', 'cyan');
}

// Run monitoring
runPerformanceMonitoring();
