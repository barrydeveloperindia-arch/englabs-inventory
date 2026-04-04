
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc, initializeFirestore, writeBatch } from "firebase/firestore";
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
const dbId = env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
const db = initializeFirestore(app, {}, dbId);

async function createHistoricalTransaction() {
    if (!fs.existsSync(JSON_PATH)) {
        console.error("Processed JSON not found.");
        return;
    }

    const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
    const importItems = JSON.parse(rawData);

    console.log(`Loaded ${importItems.length} sales items.`);

    const userId = env.VITE_USER_ID;
    if (!userId) {
        console.error("VITE_USER_ID is missing from .env.local");
        return;
    }

    // 1. Fetch Inventory to map Barcodes -> IDs
    console.log("Fetching inventory map...");
    const inventoryRef = collection(db, 'shops', userId, 'inventory');
    const snapshot = await getDocs(inventoryRef);

    const barcodeMap = new Map(); // barcode -> { id, brand, vatRate }
    snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.barcode) {
            barcodeMap.set(d.barcode, {
                id: doc.id,
                brand: d.brand || 'Generic',
                vatRate: d.vatRate !== undefined ? d.vatRate : 20,
                name: d.name
            });
        }
    });

    console.log(`Mapped ${barcodeMap.size} inventory items.`);

    // 2. Distribute Sales over Q4 2025 (Simulation)
    const START_DATE = new Date("2025-10-01");
    const END_DATE = new Date("2026-01-01");
    const DAYS_SPAN = Math.ceil((END_DATE.getTime() - START_DATE.getTime()) / (1000 * 3600 * 24));

    const salesByDate = new Map(); // DateString -> { items: [], subtotal: 0, costTotal: 0, vatBreakdown: ... }

    function getRandomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    function getOrCreateDayBucket(dateStr) {
        if (!salesByDate.has(dateStr)) {
            salesByDate.set(dateStr, {
                items: [],
                subtotal: 0,
                costTotal: 0,
                vatBreakdown: {
                    0: { gross: 0, net: 0, vat: 0 },
                    5: { gross: 0, net: 0, vat: 0 },
                    20: { gross: 0, net: 0, vat: 0 }
                }
            });
        }
        return salesByDate.get(dateStr);
    }

    console.log(`Distributing sales across ${DAYS_SPAN} days...`);

    for (const item of importItems) {
        const invItem = barcodeMap.get(item.barcode);
        const id = invItem ? invItem.id : crypto.randomUUID();
        const brand = invItem ? invItem.brand : 'Unknown';
        const name = invItem ? invItem.name : item.name;
        const vatRate = invItem ? invItem.vatRate : 20;

        const totalQty = item.totalSold || 0;
        const price = item.price || 0;
        const cost = item.costPrice || 0;

        if (totalQty === 0) continue;

        for (let i = 0; i < totalQty; i++) {
            const saleDate = getRandomDate(START_DATE, END_DATE);
            const dateStr = saleDate.toISOString().split('T')[0];
            const bucket = getOrCreateDayBucket(dateStr);

            // Add item to bucket
            let bucketItem = bucket.items.find(x => x.sku === item.barcode);
            if (bucketItem) {
                bucketItem.qty += 1;
            } else {
                bucket.items.push({
                    id: id,
                    name: name,
                    brand: brand,
                    price: price,
                    costPrice: cost,
                    qty: 1,
                    vatRate: vatRate,
                    sku: item.barcode // Using barcode as SKU
                });
            }

            // Update Totals
            bucket.subtotal += price;
            bucket.costTotal += cost;

            // Update VAT
            const rateMultiplier = vatRate / 100;
            const net = price / (1 + rateMultiplier);
            const vat = price - net;

            if (!bucket.vatBreakdown[vatRate]) bucket.vatBreakdown[vatRate] = { gross: 0, net: 0, vat: 0 };
            bucket.vatBreakdown[vatRate].gross += price;
            bucket.vatBreakdown[vatRate].net += net;
            bucket.vatBreakdown[vatRate].vat += vat;
        }
    }

    // 3. Save Batches
    console.log(`Prepared ${salesByDate.size} daily simulation transactions.`);

    let batch = writeBatch(db);
    let opCount = 0;

    for (const [dateStr, bucket] of salesByDate) {
        const vatTotalForDay = Object.values(bucket.vatBreakdown).reduce((acc, b) => acc + (b ? b.vat : 0), 0);

        const txId = `HIST-${dateStr}`;
        const timestamp = `${dateStr}T12:00:00.000Z`;

        const tx = {
            id: txId,
            timestamp: timestamp,
            staffId: "SYSTEM",
            staffName: "Simulated History",
            subtotal: bucket.subtotal,
            discountAmount: 0,
            total: bucket.subtotal,
            vatTotal: vatTotalForDay,
            paymentMethod: 'Cash',
            items: bucket.items,
            vatBreakdown: bucket.vatBreakdown
        };

        const txRef = doc(db, 'shops', userId, 'transactions', txId);
        batch.set(txRef, tx);
        opCount++;

        // Ledger: Revenue
        const legRef1 = doc(db, 'shops', userId, 'ledger', `LEG-REV-${txId}`);
        batch.set(legRef1, {
            id: `LEG-REV-${txId}`,
            timestamp: timestamp,
            account: 'Sales Revenue',
            type: 'Credit',
            amount: bucket.subtotal - vatTotalForDay,
            referenceId: txId,
            description: `Daily Revenue ${dateStr}`,
            category: 'Sales'
        });
        opCount++;

        // Ledger: Cash
        const legRef2 = doc(db, 'shops', userId, 'ledger', `LEG-CASH-${txId}`);
        batch.set(legRef2, {
            id: `LEG-CASH-${txId}`,
            timestamp: timestamp,
            account: 'Cash in Hand',
            type: 'Debit',
            amount: bucket.subtotal,
            referenceId: txId,
            description: `Daily Cash ${dateStr}`,
            category: 'Sales'
        });
        opCount++;

        // Ledger: VAT
        const legRef3 = doc(db, 'shops', userId, 'ledger', `LEG-VAT-${txId}`);
        batch.set(legRef3, {
            id: `LEG-VAT-${txId}`,
            timestamp: timestamp,
            account: 'VAT Liability',
            type: 'Credit',
            amount: vatTotalForDay,
            referenceId: txId,
            description: `Daily VAT ${dateStr}`,
            category: 'Sales'
        });
        opCount++;

        // Ledger: COGS (Debit Expense)
        if (bucket.costTotal > 0) {
            const legRef4 = doc(db, 'shops', userId, 'ledger', `LEG-COGS-${txId}`);
            batch.set(legRef4, {
                id: `LEG-COGS-${txId}`,
                timestamp: timestamp,
                account: 'Cost of Goods Sold',
                type: 'Debit',
                amount: bucket.costTotal,
                referenceId: txId,
                description: `Daily Cost of Goods ${dateStr}`,
                category: 'Sales'
            });
            opCount++;

            // Ledger: Inventory Asset (Credit Asset) - Reducing Stock Value
            const legRef5 = doc(db, 'shops', userId, 'ledger', `LEG-INV-${txId}`);
            batch.set(legRef5, {
                id: `LEG-INV-${txId}`,
                timestamp: timestamp,
                account: 'Inventory Asset',
                type: 'Credit',
                amount: bucket.costTotal,
                referenceId: txId,
                description: `Stock Reduction ${dateStr}`,
                category: 'Sales'
            });
            opCount++;
        }

        // Commit every 400 ops to stay safe within limit (500)
        if (opCount >= 400) {
            await batch.commit();
            console.log("Committed batch...");
            batch = writeBatch(db); // Reset batch
            opCount = 0;
        }
    }

    // Final commit
    if (opCount > 0) {
        await batch.commit();
        console.log("Committed final batch.");
    }

    console.log("Simulation Complete.");
    process.exit(0);
}

createHistoricalTransaction().catch(e => {
    console.error(e);
    process.exit(1);
});
