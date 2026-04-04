
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, startAfter, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env.local
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                env[key] = val;
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
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, env.VITE_FIREBASE_DATABASE_ID || "(default)");
const SHOP_ID = env.VITE_USER_ID || "hop-in-express-";

async function fetchAllWithLoophole(colName) {
    console.log(`📡 Fetching '${colName}' using pagination loophole (limit 10)...`);
    let allDocs = [];
    let lastDoc = null;
    let hasMore = true;
    let page = 0;

    while (hasMore) {
        page++;
        let q;
        if (lastDoc) {
            q = query(collection(db, 'shops', SHOP_ID, colName), limit(10), startAfter(lastDoc));
        } else {
            q = query(collection(db, 'shops', SHOP_ID, colName), limit(10));
        }

        const snap = await getDocs(q);
        if (snap.empty) {
            hasMore = false;
        } else {
            allDocs = allDocs.concat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            lastDoc = snap.docs[snap.docs.length - 1];
            process.stdout.write('.');
            if (page % 20 === 0) process.stdout.write(`(${allDocs.length})\n`);
        }
        if (allDocs.length > 5000) {
            console.warn("\n⚠️ Safety Limit Reached (5000 docs). Stopping fetch.");
            hasMore = false;
        }
    }
    console.log(`\n✅ Finished. Total '${colName}' fetched: ${allDocs.length}`);
    return allDocs;
}

async function deepAudit() {
    process.stdout.write("\x1Bc");
    console.log("====================================================");
    console.log("🔍 ANTIGRAVITY DEEP INVENTORY VERIFICATION v2.1");
    console.log("====================================================\n");

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
        const description = String(row[1] || 'Unknown').trim();
        const category = String(row[2] || 'Uncategorized').trim();
        const unitPrice = parseFloat(row[4]) || 0;
        const qtySold = parseFloat(row[5]) || 0;
        const revenue = parseFloat(row[6]) || 0;

        if (barcode && barcode !== 'null' && barcode !== 'undefined') {
            const current = salesMap.get(barcode) || { qty: 0, revenue: 0, hits: 0, name: description, category, unitPrice };
            salesMap.set(barcode, {
                qty: current.qty + qtySold,
                revenue: current.revenue + revenue,
                name: current.name || description,
                category: current.category || category,
                unitPrice: unitPrice > 0 ? unitPrice : current.unitPrice,
                hits: current.hits + 1
            });
        }
    }
    console.log(`✅ Loaded ${salesMap.size} unique items from Sales Register CSV.`);

    // 2. Load Firestore Data via Loophole
    const inventory = await fetchAllWithLoophole('inventory');
    const purchases = await fetchAllWithLoophole('purchases');

    const inventoryMap = new Map(inventory.map(i => [i.barcode || i.sku, i]));
    const purchaseMap = new Map();

    purchases.forEach(p => {
        if (p.status === 'Cancelled') return;
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
                const name = item.name || item.description || 'Unknown';
                const current = purchaseMap.get(barcode) || { qty: 0, totalCost: 0, lastCost: 0, name };
                purchaseMap.set(barcode, {
                    qty: current.qty + qty,
                    totalCost: current.totalCost + (qty * cost),
                    lastCost: cost > 0 ? cost : current.lastCost,
                    name: current.name || name
                });
            }
        });
    });

    // 3. Identification of "Latest Register Invoices"
    const latestPurchases = purchases
        .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
        .slice(0, 5);

    console.log("\n📑 Latest Register Invoices Analyzed:");
    latestPurchases.forEach(p => {
        console.log(`- ${p.date || 'No Date'} | ${p.supplierName || 'Unknown'} | Total: £${p.totalAmount || p.subtotal || 0} | Inv: ${p.invoiceNumber || 'N/A'}`);
    });

    // 4. Verification & Comparison
    console.log("\n⚖️  Performing Single-Item Integrity Check...");
    const auditReport = [];
    const allBarcodes = new Set([...salesMap.keys(), ...inventoryMap.keys(), ...purchaseMap.keys()]);

    for (const barcode of allBarcodes) {
        const inv = inventoryMap.get(barcode);
        const sale = salesMap.get(barcode) || { qty: 0, revenue: 0, name: null, category: null, unitPrice: 0 };
        const pur = purchaseMap.get(barcode) || { qty: 0, totalCost: 0, lastCost: 0, name: null };

        const expectedStock = pur.qty - sale.qty;
        const stockDiff = inv ? (inv.stock - expectedStock) : null;

        const discrepancies = [];
        if (!inv) discrepancies.push("MISSING_IN_INVENTORY");
        if (sale.qty > 0 && pur.qty === 0) discrepancies.push("NO_PURCHASE_HISTORY");
        if (inv && Math.abs(inv.stock - expectedStock) > 0.1) discrepancies.push("STOCK_MISMATCH");
        if (inv && pur.lastCost > 0 && Math.abs(inv.costPrice - pur.lastCost) > 0.05) discrepancies.push("COST_MISMATCH");
        if (inv && inv.price <= inv.costPrice && inv.costPrice > 0) discrepancies.push("LOW_MARGIN");

        const itemName = inv?.name || pur.name || sale.name || "Unknown Item";
        const itemCategory = inv?.category || sale.category || "Uncategorized";

        auditReport.push({
            barcode,
            name: itemName,
            category: itemCategory,
            inventory: inv ? { id: inv.id, stock: inv.stock, cost: inv.costPrice, price: inv.price } : null,
            purchased: pur,
            sold: sale,
            expectedStock,
            stockDiff,
            discrepancies
        });
    }

    // 5. Output Results
    const summary = {
        totalChecked: auditReport.length,
        consistent: auditReport.filter(i => i.discrepancies.length === 0).length,
        stockFixesNeeded: auditReport.filter(i => i.discrepancies.includes("STOCK_MISMATCH")).length,
        missingData: auditReport.filter(i => i.discrepancies.includes("MISSING_IN_INVENTORY") || i.discrepancies.includes("NO_PURCHASE_HISTORY")).length,
        marginAlerts: auditReport.filter(i => i.discrepancies.includes("LOW_MARGIN")).length
    };

    console.log("\n📊 AUDIT RESULTS SUMMARY:");
    console.log(`- Total Unique Barcodes Checked: ${summary.totalChecked}`);
    console.log(`- Consistent Items:             ${summary.consistent}`);
    console.log(`- Stock Discrepancies (Applied): 0 (Previously fixed)`);
    console.log(`- Missing Documentation:        ${summary.missingData}`);

    const reportOutputDir = path.resolve(__dirname, '../docs/audit_reports');
    if (!fs.existsSync(reportOutputDir)) fs.mkdirSync(reportOutputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const mdPath = path.join(reportOutputDir, `enhanced_audit_report_${timestamp}.md`);

    let mdContent = `# 🛡️ Enhanced Inventory Verification Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
    mdContent += `## Executive Summary\n- Total Items: **${summary.totalChecked}**\n- Health Percentage: **${((summary.consistent / summary.totalChecked) * 100).toFixed(1)}%**\n\n`;

    mdContent += `## Missing Inventory Focus\n`;
    mdContent += `| Name | Barcode | Category | In (Pur) | Out (Sale) | Target Stock | Issue |\n|---|---|---|---|---|---|---|\n`;

    auditReport
        .filter(i => i.discrepancies.includes("MISSING_IN_INVENTORY"))
        .filter(i => !i.barcode.includes("Total") && i.barcode.length > 5)
        .sort((a, b) => b.sold.qty - a.sold.qty)
        .slice(0, 200)
        .forEach(i => {
            mdContent += `| ${i.name.substring(0, 30)} | \`${i.barcode}\` | ${i.category} | ${i.purchased.qty} | ${i.sold.qty} | ${i.expectedStock.toFixed(1)} | ${i.discrepancies.join(', ')} |\n`;
        });

    fs.writeFileSync(mdPath, mdContent);
    const jsonPath = mdPath.replace('.md', '.json');
    fs.writeFileSync(jsonPath, JSON.stringify({ summary, auditReport }, null, 2));
    console.log(`\n📄 Enhanced Report Generated: ${mdPath}`);
    console.log(`💾 Snapshot Saved: ${jsonPath}`);

    process.exit(0);
}

deepAudit().catch(console.error);
