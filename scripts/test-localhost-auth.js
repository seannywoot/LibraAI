/**
 * Test localhost authentication
 * This script helps diagnose authentication issues on localhost
 * 
 * Run with: node scripts/test-localhost-auth.js
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manually load .env.local
try {
  const envPath = resolve(__dirname, '../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️  Could not load .env.local:', error.message);
}

import clientPromise from '../src/lib/mongodb.js';
import { comparePassword } from '../src/lib/passwords.js';

const STUDENT_DEMO = {
  email: "student@demo.edu",
  password: "ReadSmart123",
};

const ADMIN_DEMO = {
  email: "admin@libra.ai",
  password: "ManageStacks!",
};

async function testAuth() {
  console.log('🧪 Testing Localhost Authentication\n');

  // Test 1: Environment
  console.log('1️⃣  Environment Check');
  console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('   NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
  console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');

  // Test 2: MongoDB Connection
  console.log('2️⃣  MongoDB Connection');
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    console.log('   ✅ Connected to database:', db.databaseName);
    
    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log('   ℹ️  Total users in database:', usersCount);
    console.log('');
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
    console.log('');
  }

  // Test 3: Demo Accounts
  console.log('3️⃣  Demo Accounts Test');
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'test');
    
    // Test student demo
    const studentUser = await db.collection('users').findOne({ email: STUDENT_DEMO.email });
    if (studentUser) {
      console.log('   ✅ Student demo found in DB');
      const validPassword = await comparePassword(STUDENT_DEMO.password, studentUser.passwordHash);
      console.log('   Password validation:', validPassword ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('   ⚠️  Student demo not in DB (will use fallback)');
    }
    
    // Test admin demo
    const adminUser = await db.collection('users').findOne({ email: ADMIN_DEMO.email });
    if (adminUser) {
      console.log('   ✅ Admin demo found in DB');
      const validPassword = await comparePassword(ADMIN_DEMO.password, adminUser.passwordHash);
      console.log('   Password validation:', validPassword ? '✅ Valid' : '❌ Invalid');
    } else {
      console.log('   ⚠️  Admin demo not in DB (will use fallback)');
    }
    console.log('');
  } catch (error) {
    console.log('   ❌ Demo account test failed:', error.message);
    console.log('');
  }

  // Test 4: Cookie Configuration
  console.log('4️⃣  Cookie Configuration');
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('   Environment:', isProduction ? 'production' : 'development');
  console.log('   Secure cookies:', isProduction ? 'enabled' : 'disabled');
  console.log('   Cookie name:', isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token');
  console.log('');

  // Test 5: Instructions
  console.log('5️⃣  Next Steps');
  console.log('   1. Start the dev server: npm run dev');
  console.log('   2. Open http://localhost:3000/auth in your browser');
  console.log('   3. Open browser DevTools (F12)');
  console.log('   4. Go to Console tab');
  console.log('   5. Try logging in with:');
  console.log('      Student: student@demo.edu / ReadSmart123');
  console.log('      Admin: admin@libra.ai / ManageStacks!');
  console.log('   6. Watch the console for [AUTH] logs');
  console.log('   7. Check Network tab for /api/auth/callback/credentials');
  console.log('');

  console.log('📝 Common Issues:');
  console.log('   - Browser cache: Clear cookies for localhost:3000');
  console.log('   - Old session: Sign out completely first');
  console.log('   - Browser extensions: Try incognito mode');
  console.log('   - Port conflict: Make sure port 3000 is available');
  console.log('');

  process.exit(0);
}

testAuth().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
