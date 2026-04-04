
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, writeBatch, initializeFirestore } from "firebase/firestore";
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') }); // Fallback

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

console.log("Initializing Firebase for cleanup...");
const app = initializeApp(firebaseConfig);

const dbId = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
console.log(`Targeting Database ID: ${dbId}`);

const db = initializeFirestore(app, {}, dbId);

async function wipeAttendance() {
    const userId = process.env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Targeting Shop: ${userId}`);
    console.log(`Wiping ALL attendance records (Test Data Cleanup)...`);

    const attendanceRef = collection(db, 'shops', userId, 'attendance');
    const snapshot = await getDocs(attendanceRef);

    if (snapshot.empty) {
        console.log("No attendance records found.");
        return;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
        count++;
    });

    await batch.commit();
    console.log(`Successfully deleted ${count} attendance records.`);
    process.exit(0);
}

wipeAttendance().catch((e) => {
    console.error(e);
    process.exit(1);
});
