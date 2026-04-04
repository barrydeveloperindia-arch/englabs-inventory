const fs = require('fs');
const path = require('path');

const rootDir = process.argv[2] || '.';
const searchBrand = /ENGLABS INVENTORY/g;
const replaceBrand = 'ENGLABS INVENTORY';
const searchBrand2 = /englabs/gi;
const replaceBrand2 = 'englabs';

const ignoreDirs = ['node_modules', '.git', 'dist', '.firebase', '.gemini'];

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (!ignoreDirs.includes(file)) walk(fullPath);
        } else {
            if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.html') || file.endsWith('.plist')) {
                let content = fs.readFileSync(fullPath, 'utf8');
                if (searchBrand.test(content) || searchBrand2.test(content)) {
                    console.log(`Fixing: ${fullPath}`);
                    content = content.replace(searchBrand, replaceBrand);
                    content = content.replace(searchBrand2, replaceBrand2);
                    fs.writeFileSync(fullPath, content, 'utf8');
                }
            }
        }
    }
}

walk(rootDir);
console.log("Global branding sweep complete.");
