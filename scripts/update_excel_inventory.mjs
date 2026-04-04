
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import XLSX from 'xlsx';

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

async function updateExcelInventory() {
    console.log("🚀 Syncing Live Inventory back to Excel Register...");

    let excelPath = path.resolve(__dirname, '../Sale Excel/sales.xlsx');
    if (!fs.existsSync(excelPath)) {
        excelPath = path.resolve(__dirname, '../Sale Excel/sales.csv');
    }

    if (!fs.existsSync(excelPath)) {
        console.error("❌ Sales source not found.");
        process.exit(1);
    }

    // 1. Load Data
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // 2. Fetch Live Stats
    console.log("📡 Fetching latest stock levels from cloud...");
    const invSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'inventory'));
    const stockMap = new Map();
    invSnap.forEach(doc => {
        const item = doc.data();
        stockMap.set(item.barcode, item.stock);
        stockMap.set(item.sku, item.stock);
    });

    // 3. Transform Data
    console.log("📝 Injecting Live Inventory column...");
    const updatedData = [];
    let headerProcessed = false;
    let inventoryColIndex = -1;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) {
            updatedData.push(row);
            continue;
        }

        if (row[0] === 'Barcode') {
            // Find or Add "Live Stock" header
            inventoryColIndex = row.indexOf('Live Stock');
            if (inventoryColIndex === -1) {
                inventoryColIndex = row.length;
                row.push('Live Stock');
            }
            headerProcessed = true;
            updatedData.push(row);
            continue;
        }

        if (!headerProcessed) {
            updatedData.push(row);
            continue;
        }

        // Data row
        const barcode = String(row[0] || '').trim();
        const liveStock = stockMap.get(barcode);

        if (liveStock !== undefined) {
            row[inventoryColIndex] = liveStock;
        } else {
            row[inventoryColIndex] = 'NOT_FOUND';
        }
        updatedData.push(row);
    }

    // 4. Save
    const newSheet = XLSX.utils.aoa_to_sheet(updatedData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);

    // Always save as .xlsx for better formatting/columns
    const outputPath = path.resolve(__dirname, '../Sale Excel/sales_updated_with_inventory.xlsx');
    XLSX.writeFile(newWorkbook, outputPath);

    console.log(`\n✅ Excel Updated Successfully!`);
    console.log(`💾 Saved to: Sale Excel/sales_updated_with_inventory.xlsx`);
    process.exit(0);
}

updateExcelInventory().catch(console.error);
