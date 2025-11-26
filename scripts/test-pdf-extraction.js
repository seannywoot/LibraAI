// Test PDF extraction with pdf-parse
const fs = require('fs');

async function testPDFExtraction() {
  console.log('=== Testing PDF Text Extraction (pdf-parse) ===\n');

  try {
    const pdf = require('pdf-parse');
    console.log('Type of export:', typeof pdf);

    if (typeof pdf === 'function') {
      console.log('✓ pdf-parse export is a function (Correct for v1.1.1)');
    } else {
      console.log('✗ pdf-parse export is NOT a function');
      console.log('Keys:', Object.keys(pdf));
      return false;
    }

    // Simulate Feature Flag check
    const isEnabled = process.env.ENABLE_PDF_PROCESSING === 'true';
    console.log(`ℹ️ ENABLE_PDF_PROCESSING is currently: ${process.env.ENABLE_PDF_PROCESSING} (Enabled: ${isEnabled})`);

    return true;
  } catch (error) {
    console.error('✗ PDF extraction test failed:', error.message);
    return false;
  }
}

testPDFExtraction()
  .then(success => {
    if (success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
