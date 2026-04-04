const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const ARCHITECTURE_DIR = path.join(DOCS_DIR, 'architecture');
const GUIDES_DIR = path.join(DOCS_DIR, 'guides');

// Ensure directories exist
[DOCS_DIR, ARCHITECTURE_DIR, GUIDES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

console.log('--- Create New Documentation ---');
console.log('1. Architecture Doc (docs/architecture/)');
console.log('2. User Guide (docs/guides/)');
console.log('3. General Doc (docs/)');

rl.question('Select category (1-3): ', (answer) => {
    let targetDir = DOCS_DIR;
    if (answer === '1') targetDir = ARCHITECTURE_DIR;
    else if (answer === '2') targetDir = GUIDES_DIR;

    rl.question('Enter document filename (e.g., NEW_FEATURE.md): ', (filename) => {
        if (!filename.endsWith('.md')) filename += '.md';
        const filePath = path.join(targetDir, filename);

        if (fs.existsSync(filePath)) {
            console.error('Error: File already exists!');
            rl.close();
            return;
        }

        const template = `# ${filename.replace('.md', '').replace(/_/g, ' ')}\n\n## 1. Overview\n[Enter detailed overview here]\n\n## 2. Details\n[Enter technical or user-facing details here]\n`;

        fs.writeFileSync(filePath, template);
        console.log(`\n✅ Created: ${filePath}`);
        rl.close();
    });
});
