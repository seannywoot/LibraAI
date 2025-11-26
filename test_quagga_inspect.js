
const Quagga = require('quagga');
console.log("Keys:", Object.keys(Quagga));
if (Quagga.default) {
    console.log("Default Keys:", Object.keys(Quagga.default));
}
