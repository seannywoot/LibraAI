// Script to create a fresh demo user account
// Usage: node scripts/seed-demo-user.js

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DEMO_EMAIL = 'demo@student.com';
const DEMO_PASSWORD = 'Demo2025';
const DEMO_NAME = 'Demo Student';

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

async function seedDemoUser() {
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

    // Check if demo user already exists
    const existingUser = await users.findOne({ email: DEMO_EMAIL });
    
    if (existingUser) {
      console.log('⚠️  Demo user already exists');
      console.log('📧 Email:', DEMO_EMAIL);
      console.log('👤 Name:', existingUser.name);
      console.log('🔑 Role:', existingUser.role);
      console.log('🆔 User ID:', existingUser._id.toString());
      
      // Update password if needed
      const updatePassword = process.argv.includes('--update-password');
      if (updatePassword) {
        console.log('\n🔄 Updating password...');
        const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
        await users.updateOne(
          { email: DEMO_EMAIL },
          { 
            $set: { 
              passwordHash: hashedPassword,
              updatedAt: new Date()
            } 
          }
        );
        console.log('✅ Password updated successfully');
      } else {
        console.log('\n💡 To update password, run: node scripts/seed-demo-user.js --update-password');
      }
      
      return;
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // Create demo user
    console.log('👤 Creating demo user account...');
    const result = await users.insertOne({
      email: DEMO_EMAIL,
      passwordHash: hashedPassword,
      name: DEMO_NAME,
      role: 'student',
      emailNotifications: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('\n✅ Demo user account created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', DEMO_EMAIL);
    console.log('🔑 Password:', DEMO_PASSWORD);
    console.log('👤 Name:', DEMO_NAME);
    console.log('🎭 Role: student');
    console.log('🆔 User ID:', result.insertedId.toString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now login at: http://localhost:3000/auth');
    console.log('📚 This is a fresh account with no data');
    console.log('💡 The user can add books via:');
    console.log('   - Barcode scanning');
    console.log('   - PDF upload');
    console.log('   - Manual entry');
    console.log('   - Borrowing from library');

  } catch (error) {
    console.error('\n❌ Error creating demo user:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
seedDemoUser();
