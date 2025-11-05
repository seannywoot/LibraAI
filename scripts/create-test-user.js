/**
 * Create Test User
 * Creates a test user in the database with proper password hashing
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

console.log('👤 Create Test User\n');

async function createTestUser() {
  try {
    const clientPromise = require('../src/lib/mongodb').default;
    const { hashPassword } = require('../src/lib/passwords');
    
    const client = await clientPromise;
    const db = client.db();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ 
      email: 'test@example.com' 
    });
    
    if (existingUser) {
      console.log('⚠️  Test user already exists!');
      console.log('   Email: test@example.com');
      console.log('   Role:', existingUser.role || 'student');
      console.log('\n   To login, use:');
      console.log('   Email: test@example.com');
      console.log('   Password: TestPassword123\n');
      return;
    }
    
    console.log('Creating test user...');
    
    // Hash the password
    const passwordHash = await hashPassword('TestPassword123');
    
    // Create user document
    const userDoc = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert into database
    const result = await db.collection('users').insertOne(userDoc);
    
    console.log('✅ Test user created successfully!\n');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: TestPassword123');
    console.log('🎭 Role: student');
    console.log('🆔 ID:', result.insertedId.toString());
    console.log('\n💡 You can now login with these credentials!\n');
    
    // Also create an admin test user
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'testadmin@example.com' 
    });
    
    if (!existingAdmin) {
      console.log('Creating test admin user...');
      
      const adminPasswordHash = await hashPassword('AdminPassword123');
      
      const adminDoc = {
        email: 'testadmin@example.com',
        name: 'Test Admin',
        role: 'admin',
        passwordHash: adminPasswordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const adminResult = await db.collection('users').insertOne(adminDoc);
      
      console.log('✅ Test admin created successfully!\n');
      console.log('📧 Email: testadmin@example.com');
      console.log('🔑 Password: AdminPassword123');
      console.log('🎭 Role: admin');
      console.log('🆔 ID:', adminResult.insertedId.toString());
      console.log('\n💡 You can now login with these credentials!\n');
    }
    
    console.log('📝 Summary:');
    console.log('   ✅ Test users created');
    console.log('   ✅ Passwords properly hashed with bcrypt');
    console.log('   ✅ Ready to test database authentication\n');
    
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
    console.error(error);
  }
}

createTestUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
