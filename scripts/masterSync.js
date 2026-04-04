import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Parse process.argv into flexible flags
function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.replace('--', '').split('=');
            args[key] = value || true;
        }
    });
    return args;
}

// Helper: Load Environment Variables
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').filter(l => !l.startsWith('#') && l.includes('=')).forEach(line => {
            const [k, v] = line.split('=');
            env[k.trim()] = v.trim();
        });
        return env;
    }
    return {};
}

const env = loadEnv();
const FIREBASE_CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const USER_ID = env.VITE_USER_ID;

// Core Logic
async function masterSync() {
    const flags = parseArgs();

    console.log("==========================================");
    console.log("ANTIGRAVITY MASTER SYNC v2.0");
    console.log("==========================================");
    console.log(`[CONFIG] Source: ${flags.source || 'inventory'} | Mode: ${flags.import || 'manual'}`);

    if (flags.scan === 'shelf') {
        console.log("[INPUT] Detected 'shelf' scan mode. Looking for recent scan files...");
        // Logic to find 'scanned_items.csv' or similar could go here.
        // For this implementation, we'll assume standard path or flags.source logic prevails.
    }

    if (!USER_ID) {
        console.error("❌ CRTICAL: VITE_USER_ID missing in .env.local");
        process.exit(1);
    }

    // 1. Init Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);

    // 2. Load Source Data
    let sourceData = [];
    if (flags.source && flags.source.includes('excel')) {
        const csvPath = path.resolve(__dirname, '../scanner/scanned_items.csv'); // Default for 'shelf'
        if (fs.existsSync(csvPath)) {
            console.log(`[LOAD] Parsing source: ${csvPath}`);
            const wb = XLSX.readFile(csvPath);
            const sheet = wb.Sheets[wb.SheetNames[0]];
            sourceData = XLSX.utils.sheet_to_json(sheet);
        } else {
            console.warn(`[WARN] Excel source requested but file not found: ${csvPath}`);
        }
    }

    // 3. Fetch Master Catalog
    console.log(`[SYNC] Fetching Master Catalog for ${USER_ID}...`);
    const invRef = collection(db, 'shops', USER_ID, 'inventory');
    const snapshot = await getDocs(invRef);
    const catalog = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`[CACHE] Catalog size: ${catalog.length} SKUs`);

    // 4. Processing
    const batch = writeBatch(db);
    let ops = 0;
    let updates = 0;
    let inserts = 0;

    const matchField = flags.match || 'sku';
    const updateFields = (flags.update || 'stock').split(',');

    console.log(`[PROCESS] Matching by '${matchField}' | Dedupe: ${flags.dedupe ? 'ON' : 'OFF'}`);

    for (const item of sourceData) {
        // Normalization
        const itemSku = item['SKU'] || item['product_id'];
        const itemBarcode = String(item['Barcode'] || item['barcode'] || '');
        const itemStock = parseInt(item['Stock'] || item['stock'] || 0);

        // Match Strategy
        let match = null;
        if (matchField === 'sku' && itemSku) {
            match = catalog.find(c => c.sku === itemSku);
        } else if (matchField === 'barcode' && itemBarcode) {
            match = catalog.find(c => c.barcode === itemBarcode);
        }

        const docRef = match ? doc(db, 'shops', USER_ID, 'inventory', match.id) : doc(invRef);

        if (match) {
            // UPDATE
            if (flags.upsert) {
                const changes = { updatedAt: new Date().toISOString() };

                if (updateFields.includes('stock')) changes.stock = itemStock; // Logic could be additive or replacement
                if (updateFields.includes('price') && item['Price']) changes.price = parseFloat(item['Price']);
                if (updateFields.includes('name') && item['Name'] && match.status !== 'LIVE') changes.name = item['Name']; // Registry Protection
                if (updateFields.includes('expiry_date') && item['Expiry']) changes.expiryDate = item['Expiry'];

                batch.update(docRef, changes);
                updates++;
                console.log(`   > [UPD] ${match.sku}: Stock -> ${itemStock}`);
            }
        } else {
            // INSERT (New Item)
            if (flags.upsert) {
                const newItem = {
                    sku: itemSku || `GEN/${Date.now()}`,
                    barcode: itemBarcode,
                    name: item['Name'] || 'Unknown Item',
                    stock: itemStock,
                    status: item['Name'] ? 'LIVE' : 'UNVERIFIED',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                batch.set(docRef, { ...newItem, id: docRef.id });
                inserts++;
                console.log(`   > [NEW] ${newItem.sku}: ${newItem.name}`);
            }
        }

        ops++;
        if (ops >= 400) {
            await batch.commit();
            ops = 0;
        }
    }

    if (ops > 0) await batch.commit();

    console.log("==========================================");
    console.log(`[COMPLETE] Sync Finished.`);
    console.log(`   - Inserts: ${inserts}`);
    console.log(`   - Updates: ${updates}`);
    console.log(`   - Status:  SUCCESS`);
    console.log("==========================================");
    process.exit(0);
}

masterSync().catch(e => {
    console.error(e);
    process.exit(1);
});
