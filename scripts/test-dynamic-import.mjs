// Quick test to see the actual working pattern
async function testPdfParse() {
    // Test 1: Try the dynamic import
    const mod = await import('pdf-parse');
    console.log('Module keys:', Object.keys(mod));
    console.log('Has default?:', mod.default !== undefined);
    console.log('Has __esModule?:', mod.__esModule);

    if (mod.default) {
        console.log('default type:', typeof mod.default);

        // Try calling it
        const testBuffer = Buffer.from('%PDF-1.4\n%test');
        try {
            const result = await mod.default(testBuffer);
            console.log('✅ mod.default() worked!');
        } catch (e) {
            console.log('❌ mod.default() failed:', e.message);
        }
    }
}

testPdfParse().catch(console.error);
