
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../public/inventory_dump.json');

if (fs.existsSync(jsonPath)) {
    console.log("🛠️ Cleaning localhost URLs in inventory_dump.json...");
    let content = fs.readFileSync(jsonPath, 'utf-8');

    // Replace http://localhost:3001/uploads/ with a relative path or a default placeholder
    // Since these are local files on the user's machine, they won't exist on Vercel anyway.
    // Changing them to relative /uploads/ might work if the user also uploads those files to the repo, 
    // but usually they don't.
    // We'll change them to a specific placeholder or just remove the domain if we want to support local relative path.

    const count = (content.match(/http:\/\/localhost:3001\/uploads\//g) || []).length;

    // Option A: Generic asset placeholder
    // Option B: Relative path (will still 404 on Vercel if files are missing, but no ERR_CONNECTION_REFUSED)
    const cleanedContent = content.replace(/http:\/\/localhost:3001\/uploads\//g, '/uploads/');

    fs.writeFileSync(jsonPath, cleanedContent);
    console.log(`✅ Cleaned ${count} instances of localhost:3001.`);
} else {
    console.error("❌ inventory_dump.json not found.");
}
