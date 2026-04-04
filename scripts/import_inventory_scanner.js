
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import xlsx from 'xlsx';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importInventory() {
    const shopId = process.env.VITE_USER_ID || 'hop-in-express-';
    const filePath = path.join(__dirname, '../scanner/Inventory 2025-26.csv');

    console.log(`Reading Inventory from: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.error("File not found!");
        process.exit(1);
    }

    try {
        // Read buffer
        const buffer = fs.readFileSync(filePath);

        // Use XLSX to parse (autodetects CSV/Excel)
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} items. Starting import for Shop: ${shopId}...`);

        const BATCH_SIZE = 400;
        let batch = writeBatch(db);
        let count = 0;
        let total = 0;

        for (const item of data) {
            // Map Fields (Adjust based on CSV headers)
            // Assuming headers like: Barcode, Name, Cost, Price, Stock

            const barcode = (item['Barcode'] || item['barcode'] || crypto.randomUUID()).toString();
            const name = item['Name'] || item['Description'] || item['product_name'] || 'Unknown Item';
            const price = parseFloat(item['Price'] || item['Retail Price'] || item['price'] || 0);
            const cost = parseFloat(item['Cost'] || item['Cost Price'] || item['cost'] || 0);
            const stock = parseInt(item['Stock'] || item['Quantity'] || item['qty'] || 0);
            const category = item['Category'] || item['Dept'] || 'General';

            const newItem = {
                id: barcode, // Use barcode as ID for easy lookup
                barcode: barcode,
                name: name,
                price: price,
                costPrice: cost,
                stock: stock,
                category: category,
                vatRate: 20, // Default
                unitType: 'pcs',
                status: 'Active',
                sku: barcode,
                brand: item['Brand'] || '',
                supplierId: 'SUP-001', // Default
                createdAt: new Date().toISOString()
            };

            const ref = doc(db, 'shops', shopId, 'inventory', barcode);
            batch.set(ref, newItem);

            count++;
            total++;

            if (count >= BATCH_SIZE) {
                await batch.commit();
                console.log(`Committed ${total} items...`);
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
            console.log(`Committed final ${count} items.`);
        }

        console.log(`✅ Successfully imported ${total} items!`);

    } catch (e) {
        console.error("Import Error:", e);
    }
    process.exit(0);
}

importInventory();
