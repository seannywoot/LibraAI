const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkPDFStorage() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    
    // Check ebook_pdfs collection
    console.log('=== Checking ebook_pdfs Collection ===\n');
    const pdfsCollection = db.collection('ebook_pdfs');
    
    const pdfCount = await pdfsCollection.countDocuments();
    console.log(`Total PDFs stored: ${pdfCount}`);
    
    if (pdfCount > 0) {
      console.log('\n📄 PDF Documents:\n');
      const pdfs = await pdfsCollection.find({}, {
        projection: {
          filename: 1,
          size: 1,
          bookId: 1,
          uploadedBy: 1,
          uploadedAt: 1,
          contentType: 1
        }
      }).toArray();
      
      pdfs.forEach((pdf, index) => {
        console.log(`${index + 1}. PDF ID: ${pdf._id}`);
        console.log(`   Filename: ${pdf.filename}`);
        console.log(`   Size: ${(pdf.size / 1024).toFixed(2)} KB`);
        console.log(`   Content Type: ${pdf.contentType}`);
        console.log(`   Book ID: ${pdf.bookId || 'Not linked'}`);
        console.log(`   Uploaded By: ${pdf.uploadedBy}`);
        console.log(`   Uploaded At: ${pdf.uploadedAt}`);
        console.log('');
      });
      
      // Check if PDFs have actual data
      const samplePdf = await pdfsCollection.findOne({});
      if (samplePdf) {
        const hasData = samplePdf.data && samplePdf.data.buffer;
        console.log(`✅ Sample PDF has binary data: ${hasData ? 'YES' : 'NO'}`);
        if (hasData) {
          console.log(`   Data size: ${samplePdf.data.buffer.length} bytes`);
        }
      }
    } else {
      console.log('\n⚠️  No PDFs found in database');
      console.log('   This is normal if you haven\'t uploaded any eBooks yet.');
    }
    
    // Check books collection for eBooks
    console.log('\n=== Checking Books Collection for eBooks ===\n');
    const booksCollection = db.collection('books');
    
    const ebookCount = await booksCollection.countDocuments({ format: 'eBook' });
    console.log(`Total eBooks in catalog: ${ebookCount}`);
    
    if (ebookCount > 0) {
      console.log('\n📚 eBook Entries:\n');
      const ebooks = await booksCollection.find(
        { format: 'eBook' },
        { projection: { title: 1, author: 1, ebookUrl: 1 } }
      ).toArray();
      
      ebooks.forEach((book, index) => {
        const isPdfId = /^[a-f\d]{24}$/i.test(book.ebookUrl);
        console.log(`${index + 1}. ${book.title} by ${book.author}`);
        console.log(`   eBook URL: ${book.ebookUrl}`);
        console.log(`   Type: ${isPdfId ? '✅ PDF ID (stored in DB)' : '⚠️  External URL or filename'}`);
        console.log('');
      });
    }
    
    // Check for orphaned PDFs (PDFs not linked to any book)
    console.log('\n=== Checking for Issues ===\n');
    
    const pdfsWithBookId = await pdfsCollection.countDocuments({ bookId: { $ne: null } });
    const pdfsWithoutBookId = await pdfsCollection.countDocuments({ bookId: null });
    
    console.log(`PDFs linked to books: ${pdfsWithBookId}`);
    console.log(`PDFs not linked to books: ${pdfsWithoutBookId}`);
    
    if (pdfsWithoutBookId > 0) {
      console.log('\n⚠️  Some PDFs are not linked to books. This is OK if they were just uploaded.');
    }
    
    // Check if any eBooks reference non-existent PDFs
    if (ebookCount > 0) {
      const ebooksWithPdfIds = await booksCollection.find({
        format: 'eBook',
        ebookUrl: { $regex: /^[a-f\d]{24}$/i }
      }).toArray();
      
      let brokenLinks = 0;
      for (const book of ebooksWithPdfIds) {
        const pdfExists = await pdfsCollection.findOne({ _id: new ObjectId(book.ebookUrl) });
        if (!pdfExists) {
          brokenLinks++;
          console.log(`\n❌ Broken link found:`);
          console.log(`   Book: ${book.title}`);
          console.log(`   Missing PDF ID: ${book.ebookUrl}`);
        }
      }
      
      if (brokenLinks === 0) {
        console.log('\n✅ All eBook PDF links are valid!');
      } else {
        console.log(`\n⚠️  Found ${brokenLinks} broken PDF link(s)`);
      }
    }
    
    console.log('\n=== Summary ===\n');
    console.log(`✅ PDFs in database: ${pdfCount}`);
    console.log(`✅ eBooks in catalog: ${ebookCount}`);
    console.log(`✅ Storage is ${pdfCount > 0 ? 'working properly' : 'ready (no PDFs uploaded yet)'}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkPDFStorage();
