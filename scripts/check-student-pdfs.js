// Test if student PDFs are being stored and retrieved correctly
require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

async function testStudentPDFs() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found');
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        console.log('=== Checking student_ebooks collection ===\n');

        // Check if collection exists and has documents
        const count = await db.collection('student_ebooks').countDocuments();
        console.log(`Total PDFs in student_ebooks: ${count}\n`);

        if (count === 0) {
            console.log('❌ No PDFs found in student_ebooks collection!');
            console.log('This means PDFs are not being uploaded to MongoDB.\n');
        } else {
            // Get one PDF to inspect
            const pdf = await db.collection('student_ebooks').findOne({});
            console.log('Sample PDF document:');
            console.log(`  ID: ${pdf._id}`);
            console.log(`  User ID: ${pdf.userId}`);
            console.log(`  Filename: ${pdf.filename}`);
            console.log(`  Size: ${pdf.size} bytes`);
            console.log(`  Data exists: ${!!pdf.data}`);
            console.log(`  Data type: ${typeof pdf.data}`);
            console.log(`  Is Buffer: ${Buffer.isBuffer(pdf.data)}`);

            if (pdf.data && pdf.data.buffer) {
                console.log(`  Buffer size: ${pdf.data.buffer.length} bytes`);
            }
        }

        console.log('\n=== Checking personal_libraries collection ===\n');

        const libraryEntry = await db.collection('personal_libraries').findOne({
            fileType: 'application/pdf'
        });

        if (!libraryEntry) {
            console.log('❌ No PDF entries found in personal_libraries!');
        } else {
            console.log('Sample library entry:');
            console.log(`  ID: ${libraryEntry._id}`);
            console.log(`  Title: ${libraryEntry.title}`);
            console.log(`  File URL: ${libraryEntry.fileUrl}`);
            console.log(`  PDF ID reference: ${libraryEntry.pdfId}`);
            console.log(`  File size: ${libraryEntry.fileSize}`);

            // Check if fileUrl format is correct
            if (libraryEntry.fileUrl && libraryEntry.fileUrl.includes('/api/student/ebooks/')) {
                console.log('  ✓ File URL format is correct');
            } else {
                console.log('  ❌ File URL format may be incorrect!');
                console.log(`     Expected: /api/student/ebooks/{id}`);
                console.log(`     Got: ${libraryEntry.fileUrl}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

testStudentPDFs();
