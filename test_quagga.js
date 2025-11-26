
const Quagga = require('quagga');

console.log("Quagga loaded");

try {
    // Mocking a decode attempt (this will likely fail without an actual image, but I want to see if it crashes on load or init)
    // Quagga.decodeSingle usually takes a config object.
    // In Node, we need to provide a src that is a file path or buffer?
    // Quagga documentation says src can be a URL or base64.

    console.log("Quagga.decodeSingle exists:", typeof Quagga.decodeSingle);
} catch (e) {
    console.error("Error:", e);
}
