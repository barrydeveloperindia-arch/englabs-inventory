
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore } from "firebase/firestore";
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
console.log(`Targeting Database ID: ${dbId}`);
const db = initializeFirestore(app, {}, dbId);

const DOMAIN = 'englabs.com';

function generateEmail(name: string, role: string): string {
    const n = name.toLowerCase();
    const r = role.toLowerCase().replace(/\s+/g, ''); // assistant, manager, businesscoordinator

    if (n.includes('bharat')) return `owner@${DOMAIN}`;
    if (n.includes('salil')) return `director@${DOMAIN}`;
    if (n.includes('parth')) return `operations@${DOMAIN}`;

    if (n.includes('paras')) return `manager@${DOMAIN}`;
    if (n.includes('gaurav')) return `manager.gaurav@${DOMAIN}`;

    if (n.includes('nayan')) return `assistant.nayan@${DOMAIN}`;
    if (n.includes('nisha')) return `assistant.nisha@${DOMAIN}`;

    if (n.includes('harsh')) return `inventory.harsh@${DOMAIN}`;
    if (n.includes('smit')) return `inventory.smit@${DOMAIN}`;

    // Fallback for unknown staff
    const firstName = n.split(' ')[0];
    return `${r}.${firstName}@${DOMAIN}`;
}

async function updateEmails() {
    const userId = process.env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Targeting Shop: ${userId}`);

    const staffRef = collection(db, 'shops', userId, 'staff');
    const snapshot = await getDocs(staffRef);

    if (snapshot.empty) {
        console.log("No staff records found.");
        return;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((d) => {
        const data = d.data();
        const name = data.name || 'Unknown';
        const role = data.role || 'Staff';

        const newEmail = generateEmail(name, role);

        console.log(`Updating ${name} (${role}) -> ${newEmail}`);
        batch.update(d.ref, { email: newEmail });
        count++;
    });

    await batch.commit();
    console.log(`Successfully updated ${count} staff emails.`);
    process.exit(0);
}

updateEmails().catch((e) => {
    console.error(e);
    process.exit(1);
});
