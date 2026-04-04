import fs from 'fs';
import path from 'path';

const root = process.cwd();
const logo = path.join(root, 'public', 'assets', 'englabs_logo.png');
const resFolder = path.join(root, 'android', 'app', 'src', 'main', 'res');

console.log('🚀 Root Branding Sync...');

const replacements = [
    { source: logo, target: path.join(root, 'public', 'shop_logo.png') },
    { source: logo, target: path.join(root, 'assets', 'icon.png') },
    { source: logo, target: path.join(root, 'assets', 'splash.png') }
];

replacements.forEach(r => {
    if (fs.existsSync(r.source)) {
        fs.copyFileSync(r.source, r.target);
        console.log(`✅ Updated: ${path.relative(root, r.target)}`);
    }
});

// Recursively replace all splash.png and ic_launcher*.png in the native Android res folder
function replaceRecursive(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceRecursive(fullPath);
        } else if (file.includes('splash.png') || (file.startsWith('ic_launcher') && file.endsWith('.png'))) {
            fs.copyFileSync(logo, fullPath);
            console.log(`✅ Replaced Native Asset: ${path.relative(resFolder, fullPath)}`);
        }
    }
}

if (fs.existsSync(resFolder)) {
    console.log('🚀 Replacing Android Native Assets in', resFolder);
    replaceRecursive(resFolder);
} else {
    console.warn('⚠️  Android res folder not found at', resFolder);
}

console.log('✨ Brand sync complete.');
