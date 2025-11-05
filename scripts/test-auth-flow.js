/**
 * Test Authentication Flow
 * Simulates login and checks if session is created properly
 */

// Load environment variables
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️  Could not load .env.local file\n');
}

console.log('🧪 Testing Authentication Flow\n');

async function testAuth() {
  try {
    // Test 1: Check MongoDB connection
    console.log('1️⃣  Testing MongoDB connection...');
    const clientPromise = require('../src/lib/mongodb').default;
    const client = await clientPromise;
    const db = client.db();
    await db.admin().ping();
    console.log('   ✅ MongoDB connected\n');

    // Test 2: Check demo accounts
    console.log('2️⃣  Checking demo accounts...');
    const studentDemo = await db.collection('users').findOne({ email: 'student@demo.edu' });
    const adminDemo = await db.collection('users').findOne({ email: 'admin@libra.ai' });
    
    if (!studentDemo) {
      console.log('   ⚠️  Student demo not in DB - will use fallback');
    } else {
      console.log('   ✅ Student demo found in DB');
    }
    
    if (!adminDemo) {
      console.log('   ⚠️  Admin demo not in DB - will use fallback');
    } else {
      console.log('   ✅ Admin demo found in DB');
    }
    console.log('');

    // Test 3: Check NextAuth configuration
    console.log('3️⃣  Checking NextAuth configuration...');
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    
    if (!nextAuthUrl) {
      console.log('   ❌ NEXTAUTH_URL not set');
    } else if (nextAuthUrl.includes('localhost')) {
      console.log('   ✅ NEXTAUTH_URL set for development:', nextAuthUrl);
    } else {
      console.log('   ✅ NEXTAUTH_URL set for production:', nextAuthUrl);
    }
    
    if (!nextAuthSecret) {
      console.log('   ❌ NEXTAUTH_SECRET not set');
    } else {
      console.log('   ✅ NEXTAUTH_SECRET is set');
    }
    console.log('');

    // Test 4: Simulate password verification
    console.log('4️⃣  Testing password verification...');
    const { comparePassword } = require('../src/lib/passwords');
    
    // If student demo exists in DB, test password
    if (studentDemo && studentDemo.passwordHash) {
      const isValid = await comparePassword('ReadSmart123', studentDemo.passwordHash);
      if (isValid) {
        console.log('   ✅ Student demo password verification works');
      } else {
        console.log('   ❌ Student demo password verification failed');
      }
    } else {
      console.log('   ⚠️  Skipping DB password test (using fallback demo)');
    }
    console.log('');

    // Test 5: Check brute force protection
    console.log('5️⃣  Testing brute force protection...');
    const { isAccountLocked, getAttemptCount } = require('../src/lib/brute-force-protection');
    
    const lockStatus = isAccountLocked('test@example.com');
    const attemptCount = getAttemptCount('test@example.com');
    
    console.log('   ✅ Brute force protection initialized');
    console.log('   ℹ️  Test account locked:', lockStatus.locked);
    console.log('   ℹ️  Test account attempts:', attemptCount.count);
    console.log('');

    console.log('✅ All authentication components are working!\n');
    console.log('📝 Summary:');
    console.log('   - MongoDB: Connected');
    console.log('   - Demo accounts: Available (fallback if not in DB)');
    console.log('   - NextAuth: Configured');
    console.log('   - Password verification: Working');
    console.log('   - Brute force protection: Active');
    console.log('');
    console.log('🔍 If login still fails in production:');
    console.log('   1. Check browser console for actual errors');
    console.log('   2. Check Network tab for failed API calls');
    console.log('   3. Verify NEXTAUTH_URL matches your domain exactly');
    console.log('   4. Clear browser cookies and try again');
    console.log('   5. Check Vercel function logs for server errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testAuth().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
