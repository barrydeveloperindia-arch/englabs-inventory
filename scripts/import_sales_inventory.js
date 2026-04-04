
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, writeBatch, increment } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xhr2 from "xhr2";

global.XMLHttpRequest = xhr2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const JSON_PATH = path.resolve(__dirname, '../assets/processed_sales_import.json');

// LOAD ENV
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
const auth = getAuth(app);
const dbId = env.VITE_FIREBASE_DATABASE_ID || 'englabs1';

// Initialize Firestore
// Note: In scripts, sometimes we need standard getFirestore if named app doesn't work well, but let's try strict.
// Actually, for scripts, just default getFirestore is usually fine if we don't have multiple DBs. 
// But we DO have a dbId.
import { initializeFirestore } from "firebase/firestore";
const db = initializeFirestore(app, {}, dbId);

async function importInventory() {
    if (!fs.existsSync(JSON_PATH)) {
        console.error("Processed JSON not found. Run analyze_sales_register.js first.");
        return;
    }

    // console.log("Authenticating...");
    // await signInAnonymously(auth);

    const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
    const importItems = JSON.parse(rawData);

    console.log(`Loaded ${importItems.length} items to import.`);

    const userId = env.VITE_USER_ID || 'hop-in-express-';
    const inventoryRef = collection(db, 'shops', userId, 'inventory');

    // Fetch existing validation map (barcode -> id)
    console.log("Fetching existing inventory for deduplication...");
    const snapshot = await getDocs(inventoryRef);
    const existingBarcodes = new Set();
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.barcode) existingBarcodes.add(d.barcode);
    });

    console.log(`Found ${existingBarcodes.size} existing items.`);

    let added = 0;
    let skipped = 0;
    const batchSize = 400; // Firestore batch limit is 500
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const item of importItems) {
        if (existingBarcodes.has(item.barcode)) {
            skipped++;
            continue;
        }

        const newId = crypto.randomUUID();
        const newItem = {
            id: newId,
            supplierId: '',
            sku: item.barcode, // Use barcode as SKU for now
            barcode: item.barcode,
            name: item.name,
            brand: '', // Could try to extract from name?
            stock: 0, // Import with 0 stock as we don't know current levels
            minStock: 5,
            costPrice: item.costPrice,
            lastBuyPrice: item.costPrice,
            price: item.price,
            category: item.category,
            shelfLocation: 'General',
            unitType: 'pcs',
            packSize: '1',
            origin: 'UK',
            status: 'Active',
            vatRate: 20,

            // Historical Integrity
            logs: [{
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                type: 'audit',
                amount: 0,
                reason: 'Inward',
                note: `Imported from Sales Register (${item.totalSold} sold previously)`
            }]
        };

        const docRef = doc(db, 'shops', userId, 'inventory', newId);
        batch.set(docRef, newItem);
        added++;
        batchCount++;
        existingBarcodes.add(item.barcode); // Prevent dupes within same import file

        if (batchCount >= batchSize) {
            console.log(`Committing batch of ${batchCount}...`);
            await batch.commit();
            batch = writeBatch(db);
            batchCount = 0;
        }
    }

    if (batchCount > 0) {
        console.log(`Committing final batch of ${batchCount}...`);
        await batch.commit();
    }

    console.log("\nImport Complete.");
    console.log(`Added: ${added}`);
    console.log(`Skipped (Duplicate): ${skipped}`);
    process.exit(0);
}

importInventory().catch(e => {
    console.error(e);
    process.exit(1);
});
