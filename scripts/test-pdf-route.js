// Test script to verify PDF route is working
// Run this after uploading a PDF through the add book form

const testPdfId = process.argv[2];

if (!testPdfId) {
  console.log('Usage: node scripts/test-pdf-route.js <pdfId>');
  console.log('Example: node scripts/test-pdf-route.js 507f1f77bcf86cd799439011');
  process.exit(1);
}

console.log('Testing PDF route...');
console.log('PDF ID:', testPdfId);
console.log('URL:', `http://localhost:3000/api/ebooks/${testPdfId}`);
console.log('\nTo test:');
console.log('1. Make sure you\'re logged in');
console.log('2. Open the URL above in your browser');
console.log('3. You should see the PDF or get a specific error message');
console.log('\nIf you get "Page not found", the route file might not be in the correct location.');
console.log('Expected location: src/app/api/ebooks/[pdfId]/route.js');
