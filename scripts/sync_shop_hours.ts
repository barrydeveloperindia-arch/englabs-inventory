
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Extracted from Google Listing (Feb 2026)
const GOOGLE_HOURS = {
    Monday: { start: '08:00', end: '21:00' },
    Tuesday: { start: '08:00', end: '21:00' },
    Wednesday: { start: '08:00', end: '21:00' },
    Thursday: { start: '08:00', end: '21:00' },
    Friday: { start: '08:00', end: '23:00' }, // 11 PM
    Saturday: { start: '08:00', end: '23:00' }, // 11 PM
    Sunday: { start: '08:00', end: '20:00' } // 8 PM
};

async function syncHours() {
    console.log("🚀 Starting Google Shop Hours Sync...");

    // In future versions, fetch from: https://maps.googleapis.com/maps/api/place/details/json?...
    // For now, using verified manual extraction.

    const userId = process.env.VITE_USER_ID || 'hop-in-express-';

    try {
        const settingsRef = doc(db, 'shops', userId, 'settings', 'general');

        await setDoc(settingsRef, {
            timings: GOOGLE_HOURS,
            lastSynced: new Date().toISOString(),
            source: 'Google Business Listing (Manual/Script)'
        }, { merge: true });

        console.log(`✅ Shop Hours Synced to Firestore for shop: ${userId}`);
        console.table(GOOGLE_HOURS);

        // Reminder for Automation
        console.log("\n--- AUTOMATION INSTRUCTIONS ---");
        console.log("To run this every Monday at 5 AM:");
        console.log("1. Use Windows Task Scheduler.");
        console.log("2. Create Basic Task -> Trigger: Weekly (Mon) @ 5AM.");
        console.log("3. Action: Start Program -> 'node' or 'npx'");
        console.log("4. Arguments: 'tsx scripts/sync_shop_hours.ts'");

    } catch (e) {
        console.error("❌ Sync Failed:", e);
    }
}

syncHours();
