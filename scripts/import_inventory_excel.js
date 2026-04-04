
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, initializeFirestore } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env Loader
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

const FIREBASE_CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

async function main() {
    console.log("🚀 Starting Inventory Import...");

    // Check for file
    const potentialPaths = [
        path.resolve(__dirname, '../Inventory 2025-2026.xlsx'),
        path.resolve(__dirname, '../output/Inventory 2025-2026.xlsx'),
        path.resolve(__dirname, '../Inventory.xlsx')
    ];

    let filePath = potentialPaths.find(p => fs.existsSync(p));

    if (!filePath) {
        console.error("❌ File 'Inventory 2025-2026.xlsx' not found in root or output/.");
        console.log("Please upload the file to your project directory.");
        process.exit(1);
    }
    console.log(`📂 Found file: ${filePath}`);

    // Init Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    const dbId = env.VITE_FIREBASE_DATABASE_ID || '(default)';
    const db = initializeFirestore(app, { experimentalForceLongPolling: true }, dbId);

    const userId = env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Target DB: ${dbId} | Shop: ${userId}`);

    // Read Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Assume first sheet
    console.log(`Parsing Sheet: ${sheetName}`);

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Found ${rows.length} rows.`);

    let count = 0;

    for (const row of rows) {
        // Normalize Keys
        const normRow = {};
        Object.keys(row).forEach(k => {
            normRow[k.trim().toLowerCase()] = row[k];
        });

        // Extract Fields
        const barcode = (normRow['barcode'] || normRow['code'] || normRow['sku'] || '').toString();
        const name = normRow['name'] || normRow['description'] || normRow['item'];

        if (!barcode || !name) continue;

        const price = parseFloat(normRow['price'] || normRow['selling price'] || normRow['retail'] || '0');
        const costPrice = parseFloat(normRow['cost'] || normRow['cost price'] || '0');
        const stock = parseInt(normRow['stock'] || normRow['qty'] || normRow['quantity'] || '0');
        const minStock = parseInt(normRow['min_stock'] || normRow['min'] || normRow['alert'] || '5');
        const packSize = (normRow['pack_size'] || normRow['size'] || normRow['pack'] || '1').toString();
        const supplierId = (normRow['supplier'] || normRow['vendor'] || '').toString();

        const category = normRow['category'] || 'Uncategorized';
        const brand = normRow['brand'] || '';

        const itemId = barcode; // Use barcode as ID

        const itemData = {
            id: itemId,
            barcode: barcode,
            sku: barcode,
            name: name,
            brand: brand,
            category: category,
            price: price,
            costPrice: costPrice,
            stock: stock,
            minStock: minStock,
            packSize: packSize,
            supplierId: supplierId,
            vatRate: 20, // Default
            unitType: 'pcs',
            status: 'Active',
            updatedAt: new Date().toISOString()
        };

        // Firestore Write
        await setDoc(doc(db, 'shops', userId, 'inventory', itemId), itemData, { merge: true });
        process.stdout.write(`\r✅ Imported: ${name.substring(0, 20)}...`);
        count++;
    }

    console.log(`\n🎉 Import Complete! ${count} items processed.`);
    process.exit(0);
}

main().catch(console.error);
