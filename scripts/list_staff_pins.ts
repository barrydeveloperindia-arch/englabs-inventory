
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
// CRITICAL: Initialize with the correct Database ID
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
const db = getFirestore(app, dbId);

async function run() {
    const shopId = process.env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Listing staff for Shop ID: ${shopId}`);

    try {
        const staffRef = collection(db, 'shops', shopId, 'staff');
        const snapshot = await getDocs(staffRef);

        if (snapshot.empty) {
            console.log("No staff found!");
        } else {
            console.log("Found Staff:");
            snapshot.forEach(doc => {
                const d = doc.data();
                console.log(`- ${d.name} (${d.role}): Email: ${d.email} | PIN: [${d.pin}] | ID: ${d.id}`);
            });
        }
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

run();
