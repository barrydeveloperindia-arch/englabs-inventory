
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, initializeFirestore } from "firebase/firestore";
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

async function wipeBadPurchases() {
    const purchRef = collection(db, 'shops', USER_ID, 'purchases');
    const snap = await getDocs(purchRef);

    console.log(`Found ${snap.size} total purchases.`);
    let deletedCount = 0;

    for (const d of snap.docs) {
        const data = d.data();
        if (!data.items || data.items.length === 0) {
            console.log(`🗑️ Deleting Empty Purchase: ${d.id}`);
            await deleteDoc(doc(db, 'shops', USER_ID, 'purchases', d.id));
            deletedCount++;
        }
    }

    console.log(`✅ Deleted ${deletedCount} bad records.`);
}

wipeBadPurchases().catch(console.error);
