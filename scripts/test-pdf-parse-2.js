// Test actual pdf-parse usage with CommonJS require
const fs = require('fs');
const pdf = require('pdf-parse');

console.log('Type of pdf module:', typeof pdf);

// Check if there's a __esModule flag
console.log('Is ES Module?:', pdf.__esModule);

// Check all properties
console.log('All properties:', Object.getOwnPropertyNames(pdf));

// The library likely exports itself as a function in CommonJS
// Let's see if we can find the main export
if (typeof pdf === 'function') {
    console.log('✅ pdf is directly callable as a function!');
} else {
    console.log('Keys:', Object.keys(pdf));

    // Check for common export patterns
    if (pdf.default && typeof pdf.default === 'function') {
        console.log('✅ pdf.default is the function!');
    }
}
