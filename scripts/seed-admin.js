// Script to seed admin account
// Usage: node scripts/seed-admin.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const ADMIN_EMAIL = 'libraaismartlibraryassistant@gmail.com';
const ADMIN_PASSWORD = 'LibraAI2025';
const ADMIN_NAME = 'LibraAI Admin';

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

async function seedAdmin() {
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

    // Check if admin already exists
    const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      
      // Update password if needed
      const updatePassword = process.argv.includes('--update-password');
      if (updatePassword) {
        console.log('\n🔄 Updating password...');
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await users.updateOne(
          { email: ADMIN_EMAIL },
          { 
            $set: { 
              passwordHash: hashedPassword,
              updatedAt: new Date()
            } 
          }
        );
        console.log('✅ Password updated successfully');
      } else {
        console.log('\n💡 To update password, run: node scripts/seed-admin.js --update-password');
      }
      
      return;
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    console.log('👤 Creating admin account...');
    const result = await users.insertOne({
      email: ADMIN_EMAIL,
      passwordHash: hashedPassword,
      name: ADMIN_NAME,
      role: 'admin',
      emailNotifications: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('\n✅ Admin account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('👤 Name:', ADMIN_NAME);
    console.log('🆔 User ID:', result.insertedId.toString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now login at: http://localhost:3000/auth');
    console.log('⚠️  Remember to keep these credentials secure!');

  } catch (error) {
    console.error('\n❌ Error seeding admin account:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
seedAdmin();
