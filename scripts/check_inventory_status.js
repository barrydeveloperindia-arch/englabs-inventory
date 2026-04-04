
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.development') });
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, process.env.VITE_FIREBASE_DATABASE_ID || "(default)");

async function checkInventory() {
    const shopId = process.env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Checking Inventory for Shop ID: ${shopId}`);

    try {
        const invRef = collection(db, 'shops', shopId, 'inventory');
        const snapshot = await getDocs(invRef);

        console.log(`\nTotal Inventory Items: ${snapshot.size}`);

        if (snapshot.empty) {
            console.log("No inventory found.");
            process.exit(0);
        }

        // Check for 'createdAt' field to see latest
        const items = snapshot.docs.map(d => d.data());
        const hasCreated = items.filter(i => i.createdAt);

        if (hasCreated.length > 0) {
            hasCreated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            console.log("\n--- Latest 5 Items Added ---");
            hasCreated.slice(0, 5).forEach(i => {
                console.log(`[${i.createdAt}] ${i.name} (Stock: ${i.stock})`);
            });
        } else {
            console.log("\nNo 'createdAt' timestamps found on items. showing first 5 random items:");
            items.slice(0, 5).forEach(i => {
                console.log(`- ${i.name} (Stock: ${i.stock})`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

checkInventory();
