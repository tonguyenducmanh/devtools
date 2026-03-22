const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PKG_DIR = path.join(ROOT, '..', 'pkg');

console.log('Building WASM package...');
console.log('Output directory:', PKG_DIR);

const { execSync } = require('child_process');
try {
    execSync(`wasm-pack build --target web --out-dir "${PKG_DIR}" --release`, {
        cwd: ROOT,
        stdio: 'inherit'
    });

    // Remove unnecessary files
    const filesToRemove = ['.gitignore', 'package.json', 'README.md'];
    filesToRemove.forEach(file => {
        const filePath = path.join(PKG_DIR, file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Removed: ${file}`);
        }
    });

    console.log('WASM build completed successfully!');
    console.log('Output in:', PKG_DIR);
} catch (error) {
    console.error('WASM build failed:', error.message);
    process.exit(1);
}
