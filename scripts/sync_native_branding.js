const fs = require('fs');
const path = require('path');

const root = process.cwd();
const publicAssets = path.join(root, 'public', 'assets');
const androidAssetsPublic = path.resolve(root, 'android/app/src/main/assets/public');
const androidAssetsAssets = path.resolve(root, 'android/app/src/main/assets/public/assets');

console.log('🚀 Preparing Native Assets Sync...');

if (!fs.existsSync(androidAssetsAssets)) {
    fs.mkdirSync(androidAssetsAssets, { recursive: true });
}

// Copy ENGLABS logo to all possible paths in android assets
const logoName = 'englabs_logo.png';
const source = path.join(publicAssets, logoName);

if (fs.existsSync(source)) {
    console.log(`✅ Copying logo to android assets...`);
    fs.copyFileSync(source, path.join(androidAssetsAssets, logoName));
    fs.copyFileSync(source, path.join(androidAssetsPublic, 'shop_logo.png'));
    fs.copyFileSync(source, path.join(androidAssetsPublic, 'app-icon.png'));
} else {
    console.error(`❌ SOURCE LOGO NOT FOUND: ${source}`);
}

console.log('✨ Android Asset Injection Complete.');
