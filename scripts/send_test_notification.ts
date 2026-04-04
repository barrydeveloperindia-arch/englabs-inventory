import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";
import crypto from 'crypto';

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

async function sendTestNotification() {
    console.log("🚀 Sending Test Notification...");
    const userId = process.env.VITE_USER_ID || 'hop-in-express-';

    // Find Salil
    const staffRef = collection(db, 'shops', userId, 'staff');
    const snapshot = await getDocs(staffRef);
    const salil = snapshot.docs.map(d => ({ ...d.data(), id: d.id })).find((s: any) => s.name?.toUpperCase().includes('SALIL')) as any;

    if (!salil) {
        console.error("❌ Salil not found!");
        // Fallback: list all staff names
        console.log("Available staff:", snapshot.docs.map(d => d.data().name).join(', '));
        return;
    }

    console.log(`Found Salil: ${salil.id} (${salil.role})`);

    const notification = {
        id: crypto.randomUUID(),
        recipientId: salil.id,
        title: 'TEST NAV: Staff Update',
        message: 'Click this to test navigation to Staff View',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/staff' // THE FIX
    };

    const notifRef = doc(db, 'shops', userId, 'notifications', notification.id);
    await setDoc(notifRef, notification);

    console.log("✅ Notification Sent!");
}

sendTestNotification();
