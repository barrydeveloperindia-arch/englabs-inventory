
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.development') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const DB_ID = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
const SHOP_ID = process.env.VITE_USER_ID || "hop-in-express-";

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, DB_ID);

/**
 * RESTORE ORIGINAL STAFF NAMES & PHOTOS (EXACT BASELINE)
 */
async function restoreStaff() {
    console.log(`👤 Restoring Original Baseline Staff (DB: ${DB_ID}, Shop: ${SHOP_ID})...`);

    const ORIGINAL_BASELINE_STAFF = [
        {
            id: '1',
            name: 'Bharat Anand',
            role: 'Owner',
            pin: '1111',
            photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: '4',
            name: 'Salil Anand',
            role: 'Business Coordinator',
            pin: '4444',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: '5',
            name: 'Gaurav Panchal',
            role: 'Manager',
            pin: '5555',
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: '8',
            name: 'Nayan Kumar Godhani',
            role: 'Shop Assistant',
            pin: '8888',
            photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: '9',
            name: 'Nisha',
            role: 'Shop Assistant',
            pin: '9999',
            photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: '10',
            name: 'Paras',
            role: 'Manager',
            pin: '1010',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },
        {
            id: '11',
            name: 'Parth',
            role: 'Business Coordinator',
            pin: '1212',
            photo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        }
    ];

    const staffRef = collection(db, 'shops', SHOP_ID, 'staff');
    const snapshot = await getDocs(staffRef);

    let batch = writeBatch(db);

    console.log(`🗑️ Clearing current staff records (${snapshot.size})...`);
    snapshot.forEach(d => {
        batch.delete(doc(db, 'shops', SHOP_ID, 'staff', d.id));
    });

    await batch.commit();
    batch = writeBatch(db);

    console.log("✨ Restoring Original Baseline Staff List...");
    for (const member of ORIGINAL_BASELINE_STAFF) {
        const memberRef = doc(db, 'shops', SHOP_ID, 'staff', member.id);
        const data = {
            ...member,
            status: 'Active',
            joinedDate: new Date().toISOString(),
            loginBarcode: member.id === '1' ? 'OWNER01' : (member.id === '4' ? 'OWNER02' : `STAFF${member.id}`)
        };
        batch.set(memberRef, data);
    }

    await batch.commit();
    console.log(`\n✅ RESTORATION COMPLETE. Restored ${ORIGINAL_BASELINE_STAFF.length} members with original photos.`);
    process.exit(0);
}

restoreStaff().catch(e => {
    console.error("❌ Error restoring staff:", e);
    process.exit(1);
});
