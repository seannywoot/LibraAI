// Test BSON Binary handling
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testBinaryHandling() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not found in .env.local');
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        // Find one PDF
        const pdf = await db.collection('student_ebooks').findOne({});

        if (!pdf) {
            console.log('No PDFs found in student_ebooks collection');
            return;
        }

        console.log('PDF Document:');
        console.log('  ID:', pdf._id);
        console.log('  Filename:', pdf.filename);
        console.log('  Size field:', pdf.size);
        console.log('  Data type:', typeof pdf.data);
        console.log('  Is Buffer:', Buffer.isBuffer(pdf.data));
        console.log('  Constructor:', pdf.data?.constructor?.name);

        if (pdf.data) {
            console.log('\nData object keys:', Object.keys(pdf.data));
            console.log('  Has buffer property:', 'buffer' in pdf.data);
            console.log('  Has sub_type:', pdf.data.sub_type);
            console.log('  Has position:', pdf.data.position);

            // Try different extraction methods
            let buffer1, buffer2, buffer3;

            try {
                buffer1 = pdf.data.buffer;
                console.log('\n  Method 1 (pdf.data.buffer):', buffer1 ? buffer1.length : 'null');
            } catch (e) {
                console.log('\n  Method 1 failed:', e.message);
            }

            try {
                buffer2 = Buffer.from(pdf.data);
                console.log('  Method 2 (Buffer.from(pdf.data)):', buffer2.length);
            } catch (e) {
                console.log('  Method 2 failed:', e.message);
            }

            try {
                buffer3 = pdf.data.read(0, pdf.data.length());
                console.log('  Method 3 (pdf.data.read()):', buffer3.length);
            } catch (e) {
                console.log('  Method 3 failed:', e.message);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

testBinaryHandling();
