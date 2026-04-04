
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc, query, where, writeBatch, initializeFirestore } from "firebase/firestore";
import 'dotenv/config';

// --- CONFIGURATION ---
const SHOP_ID = "hop-in-express-";
const FORCE_RESYNC = true;

// Firebase Setup
const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732",
    measurementId: "G-SY6450KXL9",
    databaseId: "englabs1"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, "englabs1");

function safeNum(val) {
    if (val === null || val === undefined) return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
}

function sanitize(obj) {
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const newObj = {};
    for (const key in obj) {
        if (obj[key] === undefined) newObj[key] = null;
        else if (typeof obj[key] === 'number' && isNaN(obj[key])) newObj[key] = 0;
        else if (typeof obj[key] === 'object') newObj[key] = sanitize(obj[key]);
        else newObj[key] = obj[key];
    }
    return newObj;
}


async function syncInventory() {
    console.log("🚀 Starting Inventory Synchronization (Repair Mode)...");

    const purchasesRef = collection(db, 'shops', SHOP_ID, 'purchases');
    const inventoryRef = collection(db, 'shops', SHOP_ID, 'inventory');

    console.log("📥 Loading Inventory...");
    const invSnap = await getDocs(inventoryRef);
    const inventory = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`✅ Cached ${inventory.length} inventory items.`);

    console.log("📥 Loading Purchases...");
    const purSnap = await getDocs(purchasesRef);
    const allPurchases = purSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Process items with 0 amount first?
    const unsynced = allPurchases.filter(p =>
        (FORCE_RESYNC === true || p.inventory_synced !== true || (p.amount || 0) === 0)
        && p.status !== 'Cancelled'
    );
    console.log(`📋 Found ${unsynced.length} purchases to process.`);

    let batch = writeBatch(db);
    let opCount = 0;
    let successCount = 0;
    let createdItems = 0;
    let repairedAmounts = 0;

    for (const purchase of unsynced) {
        // console.log(`\nProcessing Purchase: ${purchase.id}`); 

        let items = [];
        if (Array.isArray(purchase.items)) items = purchase.items;
        else if (typeof purchase.items === 'object') items = [purchase.items];
        else if (typeof purchase.items === 'string') {
            try { items = JSON.parse(purchase.items); } catch { items = [{ desc: purchase.items }]; }
            if (!Array.isArray(items)) items = [items];
        }

        let calculatedTotal = 0;
        let purchaseUpdates = {};

        for (const item of items) {
            const code = item.code || item.product_code || item.barcode || item.rawCode;
            const desc = item.desc || item.description || item.name || 'Unknown Item';

            let qtyCases = safeNum(item.qty_cases || item.quantity_cases || item.quantity || item.caseQuantity);
            let packSize = safeNum(item.pack_size || item.packSize || 1);
            if (packSize === 0) packSize = 1;

            let totalQty = safeNum(item.totalQuantity || item.totalQty || (qtyCases * packSize));
            if (totalQty === 0 && qtyCases > 0) totalQty = qtyCases;

            let lineTotal = safeNum(item.line_total || item.total || item.caseCost);
            if (lineTotal === 0 && item.unitCost && totalQty > 0) lineTotal = safeNum(item.unitCost) * totalQty;

            // REPAIR PRICE: Look for existing inventory price if lineTotal is 0
            if (lineTotal === 0 && totalQty > 0) {
                const existing = inventory.find(i => (code && (i.barcode === code || i.sku === code)) || (desc && i.name && i.name.toLowerCase() === desc.toLowerCase()));
                if (existing) {
                    const knownCost = safeNum(existing.lastBuyPrice) || safeNum(existing.costPrice);
                    if (knownCost > 0) {
                        lineTotal = knownCost * totalQty;
                        // console.log(`      💡 Estimating cost for "${desc}": £${lineTotal.toFixed(2)} (using £${knownCost}/unit)`);
                    }
                }
            }

            calculatedTotal += lineTotal;

            // Sync Inventory Logic
            if (totalQty > 0 && (FORCE_RESYNC || purchase.inventory_synced !== true)) {
                let match = null;
                if (code) match = inventory.find(i => (i.barcode === code || i.sku === code));
                if (!match && desc) match = inventory.find(i => i.name && desc && i.name.toLowerCase() === desc.toLowerCase());

                if (match) {
                    const newStock = safeNum(match.stock) + totalQty;
                    const unitCost = lineTotal > 0 ? (lineTotal / totalQty) : safeNum(match.lastBuyPrice);

                    const newLog = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        type: 'relative',
                        amount: totalQty,
                        previousStock: safeNum(match.stock),
                        newStock: newStock,
                        reason: 'Inward',
                        note: `Sync Purchase #${purchase.id.slice(0, 8)}: ${desc}`
                    };

                    const updates = sanitize({
                        stock: newStock,
                        lastBuyPrice: unitCost || safeNum(match.lastBuyPrice),
                        logs: [newLog, ...(match.logs || []).slice(0, 10)]
                    });

                    const itemRef = doc(db, 'shops', SHOP_ID, 'inventory', match.id);
                    batch.update(itemRef, updates);

                    match.stock = newStock;
                    match.logs = [newLog, ...(match.logs || [])];
                    opCount++;
                } else {
                    // New item logic stays same
                    const newItemId = crypto.randomUUID();
                    const unitCost = lineTotal > 0 ? (lineTotal / totalQty) : 0;

                    const newItem = sanitize({
                        id: newItemId,
                        name: desc,
                        barcode: code || '',
                        sku: code || `SKU-${Date.now()}-${createdItems}`,
                        stock: totalQty,
                        costPrice: unitCost,
                        price: unitCost > 0 ? unitCost * 1.5 : 0,
                        category: 'Uncategorized',
                        status: 'UNVERIFIED',
                        createdAt: new Date().toISOString(),
                        logs: [{
                            id: crypto.randomUUID(), date: new Date().toISOString(), type: 'relative',
                            amount: totalQty, previousStock: 0, newStock: totalQty, reason: 'Inward', note: 'Initial Stock from Invoice'
                        }]
                    });

                    const newItemRef = doc(db, 'shops', SHOP_ID, 'inventory', newItemId);
                    batch.set(newItemRef, newItem);
                    createdItems++;
                    opCount++;
                    inventory.push(newItem);
                }
            }
        }

        if (calculatedTotal > 0) {
            const currentAmount = safeNum(purchase.amount);
            if (currentAmount === 0 || Math.abs(currentAmount - calculatedTotal) > 0.01) {
                purchaseUpdates.amount = Number(calculatedTotal.toFixed(2));
                repairedAmounts++;
            }
        }

        if (purchase.inventory_synced !== true) {
            purchaseUpdates.inventory_synced = true;
        }

        if (Object.keys(purchaseUpdates).length > 0) {
            const purRef = doc(db, 'shops', SHOP_ID, 'purchases', purchase.id);
            batch.update(purRef, sanitize(purchaseUpdates));
            opCount++;
        }
        successCount++;

        if (opCount >= 200) {
            console.log(`💾 Committing Batch (${opCount} ops)...`);
            try { await batch.commit(); } catch (e) { console.error("Batch Commit Error:", e); }
            batch = writeBatch(db);
            opCount = 0;
        }
    }

    if (opCount > 0) {
        console.log(`💾 Committing Final Batch (${opCount} ops)...`);
        try { await batch.commit(); } catch (e) { console.error("Final Batch Commit Error:", e); }
    }

    console.log(`\n🎉 Sync Complete! Success: ${successCount}, Repaired: ${repairedAmounts}, New Items: ${createdItems}`);
}

syncInventory().catch(console.error);
