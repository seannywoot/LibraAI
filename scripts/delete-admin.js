// Script to delete admin account
// Usage: node scripts/delete-admin.js

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

async function deleteAdmin() {
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
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');

    // Check if admin exists
    const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });
    
    if (!existingAdmin) {
      console.log('⚠️  Admin account not found');
      return;
    }

    console.log('📧 Found admin:', ADMIN_EMAIL);
    console.log('🆔 User ID:', existingAdmin._id.toString());

    // Delete admin
    const result = await users.deleteOne({ email: ADMIN_EMAIL });

    if (result.deletedCount > 0) {
      console.log('✅ Admin account deleted successfully');
    } else {
      console.log('⚠️  Failed to delete admin account');
    }

  } catch (error) {
    console.error('\n❌ Error deleting admin account:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
deleteAdmin();
