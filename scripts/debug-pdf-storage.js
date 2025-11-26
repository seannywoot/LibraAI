// Debug script to check student_ebooks collection
const { MongoClient, ObjectId } = require('mongodb');

async function checkPDFs() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not set');
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        console.log('Checking student_ebooks collection...\n');

        const pdfs = await db.collection('student_ebooks').find({}).limit(5).toArray();

        console.log(`Found ${pdfs.length} PDFs:\n`);

        pdfs.forEach((pdf, index) => {
            console.log(`PDF ${index + 1}:`);
            console.log(`  ID: ${pdf._id}`);
            console.log(`  User ID: ${pdf.userId}`);
            console.log(`  Filename: ${pdf.filename}`);
            console.log(`  Size: ${pdf.size} bytes`);
            console.log(`  Data type: ${typeof pdf.data}`);
            console.log(`  Is Buffer: ${Buffer.isBuffer(pdf.data)}`);
            if (pdf.data) {
                console.log(`  Data length: ${pdf.data.length || 'N/A'}`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

checkPDFs();
