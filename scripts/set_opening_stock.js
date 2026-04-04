
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Env
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
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, dbId);
const SHOP_ID = env.VITE_USER_ID || 'hop-in-express-';

// Paths
const SALES_JSON_PATH = path.resolve(__dirname, '../assets/processed_sales_import.json');

async function setOpeningStock() {
    console.log(`🚀 Starting Opening Stock Adjustment for Shop: ${SHOP_ID}`);

    // A. Load Sales
    if (!fs.existsSync(SALES_JSON_PATH)) {
        throw new Error("Sales data not found.");
    }
    const salesData = JSON.parse(fs.readFileSync(SALES_JSON_PATH, 'utf-8'));
    const salesMap = new Map();
    salesData.forEach(item => {
        if (item.barcode) {
            const current = salesMap.get(item.barcode) || 0;
            salesMap.set(item.barcode, current + (parseFloat(item.totalSold) || 0));
        }
    });

    // B. Load Purchases
    const purchasesRef = collection(db, 'shops', SHOP_ID, 'purchases');
    const purchaseSnap = await getDocs(purchasesRef);
    const purchaseMap = new Map();
    purchaseSnap.forEach(doc => {
        let p = doc.data();
        if (p.id === 'OPENING-STOCK-ADJUSTMENT-2025') return; // Skip our own adjustment if exists

        let items = p.items;
        if (typeof items === 'string') try { items = JSON.parse(items); } catch { }
        if (Array.isArray(items)) {
            items.forEach(item => {
                const barcode = item.rawCode || item.barcode;
                if (barcode) {
                    const qty = parseFloat(item.totalQuantity) || 0;
                    const current = purchaseMap.get(barcode) || 0;
                    purchaseMap.set(barcode, current + qty);
                }
            });
        }
    });

    // C. Load Inventory
    const inventoryRef = collection(db, 'shops', SHOP_ID, 'inventory');
    const inventorySnap = await getDocs(inventoryRef);

    const adjustmentItems = [];
    let positiveAdjustments = 0;
    let negativeAdjustments = 0;

    inventorySnap.forEach(doc => {
        const item = doc.data();
        const barcode = item.barcode || item.sku;
        if (!barcode) return;

        const purchased = purchaseMap.get(barcode) || 0;
        const sold = salesMap.get(barcode) || 0;
        const current = parseFloat(item.stock) || 0;

        // Formula: Expected = Purchased - Sold
        // We want: Expected + Adjustment = Current
        // (Purchased - Sold) + Adjustment = Current
        // Adjustment = Current - (Purchased - Sold)
        // Adjustment = Current - Expected

        const expected = purchased - sold;
        const adjustment = current - expected;

        if (Math.abs(adjustment) > 0.001) {
            adjustmentItems.push({
                id: `ADJ-${barcode}`,
                name: item.name || 'Unknown Item',
                rawCode: barcode,
                barcode: barcode,
                totalQuantity: adjustment,
                packSize: 1,
                unitCost: 0, // No cost impact for stock balancing? Or use costPrice?
                description: "Opening Stock System Adjustment"
            });
            if (adjustment > 0) positiveAdjustments++;
            else negativeAdjustments++;
        }
    });

    console.log(`Found ${adjustmentItems.length} items requiring adjustment.`);
    console.log(`(+) Surplus Additions: ${positiveAdjustments}`);
    console.log(`(-) Loss/Correction Deductions: ${negativeAdjustments}`);

    if (adjustmentItems.length === 0) {
        console.log("No adjustments needed.");
        return;
    }

    // D. Split into chunks if necessary (safeguard against 1MB limit)
    // 2500 items * 100 bytes = 250KB. Safe for one doc.
    // We'll create a Purchase Record.

    const adjustmentDoc = {
        id: 'OPENING-STOCK-ADJUSTMENT-2025',
        date: '2025-09-01', // Start of period
        supplierId: 'SYSTEM-ADJUSTMENT',
        supplierName: 'System Opening Stock Adjustment',
        status: 'Completed',
        amount: 0,
        items: JSON.stringify(adjustmentItems), // Purchases usually store items as string or array?
        // inspect_purchase.mjs showed items as Array (mostly), but code handles string. 
        // We will store as Array for cleanliness if possible, but existing code handled JSON parse.
        // Let's store as Array object natively if Firestore supports it well, 
        // but looking at previous inspect, it was "Items Type: object" (Array).
        // Wait, inspect_purchase code: "Items Type: object".
        // But also check "if typeof items === 'string'".
        // I will save as direct Array. 
        createdAt: new Date().toISOString()
    };

    // NOTE: If we use `items: adjustmentItems` (Array), it is better.
    // However, if the array is huge, Firestore might complain about too many indexed fields?
    // No, map/array inside doc is fine, max size 1MB.
    // I'll use Array.
    adjustmentDoc.items = adjustmentItems;

    console.log("💾 Saving Adjustment Record to Firestore...");
    await setDoc(doc(db, 'shops', SHOP_ID, 'purchases', adjustmentDoc.id), adjustmentDoc);

    console.log("✅ Opening Stock Adjustment Applied Successfully.");
    process.exit(0);
}

setOpeningStock().catch(e => {
    console.error(e);
    process.exit(1);
});
