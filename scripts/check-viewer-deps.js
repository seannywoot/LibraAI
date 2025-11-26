const fs = require('fs');
const path = require('path');

try {
    const pkgPath = path.join(process.cwd(), 'node_modules', '@react-pdf-viewer', 'core', 'package.json');
    console.log('Reading:', pkgPath);
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    console.log('Dependencies:', pkg.dependencies);
    console.log('PeerDependencies:', pkg.peerDependencies);
} catch (e) {
    console.error('Error:', e.message);
}
