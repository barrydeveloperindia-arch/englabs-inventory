
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
    console.log("🚀 Starting Full App System Test...");

    // 1. Run Inventory Scan with Test Data
    const scriptPath = path.join(__dirname, 'autoUpdateInventory.js');
    const csvPath = path.join(__dirname, 'test_scan.csv');

    console.log(`\n[TEST PHASE 1] Running Inventory Scan with ${path.basename(csvPath)}...`);

    const scanCommand = `node "${scriptPath}" "${csvPath}"`;

    exec(scanCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error running scan: ${error.message}`);
            return;
        }
        if (stderr) console.error(`Scan Stderr: ${stderr}`);

        console.log(stdout);

        console.log("\n[TEST PHASE 1 COMPLETE] Analyzing Output...");

        let passed = true;
        // Verify Expected Logs
        if (!stdout.includes("[STOCK] ⚠️ Low stock alert")) {
            console.error("❌ FAILED: Low stock alert not triggered.");
            passed = false;
        } else {
            console.log("✅ PASSED: Low stock alert triggered.");
        }

        if (!stdout.includes("[EXPIRY] ❌ Product expired")) {
            console.error("❌ FAILED: Expiry block not triggered.");
            passed = false;
        } else {
            console.log("✅ PASSED: Expiry block triggered.");
        }

        if (!stdout.includes("⚠️ New unknown item detected")) {
            console.error("❌ FAILED: Unknown item alert not triggered.");
            passed = false;
        } else {
            console.log("✅ PASSED: Unknown item alert triggered.");
        }

        // 2. HTTP Check for Admin Flow (Optional/Mocked if server running)
        console.log("\n[TEST PHASE 2] Verifying Admin Endpoint...");
        fetch("http://localhost:3001/admin/unverified-products")
            .then(res => res.json())
            .then(data => {
                const unknownItem = data.find(i => i.barcode === '9999004');
                if (unknownItem) {
                    console.log("✅ PASSED: Admin endpoint returned unverified item.");
                } else {
                    console.warn("⚠️ WARNING: Admin endpoint did not return expected item (Server running? DB synced?)");
                }
                finalize(passed);
            })
            .catch(err => {
                console.warn(`⚠️ WARNING: Could not connect to Admin Endpoint (${err.message}). Is server running?`);
                finalize(passed);
            });
    });
}

function finalize(passed) {
    console.log("\n-----------------------------------");
    if (passed) {
        console.log("✅ SYSTEM TEST PASSED: All logic checks verified.");
    } else {
        console.error("❌ SYSTEM TEST FAILED: See logs above.");
    }
    console.log("-----------------------------------");
}

runTest();
