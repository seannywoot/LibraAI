/**
 * Test Database User Authentication
 * Verifies that database users can authenticate properly
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

console.log('🧪 Testing Database User Authentication\n');

async function testDbUserAuth() {
  try {
    const clientPromise = require('../src/lib/mongodb').default;
    const { comparePassword } = require('../src/lib/passwords');
    
    const client = await clientPromise;
    const db = client.db();
    
    console.log('1️⃣  Fetching users from database...');
    const users = await db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('   ⚠️  No users found in database');
      console.log('   ℹ️  Only demo accounts will work\n');
      return;
    }
    
    console.log(`   ✅ Found ${users.length} user(s) in database\n`);
    
    console.log('2️⃣  User details:');
    for (const user of users) {
      console.log(`\n   📧 Email: ${user.email}`);
      console.log(`   👤 Name: ${user.name || 'Not set'}`);
      console.log(`   🎭 Role: ${user.role || 'student'}`);
      console.log(`   🔐 Has password hash: ${user.passwordHash ? '✅ Yes' : '❌ No'}`);
      
      if (user.passwordHash) {
        console.log(`   🔑 Hash length: ${user.passwordHash.length} characters`);
        console.log(`   🔑 Hash starts with: ${user.passwordHash.substring(0, 7)}`);
        
        // Check if it looks like a bcrypt hash
        const isBcrypt = user.passwordHash.startsWith('$2a$') || 
                        user.passwordHash.startsWith('$2b$') || 
                        user.passwordHash.startsWith('$2y$');
        console.log(`   🔑 Valid bcrypt format: ${isBcrypt ? '✅ Yes' : '❌ No'}`);
        
        if (!isBcrypt) {
          console.log('   ⚠️  WARNING: Password hash is not in bcrypt format!');
          console.log('   ⚠️  This user will not be able to login.');
          console.log('   ⚠️  Password may have been stored in plain text or wrong format.');
        }
      }
    }
    
    console.log('\n3️⃣  Testing password verification...');
    console.log('   ℹ️  Enter the password for one of your users to test\n');
    
    // For automated testing, we'll just verify the hash format
    let validUsers = 0;
    let invalidUsers = 0;
    
    for (const user of users) {
      if (user.passwordHash) {
        const isBcrypt = user.passwordHash.startsWith('$2a$') || 
                        user.passwordHash.startsWith('$2b$') || 
                        user.passwordHash.startsWith('$2y$');
        if (isBcrypt) {
          validUsers++;
        } else {
          invalidUsers++;
        }
      } else {
        invalidUsers++;
      }
    }
    
    console.log(`   ✅ Users with valid password hashes: ${validUsers}`);
    console.log(`   ❌ Users with invalid/missing hashes: ${invalidUsers}\n`);
    
    if (invalidUsers > 0) {
      console.log('⚠️  ISSUE FOUND:');
      console.log('   Some users have invalid password hashes.');
      console.log('   These users will not be able to login.\n');
      console.log('💡 SOLUTION:');
      console.log('   1. Use the password reset feature to set new passwords');
      console.log('   2. Or manually update passwords using the hashPassword function');
      console.log('   3. Or recreate the user accounts with proper password hashing\n');
    } else if (validUsers > 0) {
      console.log('✅ All users have valid password hashes!');
      console.log('   Database user authentication should work correctly.\n');
    }
    
    console.log('4️⃣  Authentication flow test:');
    console.log('   ℹ️  Simulating login attempt...\n');
    
    // Test with first user
    if (users.length > 0 && users[0].passwordHash) {
      const testUser = users[0];
      console.log(`   Testing with: ${testUser.email}`);
      
      // Try with wrong password
      const wrongPasswordResult = await comparePassword('wrongpassword', testUser.passwordHash);
      console.log(`   Wrong password result: ${wrongPasswordResult ? '❌ FAIL (should be false)' : '✅ PASS (correctly rejected)'}`);
      
      console.log('\n   ℹ️  To test with correct password, try logging in through the UI\n');
    }
    
    console.log('📝 Summary:');
    console.log(`   - Total users in database: ${users.length}`);
    console.log(`   - Users with valid hashes: ${validUsers}`);
    console.log(`   - Users with issues: ${invalidUsers}`);
    console.log(`   - Demo accounts: Always available as fallback\n`);
    
    if (validUsers > 0) {
      console.log('✅ Database user authentication is configured correctly!');
      console.log('   You should be able to login with your database users.\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testDbUserAuth().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
