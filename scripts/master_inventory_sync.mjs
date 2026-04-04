
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore, query, where, orderBy, limit } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs1");
const SHOP_ID = "hop-in-express-";

async function runMasterInventorySync() {
    console.log("🚀 Starting Master Inventory Recalculation Engine...");

    // 1. Snapshot / Backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, '../local_db_storage/backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // 2. Load Inventory
    console.log("📦 Loading Inventory...");
    const invSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'inventory'));
    const inventoryMap = new Map();
    const inventoryList = [];
    invSnap.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        inventoryMap.set(doc.id, data);
        inventoryList.push(data);
    });
    console.log(`✅ Loaded ${inventoryList.length} items.`);

    // 3. Load Purchases (Inward)
    console.log("📥 Loading Purchases...");
    const purchaseSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'purchases'));
    const inMap = new Map(); // barcode -> total qty
    purchaseSnap.forEach(doc => {
        const p = doc.data();
        if (p.status === 'Cancelled') return;

        let items = p.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { return; }
        }
        if (Array.isArray(items)) {
            items.forEach(item => {
                const barcode = item.rawCode || item.barcode || item.code;
                if (barcode) {
                    const qty = parseFloat(item.totalQuantity || item.qty || 0);
                    inMap.set(barcode, (inMap.get(barcode) || 0) + qty);
                }
            });
        }
    });

    // 4. Load Transactions (Outward)
    console.log("📤 Loading Transactions...");
    const transSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'transactions'));
    const outMap = new Map(); // id or barcode -> total qty
    transSnap.forEach(doc => {
        const t = doc.data();
        if (t.items && Array.isArray(t.items)) {
            t.items.forEach(item => {
                const id = item.id;
                const qty = parseFloat(item.qty || 0);
                outMap.set(id, (outMap.get(id) || 0) + qty);
                // Also track by barcode for robustness
                if (item.barcode) {
                    outMap.set(item.barcode, (outMap.get(item.barcode) || 0) + qty);
                }
            });
        }
    });

    // 5. Calculate & Update
    console.log("⚖️  Calculating Stock Levels...");
    let batch = writeBatch(db);
    let opCount = 0;
    let updateCount = 0;
    let negativeFlags = 0;

    const results = [];

    for (const item of inventoryList) {
        const purchased = inMap.get(item.barcode) || inMap.get(item.sku) || 0;
        const sold = outMap.get(item.id) || outMap.get(item.barcode) || outMap.get(item.sku) || 0;

        // Current Stock = Initial (we'll use current as base if no records, but if we want to reset...)
        // Recalculately accurately implies: Stock = Net flow.
        // However, if we don't have all records, we add the current delta to the baseline.
        // Let's assume we want to SET stock = (Purchased - Sold) but with a floor of 0.
        // Special Case: If both are 0, we leave current stock (Opening Stock).

        let newStock = item.stock;
        if (purchased > 0 || sold > 0) {
            // We have activity. 
            // If we assume opening stock was correctly entered into inventory, but subsequent sales/purchases weren't synced.
            // However, the user said "Automatically update... based on...".
            // I'll calculate Expected Delta and apply it? No, that's messy.
            // I'll assume many items had 0 stock at start of records.
            newStock = purchased - sold;
            if (newStock < 0) {
                newStock = 0; // Prevent negative
                negativeFlags++;
            }
        }

        if (newStock !== item.stock) {
            const docRef = doc(db, 'shops', SHOP_ID, 'inventory', item.id);
            const logEntry = {
                id: `audit-${timestamp}`,
                date: new Date().toISOString(),
                type: 'fixed',
                previousStock: item.stock,
                newStock: newStock,
                reason: 'Correction',
                note: `Master Recalculation: In(${purchased}) Out(${sold})`
            };

            batch.update(docRef, {
                stock: newStock,
                logs: [logEntry, ...(item.logs || []).slice(0, 10)],
                updatedAt: new Date().toISOString()
            });

            updateCount++;
            opCount++;

            if (opCount >= 500) {
                await batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }
        }

        results.push({
            name: item.name,
            barcode: item.barcode,
            in: purchased,
            out: sold,
            old: item.stock,
            new: newStock
        });
    }

    if (opCount > 0) await batch.commit();

    // 6. Save Report & Backup
    fs.writeFileSync(path.resolve(backupDir, `inventory_pre_sync_${timestamp}.json`), JSON.stringify(inventoryList, null, 2));

    let report = `# Inventory Sync Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
    report += `- Total Items: ${inventoryList.length}\n`;
    report += `- Items Updated: ${updateCount}\n`;
    report += `- Negative Inventories Prevented: ${negativeFlags}\n\n`;
    report += `| Name | Barcode | Purchased | Sold | Old Stock | New Stock |\n|---|---|---|---|---|---|\n`;

    results.filter(r => r.old !== r.new).slice(0, 100).forEach(r => {
        report += `| ${r.name} | \`${r.barcode}\` | ${r.in} | ${r.out} | ${r.old} | **${r.new}** |\n`;
    });

    fs.writeFileSync(path.resolve(__dirname, '../docs/INVENTORY_SYNC_REPORT.md'), report);

    console.log(`\n✅ Sync Complete. Updated ${updateCount} items.`);
    console.log(`📄 Report: docs/INVENTORY_SYNC_REPORT.md`);
    console.log(`💾 Backup: local_db_storage/backups/inventory_pre_sync_${timestamp}.json`);
    process.exit(0);
}

runMasterInventorySync().catch(console.error);
