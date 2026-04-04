import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import * as dotenv from 'dotenv';

// Load Env from .env.local
dotenv.config({ path: '.env.local' });

// Standard Config (Node.js compatible)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
// Force DB ID if needed
const db = getFirestore(app, process.env.VITE_FIREBASE_DATABASE_ID || 'englabs1');

const deleteStaff = async (ids: string[]) => {
    const userId = process.env.VITE_USER_ID || 'shop_1'; // Default or from Env
    console.log(`Connecting to DB: ${process.env.VITE_FIREBASE_DATABASE_ID || 'Default'}`);
    console.log(`Target Shop: ${userId}`);

    for (const id of ids) {
        try {
            console.log(`Attempting to delete Staff ID: ${id}...`);
            await deleteDoc(doc(db, 'shops', userId, 'staff', id));
            console.log(`✅ Successfully deleted: ${id}`);
        } catch (e) {
            console.error(`❌ Failed to delete ${id}:`, e);
        }
    }
};

// Execution
(async () => {
    const targetIds = process.argv.slice(2);
    if (targetIds.length === 0) {
        console.log("Usage: npx tsx admin_delete_staff.ts <id1> <id2> ...");
        process.exit(1);
    }
    await deleteStaff(targetIds);
    process.exit(0);
})();
