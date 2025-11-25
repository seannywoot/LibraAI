// Test the actual documented usage of pdf-parse
const pdfParse = require('pdf-parse');
const fs = require('fs');

async function test() {
    // Create a minimal test buffer
    const testPDF = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f\ntrailer\n<<\n/Size 1\n>>\nstartxref\n0\n%%EOF'
    );

    console.log('Type of pdfParse:', typeof pdfParse);
    console.log('Is function?:', typeof pdfParse === 'function');

    try {
        // Standard usage from documentation
        const data = await pdfParse(testPDF);
        console.log('✅ pdfParse(buffer) worked!');
        console.log('Result structure:', Object.keys(data));
    } catch (e) {
        console.log(' pdfParse(buffer) failed:', e.message);
    }
}

test();
