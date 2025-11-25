/**
 * Migration Script: Update type field to resourceType
 * Updates existing academic materials to use the correct field name
 * 
 * Usage: node scripts/migrate-academic-materials-type.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateTypeField() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const books = db.collection('books');

    console.log('🔄 Migrating type field to resourceType...\n');
    console.log('=' .repeat(60));

    // Find all documents with 'type' field
    const docsWithType = await books.find({ type: { $exists: true } }).toArray();
    
    if (docsWithType.length === 0) {
      console.log('✅ No documents found with "type" field. Migration not needed.');
      return;
    }

    console.log(`📚 Found ${docsWithType.length} documents with "type" field\n`);

    let updated = 0;
    let errors = 0;

    for (const doc of docsWithType) {
      try {
        // Update: rename 'type' to 'resourceType'
        await books.updateOne(
          { _id: doc._id },
          { 
            $set: { resourceType: doc.type },
            $unset: { type: "" }
          }
        );

        console.log(`✅ Updated: ${doc.title}`);
        console.log(`   Type: ${doc.type} → resourceType: ${doc.type}\n`);
        updated++;
      } catch (err) {
        console.log(`❌ Error updating ${doc.title}: ${err.message}\n`);
        errors++;
      }
    }

    console.log('=' .repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Updated: ${updated} documents`);
    console.log(`❌ Errors: ${errors} documents`);
    console.log('=' .repeat(60));

    // Verify the migration
    console.log('\n🔍 Verifying migration...\n');
    
    const remainingWithType = await books.countDocuments({ type: { $exists: true } });
    const withResourceType = await books.countDocuments({ resourceType: { $exists: true } });

    console.log(`Documents with "type" field: ${remainingWithType}`);
    console.log(`Documents with "resourceType" field: ${withResourceType}`);

    if (remainingWithType === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Some documents still have "type" field. Please review.');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
migrateTypeField();
