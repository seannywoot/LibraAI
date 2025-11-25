// Test pdf-parse actual usage
const pdfParse = require('pdf-parse');

console.log('=== PDF-Parse Module Analysis ===');
console.log('Type of module:', typeof pdfParse);
console.log('Is function?:', typeof pdfParse === 'function');
console.log('Module keys:', Object.keys(pdfParse));

// Try to understand the structure better
if (pdfParse.default) {
    console.log('Has default:', typeof pdfParse.default);
}

if (pdfParse.PDFParse) {
    console.log('PDFParse type:', typeof pdfParse.PDFParse);
    console.log('PDFParse is constructor?:', pdfParse.PDFParse.prototype !== undefined);
}

// Check if it's a constructor or regular function
console.log('\\nTrying different approaches...');

// Try as direct function (CommonJS pattern)
console.log('1. Direct call test:', typeof pdfParse);

// Check constructor
if (pdfParse.PDFParse) {
    try {
        const instance = new pdfParse.PDFParse();
        console.log('2. PDFParse as constructor worked!');
    } catch (e) {
        console.log('2. PDFParse constructor error:', e.message);
    }
}
