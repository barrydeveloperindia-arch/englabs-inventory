
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.resolve(__dirname, '../.env.development'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, env.VITE_FIREBASE_DATABASE_ID);

async function checkDB() {
    const shopId = env.VITE_USER_ID;
    console.log("Checking Shop:", shopId);

    const staffRef = collection(db, 'shops', shopId, 'staff');
    const staffSnap = await getDocs(staffRef);
    console.log("Staff Count:", staffSnap.size);
    staffSnap.forEach(doc => console.log(" - ", doc.id, doc.data().name));

    const invRef = collection(db, 'shops', shopId, 'inventory');
    const invSnap = await getDocs(invRef);
    console.log("Inventory Count:", invSnap.size);
    invSnap.forEach(doc => console.log(" - ", doc.id, doc.data().name));

    process.exit(0);
}

checkDB();
