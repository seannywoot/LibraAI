const fs = require('fs');
const path = require('path');

console.log('=== PDF Route Diagnostics ===\n');

// Check if route file exists
const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'ebooks', '[pdfId]', 'route.js');
const routeExists = fs.existsSync(routePath);

console.log('1. Route File Check:');
console.log(`   Path: ${routePath}`);
console.log(`   Exists: ${routeExists ? '✓ YES' : '✗ NO'}`);

if (!routeExists) {
  console.log('\n   ERROR: Route file not found!');
  console.log('   The file should be at: src/app/api/ebooks/[pdfId]/route.js');
  console.log('   Please create this file with the PDF serving logic.');
  process.exit(1);
}

// Check if upload route exists
const uploadPath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'books', 'upload-pdf', 'route.js');
const uploadExists = fs.existsSync(uploadPath);

console.log('\n2. Upload Route Check:');
console.log(`   Path: ${uploadPath}`);
console.log(`   Exists: ${uploadExists ? '✓ YES' : '✗ NO'}`);

// Check directory structure
console.log('\n3. Directory Structure:');
const ebooksDir = path.join(process.cwd(), 'src', 'app', 'api', 'ebooks');
if (fs.existsSync(ebooksDir)) {
  const contents = fs.readdirSync(ebooksDir);
  console.log(`   Contents of src/app/api/ebooks/:`);
  contents.forEach(item => {
    const itemPath = path.join(ebooksDir, item);
    const isDir = fs.statSync(itemPath).isDirectory();
    console.log(`   ${isDir ? '📁' : '📄'} ${item}`);
  });
} else {
  console.log('   ✗ Directory does not exist');
}

console.log('\n4. Next Steps:');
console.log('   - Restart your Next.js development server');
console.log('   - Upload a new eBook PDF through the Add Book form');
console.log('   - The PDF will be stored in MongoDB and accessible via /api/ebooks/[pdfId]');
console.log('   - Old eBooks (added before this feature) will need to be re-uploaded');

console.log('\n=== Diagnostics Complete ===');
