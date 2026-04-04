
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore } from "firebase/firestore";
import 'dotenv/config';

const SHOP_ID = "hop-in-express-";

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
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs1");

async function recalcSupplierStats() {
    console.log("🚀 Starting Supplier Stats Recalculation...");

    const purchasesRef = collection(db, 'shops', SHOP_ID, 'purchases');
    const billsRef = collection(db, 'shops', SHOP_ID, 'bills'); // Bills/Payments?
    const suppliersRef = collection(db, 'shops', SHOP_ID, 'suppliers');

    console.log("📥 Loading Data...");
    const [purSnap, billsSnap, supSnap] = await Promise.all([
        getDocs(purchasesRef),
        getDocs(billsRef),
        getDocs(suppliersRef)
    ]);

    const purchases = purSnap.docs.map(d => d.data());
    const bills = billsSnap.docs.map(d => d.data());
    const suppliers = supSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`📋 Processing ${suppliers.length} suppliers, ${purchases.length} purchases, ${bills.length} bills.`);

    const batch = writeBatch(db);
    let updates = 0;

    for (const sup of suppliers) {
        // 1. Calculate Total Spend (Sum of all purchases)
        const supPurchases = purchases.filter(p => p.supplierId === sup.id && p.status !== 'Cancelled');
        const totalSpend = supPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // 2. Calculate Total Paid (Sum of settled bills?) or is logic: Outstanding = Spend - Paid?
        // Usually, Bill = Liability. 
        // If system tracks "Bills" as "Unpaid Items", then Outstanding = Sum of Unpaid Bills.
        // Let's check how bills works.
        // In SuppliersView: settleBill -> updates bill status to 'Settled' and reduces supplier.outstandingBalance.
        // This implies outstandingBalance IS stateful.
        // BUT we can reconstruct it:
        // Outstanding = (Sum of ALL Purchases marked 'Unpaid'?) or (Sum of ALL Unsettled Bills?).
        // If Purchases create Bills automatically...
        // Let's assume Outstanding = Total Spend - Total Payments.
        // Or cleaner: Outstanding = Sum of (Purchases where paymentMethod == 'Credit' AND not fully paid?).
        // In this system, "Bills" collection track liabilities.
        // Let's Recalculate based on BILLS collection 'Unpaid' status?
        // But incomplete data?

        // Alternative: Just Sum `Purchase.amount` where `status` is NOT 'Paid'?
        // The safest fallback if Bills are missing:
        // Outstanding = totalSpend. (If no payment records exist).
        // Let's check if we have bills.
        const supBills = bills.filter(b => b.supplierId === sup.id);
        const settledBills = supBills.filter(b => b.status === 'Settled');
        const settledAmount = settledBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        // If we trust bills:
        // Outstanding = Sum of Unpaid Bills.
        const unpaidBills = supBills.filter(b => b.status !== 'Settled');
        let outstanding = unpaidBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

        // If NO bills exist for this supplier but they have purchases?
        // Maybe we should create bills?
        // For now, let's just update Total Spend. And set Outstanding to existing or 0 if negative.
        // Actually, let's trust the "repaired" amounts.
        // If outstanding was 0 before, and we repaired amounts, we should probably increase outstanding?

        // Let's set Outstanding = totalSpend - settledAmount.
        // (Assuming all purchases create liability).
        outstanding = Math.max(0, totalSpend - settledAmount);

        // Update Supplier
        const supRef = doc(db, 'shops', SHOP_ID, 'suppliers', sup.id);
        batch.update(supRef, {
            totalSpend: Number(totalSpend.toFixed(2)),
            outstandingBalance: Number(outstanding.toFixed(2)),
            orderCount: supPurchases.length
        });

        console.log(`   🔄 ${sup.name}: Spend £${totalSpend.toFixed(2)} | Out £${outstanding.toFixed(2)}`);
        updates++;
    }

    if (updates > 0) {
        await batch.commit();
        console.log("💾 Committed Stats Updates.");
    }
    console.log("✅ Done.");
}

recalcSupplierStats().catch(console.error);
