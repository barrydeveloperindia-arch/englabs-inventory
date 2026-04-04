import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, 'antigravity-sync/config.json');

const args = process.argv.slice(2);
const command = args[0];
const subCommand = args[1];
const flag = args[2];

if (command === 'automode' && subCommand === 'enable' && flag === '--lifetime') {
    const config = {
        "AUTO_DB_PUSH": true,
        "AUTO_GITHUB_PUSH": true,
        "AUTO_MODE": "LIFETIME",
        "DISABLE_MANUAL_OVERRIDE": true
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    console.log(`
    🚀 ANTIGRAVITY AUTOMODE: LIFETIME ENABLED
    -----------------------------------------
     [✔] Database Sync      : ON
     [✔] GitHub Auto-Push   : ON
     [🔒] Manual Override   : DISABLED
    
    System is now fully autonomous.
    `);
} else if (command === 'test' && subCommand === 'all') {
    console.log(`
    🧪 STARTING ANTIGRAVITY SYSTEM DIAGNOSTIC...
    --------------------------------------------
    `);

    // Dynamic import to test the actual modules
    import('./antigravity-sync/hook.js').then(async (module) => {
        console.log(" [1/3] Testing Hook Integration...");
        try {
            const payload = {
                test_id: `DIAG_${Date.now()}`,
                status: "OK",
                message: "System Diagnostic Test Payload"
            };

            console.log(" [2/3] Simulating Command Completion...");
            await module.onCommandComplete("ANTIGRAVITY_DIAGNOSTIC_TEST", payload);

            console.log("\n ✅ DIAGNOSTIC COMPLETE. Check your 'logs/' folder and 'local_db_storage/' for records.");
        } catch (e) {
            console.error("\n ❌ DIAGNOSTIC FAILED:", e);
            process.exit(1);
        }
    }).catch(err => {
        console.error("Failed to import hook:", err);
    });

} else {
    console.log("Usage: \n  antigraviti automode enable --lifetime\n  antigraviti test all");
}
