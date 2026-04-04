
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
const auth = getAuth(app);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs1");
const SHOP_ID = "hop-in-express-";

async function deepAudit() {
    console.log("🔐 Authenticating...");
    await signInAnonymously(auth);
    console.log("✅ Authenticated.");

    console.log("🔍 [AUDIT] Starting Deep Inventory Review...");

    // 1. Load Sales (from CSV)
    console.log("📂 Loading Sales Register CSV...");
    const salesCsvPath = path.resolve(__dirname, '../Sale Excel/sales.csv');
    if (!fs.existsSync(salesCsvPath)) {
        console.error("❌ Sales CSV not found!");
        process.exit(1);
    }
    const salesWorkbook = XLSX.readFile(salesCsvPath);
    const salesSheet = salesWorkbook.Sheets[salesWorkbook.SheetNames[0]];
    const salesRows = XLSX.utils.sheet_to_json(salesSheet, { header: 1 });

    const salesMap = new Map();
    let salesDataStarted = false;
    for (const row of salesRows) {
        if (!row || row.length < 6) continue;
        if (row[0] === 'Barcode') { salesDataStarted = true; continue; }
        if (!salesDataStarted) continue;

        const barcode = String(row[0]).trim();
        const qtySold = parseFloat(row[5]) || 0;
        const revenue = parseFloat(row[6]) || 0;
        if (barcode && barcode !== 'null') {
            const current = salesMap.get(barcode) || { qty: 0, revenue: 0 };
            salesMap.set(barcode, {
                qty: current.qty + qtySold,
                revenue: current.revenue + revenue
            });
        }
    }
    console.log(`✅ Loaded ${salesMap.size} unique items from Sales Register.`);

    // 2. Load Firestore Data
    console.log("📦 Loading Live Inventory...");
    const invSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'inventory'));
    const inventory = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const inventoryMap = new Map(inventory.map(i => [i.barcode || i.sku, i]));
    console.log(`✅ Loaded ${inventory.length} items from Firestore Inventory.`);

    console.log("📥 Loading Purchase Invoices...");
    const purSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'purchases'));
    const purchaseMap = new Map();
    purSnap.forEach(doc => {
        const p = doc.data();
        let items = p.items || [];
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { items = []; }
        }
        if (!Array.isArray(items)) items = [items];

        items.forEach(item => {
            const barcode = item.rawCode || item.barcode || item.code || item.sku;
            if (barcode) {
                const qty = parseFloat(item.totalQuantity || item.qty || 0);
                const cost = parseFloat(item.unitCost || item.price || 0);
                const current = purchaseMap.get(barcode) || { qty: 0, totalCost: 0, lastCost: 0 };
                purchaseMap.set(barcode, {
                    qty: current.qty + qty,
                    totalCost: current.totalCost + (qty * cost),
                    lastCost: cost
                });
            }
        });
    });
    console.log(`✅ Loaded ${purchaseMap.size} unique items from Purchase Invoices.`);

    // 3. Verification & Comparison
    console.log("\n⚖️  Comparing Items Individually...");
    const auditReport = [];

    // Iterate over all barcodes seen in any source
    const allBarcodes = new Set([...salesMap.keys(), ...inventoryMap.keys(), ...purchaseMap.keys()]);

    for (const barcode of allBarcodes) {
        const inv = inventoryMap.get(barcode);
        const sale = salesMap.get(barcode) || { qty: 0, revenue: 0 };
        const pur = purchaseMap.get(barcode) || { qty: 0, totalCost: 0, lastCost: 0 };

        const expectedStock = pur.qty - sale.qty;
        const stockDiff = inv ? (inv.stock - expectedStock) : null;

        const discrepancies = [];
        if (!inv) discrepancies.push("MISSING_IN_INVENTORY");
        if (sale.qty > 0 && pur.qty === 0) discrepancies.push("SALE_WITHOUT_PURCHASE");
        if (inv && Math.abs(inv.stock - expectedStock) > 0.01) discrepancies.push("STOCK_MISMATCH");
        if (inv && pur.lastCost > 0 && Math.abs(inv.costPrice - pur.lastCost) > 0.01) discrepancies.push("PRICE_MISMATCH");

        auditReport.push({
            barcode,
            name: inv ? inv.name : (pur.qty > 0 ? "Unknown (From Purchase)" : "Unknown (From Sale)"),
            inventory: inv ? { stock: inv.stock, cost: inv.costPrice, price: inv.price } : null,
            purchased: pur,
            sold: sale,
            expectedStock,
            stockDiff,
            discrepancies
        });
    }

    // 4. Analysis Summary
    const summary = {
        totalItems: auditReport.length,
        missingInInventory: auditReport.filter(i => i.discrepancies.includes("MISSING_IN_INVENTORY")).length,
        saleWithoutPurchase: auditReport.filter(i => i.discrepancies.includes("SALE_WITHOUT_PURCHASE")).length,
        stockMismatches: auditReport.filter(i => i.discrepancies.includes("STOCK_MISMATCH")).length,
        priceMismatches: auditReport.filter(i => i.discrepancies.includes("PRICE_MISMATCH")).length
    };

    console.log("\n📊 AUDIT SUMMARY:");
    console.log(`- Total Items Checked: ${summary.totalItems}`);
    console.log(`- Missing in Inventory: ${summary.missingInInventory}`);
    console.log(`- Sales w/o Purchases:  ${summary.saleWithoutPurchase}`);
    console.log(`- Stock Discrepancies:  ${summary.stockMismatches}`);
    console.log(`- Price Mismatches:     ${summary.priceMismatches}`);

    // 5. Save Report to Separate File
    const reportOutputDir = path.resolve(__dirname, '../docs/audit_reports');
    if (!fs.existsSync(reportOutputDir)) fs.mkdirSync(reportOutputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonPath = path.join(reportOutputDir, `deep_audit_${timestamp}.json`);
    const mdPath = path.join(reportOutputDir, `deep_audit_summary_${timestamp}.md`);

    fs.writeFileSync(jsonPath, JSON.stringify({ summary, items: auditReport }, null, 2));

    let mdContent = `# Deep Inventory Audit Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
    mdContent += `## Summary\n| Metric | Count |\n|---|---|\n`;
    mdContent += `| Total Items Checked | ${summary.totalItems} |\n`;
    mdContent += `| Missing in Inventory | ${summary.missingInInventory} |\n`;
    mdContent += `| Sales without Purchase Record | ${summary.saleWithoutPurchase} |\n`;
    mdContent += `| Stock Mismatches | ${summary.stockMismatches} |\n`;
    mdContent += `| Price Mismatches | ${summary.priceMismatches} |\n\n`;

    mdContent += `## Discrepancy Details (Top 100)\n| Barcode | Name | Inv Stock | Expected | Diff | Issues |\n|---|---|---|---|---|---|\n`;
    auditReport.filter(i => i.discrepancies.length > 0).slice(0, 100).forEach(i => {
        mdContent += `| \`${i.barcode}\` | ${i.name} | ${i.inventory ? i.inventory.stock : 'N/A'} | ${i.expectedStock.toFixed(2)} | ${i.stockDiff ? i.stockDiff.toFixed(2) : 'N/A'} | ${i.discrepancies.join(', ')} |\n`;
    });

    fs.writeFileSync(mdPath, mdContent);
    console.log(`\n📄 Reports saved to:\n- ${jsonPath}\n- ${mdPath}`);
}

deepAudit().catch(console.error);
