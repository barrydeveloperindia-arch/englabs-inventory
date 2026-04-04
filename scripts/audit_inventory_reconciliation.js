
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Environment Configuration
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                env[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
        return env;
    }
    return {};
}

const env = loadEnv();

// 2. Initialize Firebase
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const dbId = env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, dbId);

const SHOP_ID = env.VITE_USER_ID || 'hop-in-express-';

// 3. Load Sales Data (Local JSON/Excel Source)
const SALES_JSON_PATH = path.resolve(__dirname, '../assets/processed_sales_import.json');

async function audit() {
    console.log(`🔍 Starting Inventory Reconciliation for Shop: ${SHOP_ID}`);

    // A. Load Sales Ledger
    console.log("📂 Loading Sales Data...");
    if (!fs.existsSync(SALES_JSON_PATH)) {
        console.error(`Missing Sales Data: ${SALES_JSON_PATH}`);
        process.exit(1);
    }
    const salesData = JSON.parse(fs.readFileSync(SALES_JSON_PATH, 'utf-8'));
    // Map: Barcode -> Total Sold
    const salesMap = new Map();
    salesData.forEach(item => {
        if (item.barcode) {
            const current = salesMap.get(item.barcode) || 0;
            salesMap.set(item.barcode, current + (parseFloat(item.totalSold) || 0));
        }
    });
    console.log(`✅ Loaded ${salesData.length} sales records.`);

    // B. Load Purchase Ledger (Firestore)
    console.log("☁️  Fetching Purchase History...");
    const purchasesRef = collection(db, 'shops', SHOP_ID, 'purchases');
    const purchaseSnap = await getDocs(purchasesRef);

    // Map: Barcode -> Total Purchased
    const purchaseMap = new Map();
    let purchaseCount = 0;

    purchaseSnap.forEach(doc => {
        const p = doc.data();
        let items = p.items;

        // Handle stringified items
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { }
        }

        if (Array.isArray(items)) {
            items.forEach(item => {
                // Check if item has barcode (rawCode)
                const barcode = item.rawCode || item.barcode;
                if (barcode) {
                    const qty = parseFloat(item.totalQuantity) || 0;
                    const current = purchaseMap.get(barcode) || 0;
                    purchaseMap.set(barcode, current + qty);
                    purchaseCount++;
                }
            });
        }
    });
    console.log(`✅ Processed ${purchaseSnap.size} purchase invoices (${purchaseCount} items).`);

    // C. Load Current Inventory (Firestore)
    console.log("📦 Fetching Current Inventory...");
    const inventoryRef = collection(db, 'shops', SHOP_ID, 'inventory');
    const inventorySnap = await getDocs(inventoryRef);

    const inventoryItems = [];
    inventorySnap.forEach(doc => {
        const data = doc.data();
        inventoryItems.push({
            id: doc.id,
            name: data.name,
            barcode: data.barcode || data.sku,
            currentStock: parseFloat(data.stock) || 0,
            updatedAt: data.updatedAt
        });
    });
    console.log(`✅ Found ${inventoryItems.length} inventory items.`);

    // D. Reconcile & Generate Report
    console.log("⚖️  Reconciling Stock...");

    let reportMarkdown = `# 📋 Inventory Audit Report
Generated at: ${new Date().toLocaleString()}

| Item Name | Barcode | Purchased (In) | Sold (Out) | Expected Stock | Current Stock | Discrepancy | Status |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---|
`;

    let discrepancies = 0;
    let perfectMatches = 0;
    let missingInfo = 0;

    // Iterate Inventory Items
    inventoryItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    inventoryItems.forEach(item => {
        const barcode = item.barcode;
        if (!barcode) {
            missingInfo++;
            return;
        }

        const purchased = purchaseMap.get(barcode) || 0;
        const sold = salesMap.get(barcode) || 0;

        // Expected = Purchased - Sold (Assuming 0 start)
        // If Purchased is 0, maybe Item existed before?
        // We calculate strictly based on records found.
        const expected = purchased - sold;
        const current = item.currentStock;
        const diff = current - expected;

        // Status Logic
        let status = '✅ Match';
        if (diff !== 0) {
            if (purchased === 0 && sold === 0) {
                status = '⚪ No Activity'; // Initial seed?
            } else if (purchased === 0 && sold > 0) {
                status = '⚠️ Sales without Purchase (Pre-existing/Missing Invoice)';
            } else if (diff < 0) {
                status = '🔻 Missing Stock (Theft/Loss?)';
            } else if (diff > 0) {
                status = '🔺 Surplus Stock (Unrecorded Purchase?)';
            }
            discrepancies++;
        } else {
            perfectMatches++;
        }

        // Only list if there's activity or stock
        if (purchased > 0 || sold > 0 || current > 0) {
            reportMarkdown += `| ${item.name.substring(0, 30)} | \`${barcode}\` | ${purchased} | ${sold} | **${expected.toFixed(2)}** | **${current.toFixed(2)}** | ${(diff > 0 ? '+' : '')}${diff.toFixed(2)} | ${status} |\n`;
        }
    });

    // Summary Section
    const summary = `
## Summary
- **Total Items Audited**: ${inventoryItems.length}
- **Perfect Matches**: ${perfectMatches}
- **Discrepancies found**: ${discrepancies}
- **Items without Barcode**: ${missingInfo}

**Note:** 'Expected Stock' is calculated strictly from available Purchase Invoices and Sales Records. Discrepancies may arise from:
1.  Opening Stock (Items owned before records started).
2.  Missing Purchase Invoices (not uploaded).
3.  Manual Stock Adjustments (Stock Takes).
4.  Theft or Breakage (not recorded).
`;

    const finalReport = summary + "\n" + reportMarkdown;

    // Save Report
    const reportPath = path.resolve(__dirname, '../docs/INVENTORY_AUDIT_REPORT.md');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, finalReport);

    console.log("\n--- AUDIT COMPLETE ---");
    console.log(summary);
    console.log(`\n📄 Detailed Report saved to: ${reportPath}`);
    process.exit(0);
}

audit().catch(e => {
    console.error(e);
    process.exit(1);
});
