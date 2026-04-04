
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, query, where, initializeFirestore } from "firebase/firestore";
import 'dotenv/config';

const SHOP_ID = "hop-in-express-";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    databaseId: "englabs1"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs1");

async function inspect() {
    console.log("🔍 Inspecting Booker Purchases...");
    const purchasesRef = collection(db, 'shops', SHOP_ID, 'purchases');

    // Fetch all for analysis
    const snap = await getDocs(purchasesRef);
    const purchases = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Find a Booker purchase with 0 amount
    // Need to find Supplier ID for Booker first? 
    // Or just look for one with 0 amount that is NOT empty items.

    // Find a purchase with items having rawCode
    let found = false;
    for (const p of purchases) {
        let items = p.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch { }
        }
        if (Array.isArray(items)) {
            const validItem = items.find(i => i.rawCode && i.rawCode.length > 5);
            if (validItem) {
                console.log("\n--- REAL PRODUCT PURCHASE ---");
                console.log("ID:", p.id);
                console.log("Supplier:", p.supplierName || p.supplierId);
                console.log("Item Sample:", JSON.stringify(validItem, null, 2));
                found = true;
                break;
            }
        }
    }

    if (!found) {
        console.log("No items with valid rawCode found in purchases.");
        // Log keys of first item of first purchase to see what fields exist
        if (purchases.length > 0 && purchases[0].items) {
            let items = purchases[0].items;
            if (typeof items === 'string') try { items = JSON.parse(items); } catch { }
            if (Array.isArray(items) && items.length > 0) {
                console.log("Sample Item Keys:", Object.keys(items[0]));
            }
        }
    }
}

inspect().catch(console.error);
