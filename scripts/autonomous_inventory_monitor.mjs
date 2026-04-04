
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc, getDoc, collection, addDoc, arrayUnion } from "firebase/firestore";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Firebase Configuration (Matching the project)
const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

import { initializeFirestore } from "firebase/firestore";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs1");
const SHOP_ID = "hop-in-express-";

/**
 * DETECT_ITEM_ID() is handled by the Visual Cortex (TensorFlow.js) 
 * which sends data to this script via a trigger or event.
 * 
 * IDENTIFY_TRANSACTION_TYPE() is inferred from the context or parameters.
 */

async function processInventoryUpdate(itemId, type) {
    console.log(`🔍 [AUTOMATION] Processing ${type} for Item: ${itemId}`);

    try {
        const itemRef = doc(db, 'shops', SHOP_ID, 'inventory', itemId);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            console.error(`❌ Item ${itemId} not found in database.`);
            return "FAIL";
        }

        const itemData = itemSnap.data();
        let currentStock = itemData.stock || 0;
        let newStock = currentStock;

        // INVENTORY UPDATE LOGIC
        if (type === "PURCHASE") {
            newStock += 1;
        } else if (type === "SALE") {
            newStock -= 1;
        }

        // VALIDATE_STOCK_LEVELS() & CHECK_NEGATIVE_STOCK()
        if (newStock < 0) {
            console.warn(`⚠️ Negative stock detected for ${itemData.name}. Correction required.`);
            // In a real system, we might floor at 0 or flag for audit.
            // For now, let's keep it as requested (allow it but log it).
        }

        // LOG_TRANSACTION() & DATABASE UPDATES
        const logEntry = {
            id: `auto-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: type === "PURCHASE" ? "Inward" : "Sale",
            previousStock: currentStock,
            newStock: newStock,
            reason: type === "PURCHASE" ? "Automated Purchase" : "Automated Sale",
            note: "Processed by Visual Cortex Automation"
        };

        if (type === "PURCHASE") {
            const purchaseRecord = {
                id: `PUR-${Date.now()}`,
                date: new Date().toISOString(),
                supplierId: itemData.supplierId || "AUTO_VENDOR",
                invoiceNumber: `AUTO-${Date.now()}`,
                amount: itemData.costPrice || 0,
                items: JSON.stringify([{
                    id: itemId,
                    name: itemData.name,
                    qty: 1,
                    price: itemData.costPrice || 0
                }]),
                status: 'Received',
                purchasedBy: 'VisualCortex_AI'
            };
            await addDoc(collection(db, 'shops', SHOP_ID, 'purchases'), purchaseRecord);
        } else {
            // SALE - Add to transactions if necessary (VisualCortex usually does this, but for sync we log it)
            const transactionRecord = {
                id: `TX-${Date.now()}`,
                timestamp: new Date().toISOString(),
                staffId: 'AI_CORTEX',
                staffName: 'Visual Cortex (Auto)',
                total: itemData.price || 0,
                items: [{
                    id: itemId,
                    name: itemData.name,
                    qty: 1,
                    price: itemData.price || 0
                }]
            };
            await addDoc(collection(db, 'shops', SHOP_ID, 'transactions'), transactionRecord);
        }

        // RUN_INVENTORY_TEST()
        console.log("🧪 Running Inventory Intelligence Tests...");
        let testStatus = "FAIL";
        try {
            // Run the agentic core tests which include inventory logic
            execSync("npm run test:agentic", { stdio: 'inherit' });
            testStatus = "PASS";
            console.log("✅ Tests Passed.");
        } catch (e) {
            console.error("❌ Tests Failed.");
            testStatus = "FAIL";
        }

        if (testStatus === "PASS") {
            // SAVE_TO_DATABASE()
            console.log("💾 Saving to Database...");
            await updateDoc(itemRef, {
                stock: newStock,
                logs: arrayUnion(logEntry),
                updatedAt: new Date().toISOString()
            });

            // BACKUP_DATABASE()
            console.log("🗄️ Creating Database Backup...");
            const backupPath = path.resolve(`backups/inventory_backup_${Date.now()}.json`);
            if (!fs.existsSync('backups')) fs.mkdirSync('backups');
            fs.writeFileSync(backupPath, JSON.stringify({ itemId, previousStock: currentStock, newStock, timestamp: new Date().toISOString() }));

            // AUTO_PUSH_GITHUB()
            console.log("🚀 Pushing to GitHub...");
            try {
                execSync('git add .', { stdio: 'inherit' });
                execSync(`git commit -m "chore(inventory): automated ${type} update for ${itemId}"`, { stdio: 'inherit' });
                execSync('git push origin main', { stdio: 'inherit' });
                console.log("✅ Push Successful.");
            } catch (e) {
                console.warn("⚠️ Git Push failed (possibly no changes or network issue).");
            }

            return "PASS";
        } else {
            // FLAG_ERROR() & STOP_DEPLOYMENT()
            console.error("⛔ [CRITICAL] System Integrity Check Failed. Stopping Deployment.");
            return "FAIL";
        }

    } catch (err) {
        console.error("💥 Automation Error:", err);
        return "FAIL";
    }
}

// Entry point for CLI
const [, , itemId, type] = process.argv;
if (itemId && type) {
    processInventoryUpdate(itemId, type).then(status => {
        console.log(`Final Status: ${status}`);
        process.exit(status === "PASS" ? 0 : 1);
    });
} else {
    console.log("Usage: node scripts/autonomous_inventory_monitor.mjs <itemId> <PURCHASE|SALE>");
}
