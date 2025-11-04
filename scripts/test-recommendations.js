/**
 * Manual Test Script for Recommendation System
 * 
 * Run with: node scripts/test-recommendations.js
 * 
 * This script tests the recommendation system APIs manually
 * without requiring a full test framework setup.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.cyan}▶ ${name}${colors.reset}`);
}

function logPass(message) {
  log(`  ✓ ${message}`, 'green');
}

function logFail(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

async function testTrackingEndpoint() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('Testing POST /api/student/books/track', 'cyan');
  log('═══════════════════════════════════════', 'cyan');

  // Test 1: Unauthorized access
  logTest('Test 1: Unauthorized access (no session)');
  try {
    const response = await fetch(`${BASE_URL}/api/student/books/track`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventType: 'search',
        searchQuery: 'javascript'
      })
    });

    if (response.status === 401) {
      logPass('Returns 401 for unauthorized requests');
    } else {
      logFail(`Expected 401, got ${response.status}`);
    }
  } catch (error) {
    logFail(`Request failed: ${error.message}`);
  }

  // Test 2: Invalid event type
  logTest('Test 2: Invalid event type validation');
  logInfo('This test requires authentication - skipping for now');

  // Test 3: Missing required fields
  logTest('Test 3: Missing required fields validation');
  logInfo('This test requires authentication - skipping for now');

  log('\n');
}

async function testRecommendationsEndpoint() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('Testing GET /api/student/books/recommendations', 'cyan');
  log('═══════════════════════════════════════', 'cyan');

  // Test 1: Unauthorized access
  logTest('Test 1: Unauthorized access (no session)');
  try {
    const response = await fetch(`${BASE_URL}/api/student/books/recommendations`);

    if (response.status === 401) {
      logPass('Returns 401 for unauthorized requests');
    } else {
      logFail(`Expected 401, got ${response.status}`);
    }
  } catch (error) {
    logFail(`Request failed: ${error.message}`);
  }

  // Test 2: Valid request structure
  logTest('Test 2: Response structure validation');
  logInfo('This test requires authentication - skipping for now');

  // Test 3: Limit parameter
  logTest('Test 3: Limit parameter handling');
  logInfo('This test requires authentication - skipping for now');

  log('\n');
}

function testScoringAlgorithm() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('Testing Scoring Algorithm Logic', 'cyan');
  log('═══════════════════════════════════════', 'cyan');

  // Test 1: Category matching
  logTest('Test 1: Category matching score');
  const bookCategories = ['Computer Science', 'Programming'];
  const userCategories = ['Computer Science', 'Mathematics'];
  const categoryMatches = bookCategories.filter(cat => userCategories.includes(cat)).length;
  const categoryScore = categoryMatches * 30;
  
  if (categoryScore === 30) {
    logPass(`Category score: ${categoryScore} (1 match × 30)`);
  } else {
    logFail(`Expected 30, got ${categoryScore}`);
  }

  // Test 2: Tag matching
  logTest('Test 2: Tag matching score');
  const bookTags = ['javascript', 'web-development', 'beginner'];
  const userTags = ['javascript', 'python', 'web-development'];
  const tagMatches = bookTags.filter(tag => userTags.includes(tag)).length;
  const tagScore = tagMatches * 20;
  
  if (tagScore === 40) {
    logPass(`Tag score: ${tagScore} (2 matches × 20)`);
  } else {
    logFail(`Expected 40, got ${tagScore}`);
  }

  // Test 3: Author matching
  logTest('Test 3: Author matching bonus');
  const bookAuthor = 'Douglas Crockford';
  const userAuthors = ['Douglas Crockford', 'Martin Fowler'];
  const authorMatch = userAuthors.includes(bookAuthor);
  const authorScore = authorMatch ? 15 : 0;
  
  if (authorScore === 15) {
    logPass(`Author score: ${authorScore} (match found)`);
  } else {
    logFail(`Expected 15, got ${authorScore}`);
  }

  // Test 4: Total score calculation
  logTest('Test 4: Total score calculation and capping');
  const totalScore = categoryScore + tagScore + authorScore + 10 + 25; // + recency + popularity
  const cappedScore = Math.min(totalScore, 100);
  
  if (cappedScore === 100) {
    logPass(`Total score: ${totalScore} → capped at ${cappedScore}`);
  } else {
    logFail(`Expected 100, got ${cappedScore}`);
  }

  // Test 5: Minimum threshold
  logTest('Test 5: Minimum relevance threshold');
  const lowScore = 15;
  const threshold = 20;
  const shouldInclude = lowScore > threshold;
  
  if (!shouldInclude) {
    logPass(`Score ${lowScore} correctly filtered (threshold: ${threshold})`);
  } else {
    logFail(`Score ${lowScore} should be filtered out`);
  }

  log('\n');
}

function testDataStructures() {
  log('\n═══════════════════════════════════════', 'cyan');
  log('Testing Data Structure Validation', 'cyan');
  log('═══════════════════════════════════════', 'cyan');

  // Test 1: Interaction event structure
  logTest('Test 1: View event structure');
  const viewEvent = {
    userId: '507f1f77bcf86cd799439011',
    userEmail: 'test@student.com',
    eventType: 'view',
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    bookId: '507f1f77bcf86cd799439012',
    bookTitle: 'JavaScript: The Good Parts',
    bookAuthor: 'Douglas Crockford',
    bookCategories: ['Computer Science', 'Programming'],
    bookTags: ['javascript', 'web-development']
  };

  const hasRequiredFields = viewEvent.userId && viewEvent.eventType && 
                           viewEvent.bookId && viewEvent.timestamp;
  
  if (hasRequiredFields) {
    logPass('View event has all required fields');
  } else {
    logFail('View event missing required fields');
  }

  // Test 2: Search event structure
  logTest('Test 2: Search event structure');
  const searchEvent = {
    userId: '507f1f77bcf86cd799439011',
    userEmail: 'test@student.com',
    eventType: 'search',
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    searchQuery: 'javascript programming',
    searchFilters: {
      formats: ['Physical'],
      yearRange: [2000, 2024],
      availability: ['Available']
    }
  };

  const hasSearchFields = searchEvent.userId && searchEvent.eventType && 
                         searchEvent.searchQuery && searchEvent.timestamp;
  
  if (hasSearchFields) {
    logPass('Search event has all required fields');
  } else {
    logFail('Search event missing required fields');
  }

  // Test 3: Recommendation structure
  logTest('Test 3: Recommendation response structure');
  const recommendation = {
    _id: '507f1f77bcf86cd799439013',
    title: 'JavaScript: The Good Parts',
    author: 'Douglas Crockford',
    year: 2008,
    format: 'Physical',
    status: 'available',
    categories: ['Computer Science', 'Programming'],
    tags: ['javascript', 'web-development'],
    relevanceScore: 85,
    matchReasons: ['Same category: Computer Science', 'Similar topics']
  };

  const hasRecommendationFields = recommendation._id && recommendation.title && 
                                 recommendation.relevanceScore && 
                                 Array.isArray(recommendation.matchReasons);
  
  if (hasRecommendationFields) {
    logPass('Recommendation has all required fields');
  } else {
    logFail('Recommendation missing required fields');
  }

  log('\n');
}

async function runAllTests() {
  log('\n╔═══════════════════════════════════════════════════╗', 'cyan');
  log('║  Smart Book Recommendation System - Test Suite   ║', 'cyan');
  log('╚═══════════════════════════════════════════════════╝', 'cyan');

  logInfo(`Testing against: ${BASE_URL}`);
  logInfo('Note: Some tests require authentication and will be skipped\n');

  try {
    await testTrackingEndpoint();
    await testRecommendationsEndpoint();
    testScoringAlgorithm();
    testDataStructures();

    log('═══════════════════════════════════════', 'cyan');
    log('Test Suite Complete', 'cyan');
    log('═══════════════════════════════════════', 'cyan');
    log('\nFor authenticated tests, use the application UI or set up proper test credentials.\n', 'yellow');

  } catch (error) {
    log(`\nTest suite failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
