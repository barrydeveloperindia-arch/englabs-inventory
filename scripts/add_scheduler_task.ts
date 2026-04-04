
import { initializeApp } from "firebase/app";
import { getFirestore, doc, collection, addDoc } from "firebase/firestore";
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

async function addTask() {
    const userId = process.env.VITE_USER_ID || 'hop-in-express-';
    const today = new Date().toISOString().split('T')[0];

    try {
        const tasksRef = collection(db, 'shops', userId, 'tasks');

        await addDoc(tasksRef, {
            id: crypto.randomUUID(),
            title: "Setup Windows Task Scheduler",
            description: "Configure Windows Task Scheduler to automatically run 'npx tsx scripts/sync_shop_hours.ts' every Monday at 5:00 AM.",
            assignedTo: '', // Unassigned / General Task
            status: 'Pending',
            priority: 'High',
            date: today,
            createdAt: new Date().toISOString()
        });

        console.log("✅ Added 'Setup Windows Task Scheduler' to App Tasks.");
    } catch (e) {
        console.error("❌ Failed:", e);
    }
}

addTask();
