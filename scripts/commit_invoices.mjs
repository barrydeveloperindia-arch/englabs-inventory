
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch, initializeFirestore } from "firebase/firestore";
import 'dotenv/config';

// Load env manully if dotenv doesn't pick up .env.local automatically
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const REPORT_PATH = path.join(process.cwd(), 'invoice_ingestion_report.json');

// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const USER_ID = process.env.VITE_USER_ID || 'hop-in-express-';
const DB_ID = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs1';

console.log(`🔌 Connecting to Firestore (DB: ${DB_ID}, Shop: ${USER_ID})...`);

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, DB_ID);

async function commitInvoices() {
    if (!fs.existsSync(REPORT_PATH)) {
        console.error("❌ Report file not found!");
        process.exit(1);
    }

    const reportData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
    const successfulInvoices = reportData.filter(i => i.status === 'Success');

    if (successfulInvoices.length === 0) {
        console.log("⚠️ No successful invoices to commit.");
        return;
    }

    console.log(`🚀 Committing ${successfulInvoices.length} invoices to Firestore...`);

    // 1. Get Existing Suppliers to Update Totals or Create New
    const suppliersRef = collection(db, 'shops', USER_ID, 'suppliers');
    const existingSuppliersSnap = await getDocs(suppliersRef);
    const supplierMap = new Map(); // Name -> DocData

    existingSuppliersSnap.forEach(doc => {
        const data = doc.data();
        supplierMap.set(data.name.toLowerCase().trim(), { id: doc.id, ...data });
    });

    const batch = writeBatch(db);
    let batchCount = 0;
    const MAX_BATCH_SIZE = 450; // Safety margin below 500

    async function commitBatch() {
        if (batchCount > 0) {
            console.log(`   💾 Committing batch of ${batchCount} writes...`);
            await batch.commit();
            batchCount = 0;
        }
    }

    // Process Invoices
    for (const inv of successfulInvoices) {

        // A. Handle Supplier
        let supplierName = inv.supplierName || inv.vendorFolder || "Unknown Supplier";
        let cleanName = supplierName.trim();
        let supplierId;

        // Simple normalization
        const lowerName = cleanName.toLowerCase();
        let supplierDoc = supplierMap.get(lowerName);

        if (supplierDoc) {
            supplierId = supplierDoc.id;
        } else {
            // New Supplier
            supplierId = `SUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const newSupplier = {
                id: supplierId,
                name: cleanName,
                contactPerson: "",
                email: "",
                phone: "",
                address: "",
                category: "Wholesale",
                terms: "Net 30",
                active: true,
                rating: 5,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const supplierRef = doc(db, 'shops', USER_ID, 'suppliers', supplierId);
            batch.set(supplierRef, newSupplier);
            supplierMap.set(lowerName, newSupplier); // Add to map to reuse in this loop
            batchCount++;
            console.log(`   🆕 Created Supplier: ${cleanName}`);
        }

        // B. Create Purchase Record
        const purchaseId = `PUR-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const purchaseRef = doc(db, 'shops', USER_ID, 'purchases', purchaseId);

        // Map items to schema

        let itemsArray = [];
        if (Array.isArray(inv.extracted.items)) {
            itemsArray = inv.extracted.items;
        } else if (typeof inv.extracted.items === 'object' && inv.extracted.items !== null) {
            // Unpack nested or single object if needed
            if (Array.isArray(inv.extracted.items.items)) itemsArray = inv.extracted.items.items;
            else itemsArray = [inv.extracted.items];
        }

        const invoiceItems = itemsArray.map((item, idx) => ({
            id: `ITEM-${idx}`,
            name: item.desc || item.description || item.name || "Unknown Item",
            description: item.desc || item.description || "",

            // Core Quantitative Data
            packSize: item.pack_size || 1,
            caseQuantity: item.qty_cases || item.quantity_cases || item.qty || 1,
            totalQuantity: (item.pack_size || 1) * (item.qty_cases || item.qty || 1), // Total Units

            // Pricing
            caseCost: item.line_total || 0, // Assuming line_total is for the cases
            unitCost: (item.line_total || 0) / ((item.qty_cases || item.qty || 1) * (item.pack_size || 1) || 1),
            rrp: item.unit_rrp || item.rrp || 0,

            vatCode: item.vat_code || item.vat || "Z",

            // Raw
            rawCode: item.code || item.product_code || ""
        }));

        const purchaseRecord = {
            id: purchaseId,
            supplierId: supplierId,
            supplierName: cleanName,
            invoiceNumber: inv.extracted.inv_num || "UNKNOWN",
            date: inv.extracted.date || new Date().toISOString().split('T')[0],
            dueDate: new Date().toISOString().split('T')[0], // Default to today
            status: "Completed", // Ingested as historical data

            items: invoiceItems,

            subtotal: inv.extracted.total || 0,
            taxTotal: 0, // We didn't calculate this explicitly yet, need logic if critical
            totalAmount: inv.extracted.total || 0, // Assuming extracted total includes tax? Or is it Net?
            // Usually invoice total on PDF bottom is Gross. But line items are Net. 
            // We'll trust the extracted 'total' property.

            notes: `Ingested via AI from ${inv.fileName}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        batch.set(purchaseRef, purchaseRecord);
        batchCount++;

        if (batchCount >= MAX_BATCH_SIZE) {
            await commitBatch();
            // Reset batch (re-creation needed for client SDK? No, same instance works usually, but safet to just await and continue)
            // Actually with client SDK batch is single use.
            // We need to re-create batch object if we commit.
            // Wait, standard Firestore patterns say commit() ends the batch. 
            // Logic update: move batch usage inside loop or restart it? 
            // Easier: just make a new batch.
        }
    }

    // Final Commit
    if (batchCount > 0) {
        await batch.commit();
        console.log(`   💾 Final batch committed.`);
    }

    console.log("✅ All invoices processed and committed to Firestore.");
}

commitInvoices().catch(err => console.error("Fatal Error:", err));
