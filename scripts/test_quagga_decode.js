
const Quagga = require('quagga').default;

const config = {
    decoder: {
        readers: ["ean_reader"]
    },
    locate: true,
    src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" // 1x1 pixel red dot
};

try {
    Quagga.decodeSingle(config, function (result) {
        if (result.codeResult) {
            console.log("Result:", result.codeResult.code);
        } else {
            console.log("No barcode detected (expected for dummy image)");
        }
    });
} catch (e) {
    console.error("Error calling decodeSingle:", e);
}
