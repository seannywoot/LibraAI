/**
 * Test script for admin daily digests
 * Run with: node scripts/test-admin-digests.js
 */

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

async function testAdminDigests() {
  console.log('🧪 Testing Admin Daily Digests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Cron Secret: ${CRON_SECRET ? '✅ Configured' : '⚠️  Not configured'}\n`);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    console.log('📤 Sending request to /api/cron/admin-digests...\n');

    const response = await fetch(`${BASE_URL}/api/cron/admin-digests`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    console.log('📥 Response received:\n');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`OK: ${data.ok}\n`);

    if (data.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Results:');
      console.log(`  Admins notified: ${data.results.admins}`);
      console.log(`  Overdue books: ${data.results.overdueBooks}`);
      console.log(`  Pending requests: ${data.results.pendingRequests}\n`);
      
      console.log('Overdue Digest:');
      console.log(`  Sent: ${data.results.overdueDigest.sent}`);
      console.log(`  Errors: ${data.results.overdueDigest.errors.length}`);
      if (data.results.overdueDigest.errors.length > 0) {
        console.log('  Error details:', data.results.overdueDigest.errors);
      }
      
      console.log('\nPending Digest:');
      console.log(`  Sent: ${data.results.pendingDigest.sent}`);
      console.log(`  Errors: ${data.results.pendingDigest.errors.length}`);
      if (data.results.pendingDigest.errors.length > 0) {
        console.log('  Error details:', data.results.pendingDigest.errors);
      }

      console.log(`\nTimestamp: ${data.timestamp}`);
      
      console.log('\n📧 Check admin inboxes for digest emails!');
    } else {
      console.log('❌ FAILED!\n');
      console.log(`Error: ${data.error}`);
    }

  } catch (error) {
    console.error('❌ ERROR!\n');
    console.error(error.message);
    console.error('\nMake sure:');
    console.error('1. Your dev server is running (npm run dev)');
    console.error('2. MongoDB is connected');
    console.error('3. EmailJS is configured');
  }
}

// Run the test
testAdminDigests();
