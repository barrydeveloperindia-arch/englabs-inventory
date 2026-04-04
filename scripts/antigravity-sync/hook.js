import { saveToDatabase, logFailure } from './db-save.js';
import { pushToGithub } from './git-push.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Config
const configPath = path.join(__dirname, 'config.json');
let config = { AUTO_MODE: false };
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
    console.error("Config missing. automation disabled.");
}

export async function onCommandComplete(commandName, payload) {
    if (config.AUTO_MODE !== 'LIFETIME') {
        console.log("Automation Locked/Disabled via Config.");
        return;
    }

    console.log(`[Antigravity Hook] Triggered by: ${commandName}`);

    // 1. Auto Save DB
    if (config.AUTO_DB_PUSH) {
        await saveToDatabase(commandName, payload);
    }

    // 2. Auto GitHub Push
    if (config.AUTO_GITHUB_PUSH) {
        try {
            await pushToGithub(commandName, payload);
        } catch (err) {
            console.error(`[Antigravity Hook] GitHub Push Failed: ${err.message}`);

            // 3. Fail-Safe Logging
            await logFailure(commandName, err);
        }
    }
}

// Standalone runner for testing or wrapping commands
// Usage: node scripts/antigravity-sync/hook.js "Order Processed" "{\"id\": 123}"
if (process.argv[1] === __filename) {
    if (process.argv[2]) {
        const cmd = process.argv[2];
        const payload = process.argv[3] ? JSON.parse(process.argv[3]) : {};
        onCommandComplete(cmd, payload);
    }
}
