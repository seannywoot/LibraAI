/**
 * Verify Recommendation Engine Test Cases
 * Checks recommendations for test users
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

// Import recommendation engine directly
const path = require('path');
const recommendationEnginePath = path.join(__dirname, '../src/lib/recommendation-engine.js');

// Mock the mongodb import for the recommendation engine
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '@/lib/mongodb') {
    return {
      default: MongoClient.connect(process.env.MONGODB_URI)
    };
  }
  return originalRequire.apply(this, arguments);
};

const { getRecommendations } = require(recommendationEnginePath);

async function verifyRecommendations() {
  console.log('🔍 Verifying Recommendation Engine...\n');

  try {
    // ============================================
    // TEST CASE 2: Science Fiction Enthusiast
    // ============================================
    console.log('=' .repeat(60));
    console.log('TEST CASE 2: Science Fiction Enthusiast');
    console.log('=' .repeat(60));
    console.log('User: scifi.lover@test.com\n');

    const sciFiRecs = await getRecommendations({
      userId: 'scifi.lover@test.com',
      limit: 10,
    });

    console.log('📊 User Profile:');
    console.log(`   Total Interactions: ${sciFiRecs.profile.totalInteractions}`);
    console.log(`   Top Categories: ${sciFiRecs.profile.topCategories?.join(', ') || 'N/A'}`);
    console.log(`   Top Authors: ${sciFiRecs.profile.topAuthors?.join(', ') || 'N/A'}`);
    console.log(`   Engagement Level: ${sciFiRecs.profile.engagementLevel || 'N/A'}`);
    console.log(`   Diversity Score: ${sciFiRecs.profile.diversityScore || 'N/A'}%`);

    console.log('\n📚 Recommendations:');
    const sciFiCount = sciFiRecs.recommendations.filter(
      r => r.categories?.includes('Science Fiction')
    ).length;
    
    sciFiRecs.recommendations.forEach((book, index) => {
      console.log(`\n   ${index + 1}. ${book.title}`);
      console.log(`      Author: ${book.author}`);
      console.log(`      Categories: ${book.categories?.join(', ') || 'N/A'}`);
      console.log(`      Relevance Score: ${book.relevanceScore}`);
      console.log(`      Match Reasons: ${book.matchReasons?.join(', ') || 'N/A'}`);
    });

    console.log('\n✅ Test Case 2 Results:');
    console.log(`   Science Fiction books: ${sciFiCount}/${sciFiRecs.recommendations.length}`);
    console.log(`   Expected: 6-8 (60-80%)`);
    
    const avgSciFiScore = sciFiRecs.recommendations
      .filter(r => r.categories?.includes('Science Fiction'))
      .reduce((sum, r) => sum + r.relevanceScore, 0) / sciFiCount || 0;
    console.log(`   Avg SciFi Relevance Score: ${Math.round(avgSciFiScore)}`);
    console.log(`   Expected: 70+`);

    const hasSciFiReason = sciFiRecs.recommendations.some(
      r => r.matchReasons?.some(reason => reason.includes('Science Fiction'))
    );
    console.log(`   Has "Science Fiction" in reasons: ${hasSciFiReason ? '✅' : '❌'}`);

    // Check for expected books
    const hasMartian = sciFiRecs.recommendations.some(r => r.title === 'The Martian');
    const hasSnowCrash = sciFiRecs.recommendations.some(r => r.title === 'Snow Crash');
    console.log(`   Contains "The Martian": ${hasMartian ? '✅' : '❌'}`);
    console.log(`   Contains "Snow Crash": ${hasSnowCrash ? '✅' : '❌'}`);

    // ============================================
    // TEST CASE 3: Author Loyalty (J.K. Rowling)
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST CASE 3: Author Loyalty (J.K. Rowling Fan)');
    console.log('=' .repeat(60));
    console.log('User: rowling.fan@test.com\n');

    const rowlingRecs = await getRecommendations({
      userId: 'rowling.fan@test.com',
      limit: 10,
    });

    console.log('📊 User Profile:');
    console.log(`   Total Interactions: ${rowlingRecs.profile.totalInteractions}`);
    console.log(`   Top Categories: ${rowlingRecs.profile.topCategories?.join(', ') || 'N/A'}`);
    console.log(`   Top Authors: ${rowlingRecs.profile.topAuthors?.join(', ') || 'N/A'}`);
    console.log(`   Engagement Level: ${rowlingRecs.profile.engagementLevel || 'N/A'}`);
    console.log(`   Diversity Score: ${rowlingRecs.profile.diversityScore || 'N/A'}%`);

    console.log('\n📚 Recommendations:');
    const fantasyCount = rowlingRecs.recommendations.filter(
      r => r.categories?.includes('Fantasy')
    ).length;
    
    rowlingRecs.recommendations.forEach((book, index) => {
      console.log(`\n   ${index + 1}. ${book.title}`);
      console.log(`      Author: ${book.author}`);
      console.log(`      Categories: ${book.categories?.join(', ') || 'N/A'}`);
      console.log(`      Relevance Score: ${book.relevanceScore}`);
      console.log(`      Match Reasons: ${book.matchReasons?.join(', ') || 'N/A'}`);
    });

    console.log('\n✅ Test Case 3 Results:');
    
    const casualVacancy = rowlingRecs.recommendations.find(
      r => r.title === 'The Casual Vacancy'
    );
    console.log(`   Contains "The Casual Vacancy": ${casualVacancy ? '✅' : '❌'}`);
    if (casualVacancy) {
      console.log(`   Relevance Score: ${casualVacancy.relevanceScore} (Expected: 80+)`);
      console.log(`   Match Reasons: ${casualVacancy.matchReasons?.join(', ')}`);
      const hasRowlingReason = casualVacancy.matchReasons?.some(
        r => r.includes('J.K. Rowling')
      );
      console.log(`   Mentions "J.K. Rowling": ${hasRowlingReason ? '✅' : '❌'}`);
    }

    console.log(`   Fantasy books: ${fantasyCount}/${rowlingRecs.recommendations.length}`);
    console.log(`   Expected: 6-7 (60-70%)`);

    const hasNameOfWind = rowlingRecs.recommendations.some(r => r.title === 'The Name of the Wind');
    const hasHobbit = rowlingRecs.recommendations.some(r => r.title === 'The Hobbit');
    console.log(`   Contains "The Name of the Wind": ${hasNameOfWind ? '✅' : '❌'}`);
    console.log(`   Contains "The Hobbit": ${hasHobbit ? '✅' : '❌'}`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('=' .repeat(60));

    const test2Pass = sciFiCount >= 6 && sciFiCount <= 8 && avgSciFiScore >= 70 && hasSciFiReason;
    const test3Pass = casualVacancy && casualVacancy.relevanceScore >= 80 && fantasyCount >= 6;

    console.log(`\nTest Case 2 (SciFi Enthusiast): ${test2Pass ? '✅ PASS' : '⚠️  CHECK RESULTS'}`);
    console.log(`Test Case 3 (Rowling Fan): ${test3Pass ? '✅ PASS' : '⚠️  CHECK RESULTS'}`);

    if (test2Pass && test3Pass) {
      console.log('\n🎉 All tests passed! Recommendation engine is working correctly.\n');
    } else {
      console.log('\n⚠️  Some tests need review. Check the results above.\n');
    }

  } catch (error) {
    console.error('❌ Error verifying recommendations:', error);
    throw error;
  }
}

// Run verification
verifyRecommendations()
  .then(() => {
    console.log('✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
