/**
 * Authentication Diagnostics Script
 * Tests authentication configuration and identifies issues
 */

// Load environment variables manually
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

console.log('🔍 LibraAI Authentication Diagnostics\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing');
console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

// Check MongoDB URI format
if (process.env.MONGODB_URI) {
  const uri = process.env.MONGODB_URI;
  const hasDatabase = uri.split('/').length > 3 && uri.split('/')[3].length > 0;
  console.log('🗄️  MongoDB Configuration:');
  console.log('  Database name in URI:', hasDatabase ? '✅ Present' : '❌ Missing');
  if (!hasDatabase) {
    console.log('  ⚠️  Add database name to URI: mongodb+srv://...mongodb.net/DATABASE_NAME');
  }
  console.log('');
}

// Check NEXTAUTH_URL
if (process.env.NEXTAUTH_URL) {
  const url = process.env.NEXTAUTH_URL;
  console.log('🔗 NextAuth URL Configuration:');
  console.log('  Current URL:', url);
  
  if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.log('  ❌ ERROR: Using localhost in production!');
    console.log('  Fix: Set NEXTAUTH_URL to your production domain');
  } else if (url.includes('localhost')) {
    console.log('  ✅ Localhost OK for development');
  } else {
    console.log('  ✅ Production URL configured');
  }
  console.log('');
}

// Test MongoDB connection
console.log('🔌 Testing MongoDB Connection...');
async function testMongoDB() {
  try {
    const clientPromise = require('../src/lib/mongodb').default;
    const client = await clientPromise;
    const db = client.db();
    
    // Test connection
    await db.admin().ping();
    console.log('  ✅ MongoDB connection successful');
    
    // Check users collection
    const users = await db.collection('users').countDocuments();
    console.log(`  ℹ️  Users in database: ${users}`);
    
    // Check if demo accounts exist
    const studentDemo = await db.collection('users').findOne({ email: 'student@demo.edu' });
    const adminDemo = await db.collection('users').findOne({ email: 'admin@libra.ai' });
    
    console.log('  Demo accounts:');
    console.log('    Student:', studentDemo ? '✅ Exists' : '⚠️  Not in DB (using fallback)');
    console.log('    Admin:', adminDemo ? '✅ Exists' : '⚠️  Not in DB (using fallback)');
    
  } catch (error) {
    console.log('  ❌ MongoDB connection failed:', error.message);
    console.log('  Check your MONGODB_URI and network connectivity');
  }
}

testMongoDB().then(() => {
  console.log('\n✅ Diagnostics complete');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Diagnostics failed:', error);
  process.exit(1);
});
