// Script to verify admin account
// Usage: node scripts/verify-admin.js

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const ADMIN_EMAIL = 'libraaismartlibraryassistant@gmail.com';

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  }
}

async function verifyAdmin() {
  loadEnv();
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
  
  if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const users = db.collection('users');

    // Find admin
    const admin = await users.findOne({ email: ADMIN_EMAIL });
    
    if (!admin) {
      console.log('❌ Admin account not found');
      return;
    }

    console.log('✅ Admin account found!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔑 Role:', admin.role);
    console.log('🆔 User ID:', admin._id.toString());
    console.log('🔐 Password Hash:', admin.passwordHash ? '✅ Present' : '❌ Missing');
    console.log('📬 Email Notifications:', admin.emailNotifications ? 'Enabled' : 'Disabled');
    console.log('📅 Created:', admin.createdAt);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!admin.passwordHash) {
      console.log('\n⚠️  WARNING: passwordHash field is missing!');
      console.log('This will prevent login. Run: node scripts/seed-admin.js --update-password');
    } else {
      console.log('\n✅ Account is properly configured and ready to use!');
    }

  } catch (error) {
    console.error('\n❌ Error verifying admin account:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
verifyAdmin();
