
import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

async function applyFixes() {
    console.log("🛠️ Starting Inventory Reconciliation Update batch...");

    // Find latest JSON report
    const reportDir = path.resolve(__dirname, '../docs/audit_reports');
    const files = fs.readdirSync(reportDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) {
        console.error("❌ No audit JSON found.");
        process.exit(1);
    }
    const latestReport = path.join(reportDir, files.sort().reverse()[0]);
    console.log(`📄 Reading snapshot: ${latestReport}`);

    const { auditReport } = JSON.parse(fs.readFileSync(latestReport, 'utf-8'));

    const itemsToFix = auditReport.filter(i =>
        i.discrepancies.includes('STOCK_MISMATCH') && i.inventory && i.inventory.id
    );

    console.log(`✅ ${itemsToFix.length} items identified for stock correction.`);

    let batch = writeBatch(db);
    let count = 0;

    for (const item of itemsToFix) {
        const itemRef = doc(db, 'shops', SHOP_ID, 'inventory', item.inventory.id);
        batch.update(itemRef, {
            stock: Number(item.expectedStock.toFixed(2)),
            lastAuditDate: new Date().toISOString(),
            auditNote: `Antigravity Reconciliation Audit (Pur: ${item.purchased.qty}, Sold: ${item.sold.qty})`
        });
        count++;

        if (count % 400 === 0) {
            console.log(`⏳ Committing batch ${Math.ceil(count / 400)}...`);
            await batch.commit();
            batch = writeBatch(db); // RESET BATCH
        }
    }

    if (count % 400 !== 0) {
        await batch.commit();
    }

    console.log(`\n🎉 Success! Updated ${count} items in Firestore.`);
    process.exit(0);
}

// Map the ID in the audit script first!
// Wait, I noticed my audit script DID NOT include 'id' in the 'inventory' object it saved.
// I need to fix that.
applyFixes().catch(console.error);
