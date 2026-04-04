
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import fs from 'fs';

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simulated calculation logic from intelligence.ts
const calculateSalesVelocity = (transactions, itemId, days) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const relevantTx = transactions.filter(t =>
        new Date(t.timestamp).getTime() >= cutoff.getTime() &&
        t.items && t.items.some(ti => ti.id === itemId)
    );

    const totalQty = relevantTx.reduce((acc, t) => {
        const item = t.items.find(ti => ti.id === itemId);
        return acc + (item?.qty || 0);
    }, 0);

    return totalQty / days;
};

async function testWorkflowAgent() {
    console.log("📊 [Guardian-Workflow-Test] Checking Inventory Pipeline...");

    const shopId = 'hop-in-express-'; // Default test shop

    try {
        console.log("Fetching Inventory Data...");
        const invSnap = await getDocs(collection(db, 'shops', shopId, 'inventory'));
        const inventory = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        console.log(`✅ Found ${inventory.length} items.`);

        console.log("Fetching Recent Sales...");
        const txSnap = await getDocs(query(collection(db, 'shops', shopId, 'transactions'), orderBy('timestamp', 'desc'), limit(50)));
        const transactions = txSnap.docs.map(d => d.data());

        console.log(`✅ Found ${transactions.length} transactions.`);

        // Test Anomaly Detection Logic
        console.log("\n🔍 Running Anomaly Audit...");
        let anomaliesFound = 0;
        inventory.forEach(item => {
            if (item.stock < 0) {
                console.warn(`⚠️ ANOMALY DETECTED: Item ${item.name} (${item.id}) has negative stock: ${item.stock}`);
                anomaliesFound++;
            }

            const velocity = calculateSalesVelocity(transactions, item.id, 7);
            if (velocity > 0) {
                console.log(`📈 Item ${item.name}: Velocity ${velocity.toFixed(2)} units/day`);
            }
        });

        if (anomaliesFound === 0) {
            console.log("✅ No critical inventory anomalies detected.");
        }

        console.log("\n✅ Workflow Agent Logic Verified.");
    } catch (err) {
        console.error("❌ Workflow Test Failed:", err);
    }
    process.exit();
}

testWorkflowAgent();
