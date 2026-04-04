import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, limit, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Load env manully 
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

console.log(`🔌 Connecting to DB: ${DB_ID}...`);

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, DB_ID);

async function verifyData() {
    // 1. Check Suppliers
    const suppliersRef = collection(db, 'shops', USER_ID, 'suppliers');
    const supSnap = await getDocs(suppliersRef);
    console.log(`\n🏢 Suppliers Found: ${supSnap.size}`);
    supSnap.forEach(d => console.log(`   - ${d.data().name} (ID: ${d.id})`));

    // 2. Check Purchases
    const purchRef = collection(db, 'shops', USER_ID, 'purchases');
    const q = query(purchRef, limit(5)); // just show 5
    const purSnap = await getDocs(q);

    console.log(`\n🧾 Purchases (Sample of ${purSnap.size} fetched):`);
    purSnap.forEach(d => {
        const data = d.data();
        console.log(`   - Invoice #${data.invoiceNumber} | ${data.supplierName} | £${data.totalAmount}`);
        console.log(`     Items: ${data.items ? data.items.length : 0}`);
        if (data.items && data.items.length > 0) {
            console.log(`     Sample Item: ${data.items[0].totalQuantity}x ${data.items[0].name} @ £${data.items[0].unitCost.toFixed(2)}/unit`);
        }
    });

    // Total count of purchases
    const allPurchSnap = await getDocs(purchRef);
    console.log(`\n📊 Total Purchases in DB: ${allPurchSnap.size}`);
}

verifyData().catch(console.error);
