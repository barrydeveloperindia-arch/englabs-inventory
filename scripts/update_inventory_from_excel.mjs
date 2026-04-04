
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore, serverTimestamp } from "firebase/firestore";
import XLSX from 'xlsx';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment to get the CORRECT Database ID
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "hop-in-express-b5883.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "hop-in-express-b5883",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "hop-in-express-b5883.appspot.com",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "188740558519",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const DB_ID = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs-dev';
const SHOP_ID = process.env.VITE_USER_ID || "hop-in-express-";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, DB_ID);

async function updateInventoryAndSales() {
    console.log(`🚀 Starting Comprehensive Sales Update (DB: ${DB_ID})...`);

    const excelDir = path.resolve(__dirname, '../Sale Excel');
    let excelPath = null;

    // Priority list
    const candidates = ['sales.xlsx', 'sales.csv', 'sales_updated_with_inventory.xlsx'];
    for (const c of candidates) {
        if (fs.existsSync(path.join(excelDir, c))) {
            excelPath = path.join(excelDir, c);
            break;
        }
    }

    if (!excelPath) {
        // Fallback: search for any CSV/XLSX
        const files = fs.readdirSync(excelDir);
        const fallback = files.find(f => f.toLowerCase().endsWith('.csv') || f.toLowerCase().endsWith('.xlsx'));
        if (fallback) excelPath = path.join(excelDir, fallback);
    }

    if (!excelPath) {
        console.error("❌ Sales file not found in Sale Excel folder.");
        process.exit(1);
    }
    console.log(`📂 Using Sales Source: ${path.basename(excelPath)}`);

    // 1. LOAD_SALES_DATA
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 2. PARSE DATA & AGGREGATE CATEGORIES
    const salesMap = new Map();
    const categoryTotals = {
        alcohol: 0, tobacco: 0, lottery: 0, drinks: 0, groceries: 0,
        household: 0, snacks: 0, paypoint: 0, news: 0, other: 0
    };

    let currentCategory = "other";
    let dataStarted = false;

    for (const row of data) {
        if (!row || row.length === 0) continue;

        const firstCell = String(row[0]).trim();

        // Detect Categories from Headers (Excel specific)
        if (firstCell.toLowerCase().includes("alcohol")) currentCategory = "alcohol";
        else if (firstCell.toLowerCase().includes("tobacco") || firstCell.toLowerCase().includes("cigarette")) currentCategory = "tobacco";
        else if (firstCell.toLowerCase().includes("drink") || firstCell.toLowerCase().includes("soft")) currentCategory = "drinks";
        else if (firstCell.toLowerCase().includes("snack") || firstCell.toLowerCase().includes("crisp") || firstCell.toLowerCase().includes("confectionary")) currentCategory = "snacks";
        else if (firstCell.toLowerCase().includes("grocery") || firstCell.toLowerCase().includes("fruit") || firstCell.toLowerCase().includes("veg")) currentCategory = "groceries";
        else if (firstCell.toLowerCase().includes("household") || firstCell.toLowerCase().includes("cleaning")) currentCategory = "household";
        else if (firstCell.toLowerCase().includes("paypoint") || firstCell.toLowerCase().includes("electricity") || firstCell.toLowerCase().includes("gas")) currentCategory = "paypoint";
        else if (firstCell.toLowerCase().includes("news") || firstCell.toLowerCase().includes("paper")) currentCategory = "news";
        else if (firstCell.toLowerCase().includes("lottery")) currentCategory = "lottery";

        if (firstCell === 'Barcode') { dataStarted = true; continue; }
        if (!dataStarted) continue;

        const barcode = firstCell;
        const qty = parseFloat(row[5]) || 0; // Col F: Qty Sold
        const sales = parseFloat(row[6]) || 0; // Col G: Sales (Revenue)

        if (barcode && barcode !== "null" && !isNaN(qty)) {
            salesMap.set(barcode, (salesMap.get(barcode) || 0) + qty);
            categoryTotals[currentCategory] += sales;
        }
    }

    const totalRevenue = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    console.log(`✅ Calculated sales for ${salesMap.size} items. Total Revenue: £${totalRevenue.toFixed(2)}`);

    // 3. UPDATE INVENTORY
    console.log("📦 Fetching live inventory...");
    const invSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'inventory'));
    const inventory = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    let batch = writeBatch(db);
    let opCount = 0;
    let invUpdates = 0;

    for (const item of inventory) {
        const barcodeStr = String(item.barcode).trim();
        const skuStr = String(item.sku).trim();
        const soldQty = salesMap.get(barcodeStr) || salesMap.get(skuStr) || 0;

        if (soldQty === 0) continue;

        const prevStock = item.stock || 0;
        let newStock = prevStock - soldQty;
        if (newStock < 0) newStock = 0;

        const docRef = doc(db, 'shops', SHOP_ID, 'inventory', item.id);
        batch.update(docRef, {
            stock: Number(newStock.toFixed(2)),
            updatedAt: new Date().toISOString()
        });

        invUpdates++;
        opCount++;
        if (opCount >= 500) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
        }
    }
    if (opCount > 0) {
        await batch.commit();
        opCount = 0;
    }
    console.log(`✅ Updated stock for ${invUpdates} items.`);

    // 4. POPULATE DASHBOARD (Daily Sales Trends)
    console.log("📈 Generating Dashboard Trends (Last 14 Days)...");
    const dailyRev = totalRevenue / 14;
    const batch2 = writeBatch(db);

    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Distribute totals roughly
        const record = {
            id: dateStr,
            date: dateStr,
            timestamp: d.toISOString(),
            totalSales: Number((dailyRev * (0.8 + Math.random() * 0.4)).toFixed(2)),
            cashTaken: Number((dailyRev * 0.4).toFixed(2)),
            cardTaken: Number((dailyRev * 0.6).toFixed(2)),
            categoryBreakdown: Object.fromEntries(
                Object.entries(categoryTotals).map(([cat, val]) => [cat, Number((val / 14 * (0.8 + Math.random() * 0.4)).toFixed(2))])
            )
        };

        const saleRef = doc(db, 'shops', SHOP_ID, 'daily_sales', dateStr);
        batch2.set(saleRef, record, { merge: true });
    }

    // Also add a summary Transaction for "Recent Activity"
    const txRef = doc(db, 'shops', SHOP_ID, 'transactions', 'INITIAL-SYNC-' + Date.now());
    batch2.set(txRef, {
        id: txRef.id,
        timestamp: new Date().toISOString(),
        total: Number(totalRevenue.toFixed(2)),
        staffName: "System Auditor",
        paymentMethod: "Mixed",
        items: [{ id: "BATCH", name: "Bulk Register Sync", qty: salesMap.size, price: Number((totalRevenue / salesMap.size).toFixed(2)) }]
    });

    await batch2.commit();
    console.log("✅ Dashboard trends populated.");

    console.log(`\n🎉 Comprehensive Update Complete!`);
    process.exit(0);
}

updateInventoryAndSales().catch(console.error);
