
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
const args = process.argv.slice(2);
const envFile = args[0] === 'production' ? '.env.production' : '.env.development';
console.log(`🌍 Environment: ${envFile}`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, process.env.VITE_FIREBASE_DATABASE_ID || "(default)");
const SHOP_ID = process.env.VITE_USER_ID || "hop-in-express-";

/**
 * Sterilizes objects for Firestore by removing undefined values.
 */
function sanitize(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);
    const newObj = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            newObj[key] = sanitize(obj[key]);
        }
    }
    return newObj;
}

async function reconcileAll() {
    console.log("🚀 Starting Comprehensive Inventory Reconciliation...");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // 1. Load Data from CSV (Wholesaler Sale Register)
    console.log("📂 Reading Excel Sale Register...");
    const csvPath = path.resolve(__dirname, '../Sale Excel/sales.csv');
    if (!fs.existsSync(csvPath)) {
        console.error("❌ Sale register CSV not found at:", csvPath);
        process.exit(1);
    }

    // Using XLSX to parse CSV (safest for quoting and commas)
    const workbook = XLSX.readFile(csvPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const csvSalesMap = new Map(); // barcode -> qty
    // Logic: Skip headers. Real data starts after "Barcode,Issue Number..." row.
    let dataStarted = false;
    for (const row of csvRows) {
        if (!row || row.length < 6) continue;
        if (row[0] === 'Barcode' || row[0] === 'Total') {
            if (row[0] === 'Barcode') dataStarted = true;
            continue;
        }
        if (!dataStarted) continue;

        const barcode = String(row[0]).trim();
        const qtySold = parseFloat(row[5]) || 0;
        if (barcode && qtySold > 0) {
            csvSalesMap.set(barcode, (csvSalesMap.get(barcode) || 0) + qtySold);
        }
    }
    console.log(`✅ Loaded ${csvSalesMap.size} products from Sale Register CSV.`);

    // 2. Load Firestore Data
    console.log("📦 Loading Firestore Inventory...");
    const invSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'inventory'));
    const inventoryList = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log("📥 Loading Purchase Records...");
    const purSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'purchases'));
    const purchaseMap = new Map();
    purSnap.forEach(doc => {
        const p = doc.data();
        if (p.status === 'Cancelled') return;
        let items = [];
        try {
            items = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []);
            if (!Array.isArray(items)) items = [items];
        } catch { return; }

        items.forEach(item => {
            const barcode = item.rawCode || item.barcode || item.code;
            if (barcode) {
                const qty = parseFloat(item.totalQuantity || item.qty || 0);
                purchaseMap.set(barcode, (purchaseMap.get(barcode) || 0) + qty);
            }
        });
    });

    console.log("📤 Loading Firestore Transactions...");
    const transSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'transactions'));
    const firestoreSalesMap = new Map();
    transSnap.forEach(doc => {
        const docId = doc.id;
        // Skip historical imports if we are using the CSV as the source of truth for that period
        if (docId.startsWith('HIST-') || docId.startsWith('HISTORICAL-IMPORT') || docId.startsWith('INITIAL-SYNC')) {
            return;
        }

        const t = doc.data();
        if (Array.isArray(t.items)) {
            t.items.forEach(item => {
                const qty = parseFloat(item.qty || 0);
                // Prioritize barcode, then sku, then ID
                const key = item.barcode || item.sku || item.id;
                if (key) {
                    firestoreSalesMap.set(key, (firestoreSalesMap.get(key) || 0) + qty);
                }
            });
        }
    });

    // 3. Merge & Recalculate
    console.log("⚖️  Executing Master Reconciliation...");
    let batch = writeBatch(db);
    let opCount = 0;
    let updateCount = 0;
    const reportData = [];

    for (const item of inventoryList) {
        const purchased = purchaseMap.get(item.barcode) || purchaseMap.get(item.sku) || 0;

        // Sold = MAX(Firestore Logs, CSV Register) OR SUM(They might be disjoint)
        // Given CSV covers Oct-Dec and Firestore likely covers Jan-Feb.
        // We SUM them to get total historical sales.
        const soldFirestore = firestoreSalesMap.get(item.id) || firestoreSalesMap.get(item.barcode) || firestoreSalesMap.get(item.sku) || 0;
        const soldCSV = csvSalesMap.get(item.barcode) || 0;
        const totalSold = soldFirestore + soldCSV;

        let newStock = purchased - totalSold;

        // Opening Stock Edge Case: 
        // If we have 0 purchases but have sales, newStock would be negative.
        // We assume opening stock was positive.
        // But for accurate recalculation "based on records", we floor at 0 unless we have an opening stock baseline.
        if (newStock < 0) newStock = 0;

        if (newStock !== item.stock) {
            const docRef = doc(db, 'shops', SHOP_ID, 'inventory', item.id);
            const logEntry = {
                id: `reconcile-${timestamp}`,
                date: new Date().toISOString(),
                type: 'fixed',
                previousStock: item.stock,
                newStock: newStock,
                reason: 'Correction',
                note: `Reconciliation: Inbound(${purchased}) Sold(FS:${soldFirestore} + CSV:${soldCSV})`
            };

            batch.update(docRef, sanitize({
                stock: Number(newStock.toFixed(2)),
                logs: [logEntry, ...(item.logs || []).slice(0, 10)],
                updatedAt: new Date().toISOString()
            }));

            updateCount++;
            opCount++;

            if (opCount >= 500) {
                await batch.commit();
                batch = writeBatch(db);
                opCount = 0;
            }
        }

        if (purchased > 0 || totalSold > 0) {
            reportData.push({
                name: item.name,
                barcode: item.barcode,
                in: purchased,
                outFS: soldFirestore,
                outCSV: soldCSV,
                old: item.stock,
                new: newStock
            });
        }
    }

    if (opCount > 0) await batch.commit();

    // 4. Reporting
    console.log(`\n🎉 Reconciliation Finished! Updated ${updateCount} items.`);

    let report = `# Master Reconciliation Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
    report += `- Inventory Items: ${inventoryList.length}\n`;
    report += `- Items with Records: ${reportData.length}\n`;
    report += `- Items Updated: ${updateCount}\n\n`;
    report += `| Name | Barcode | Purchased | Sold (FS) | Sold (CSV) | Old Stock | New Stock |\n|---|---|---|---|---|---|---|\n`;

    reportData.sort((a, b) => b.outCSV - a.outCSV).slice(0, 200).forEach(r => {
        report += `| ${r.name.substring(0, 30)} | \`${r.barcode}\` | ${r.in} | ${r.outFS} | ${r.outCSV} | ${r.old} | **${r.new}** |\n`;
    });

    const reportPath = path.resolve(__dirname, '../docs/RECONCILIATION_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Detailed Report: docs/RECONCILIATION_REPORT.md`);
    process.exit(0);
}

reconcileAll().catch(console.error);
