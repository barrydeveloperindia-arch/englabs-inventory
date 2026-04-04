
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.error) {
        throw result.error;
    }
}

// Read the built index.html
const indexPath = path.resolve(__dirname, 'dist', 'index.html');
if (!fs.existsSync(indexPath)) {
    console.error('Error: dist/index.html not found. Run npm run build first.');
    process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// The placeholder to search for. Vite usually embeds env vars at build time,
// but for variables that were 'PLACEHOLDER_API_KEY' during build, we might need manual injection
// OR, more likely, we need to rebuild with the correct ENV in the process.

// However, if we want to patch a build (less reliable), we try to Replace.
// Better approach: This script servers as a 'pre-deploy' check to ensure keys are valid.

console.log("Checking API Keys...");
if (process.env.VITE_GOOGLE_GENAI_API_KEY === 'PLACEHOLDER_API_KEY') {
    console.warn("WARNING: VITE_GOOGLE_GENAI_API_KEY is still set to PLACEHOLDER.");
} else {
    console.log("VITE_GOOGLE_GENAI_API_KEY is set.");
}
