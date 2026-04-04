
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XHR2 from 'xhr2';

// Polyfill
global.XMLHttpRequest = XHR2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                env[key] = val;
            }
        });
        return env;
    }
    return {};
}

const env = loadEnv();

const FIREBASE_CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
}, "englabs1");

async function run() {
    try {
        console.log("Connecting to Firestore...");

        const shopsRef = collection(db, 'shops');
        const shopSnap = await getDocs(shopsRef);
        let userId = env.VITE_USER_ID;

        if (!userId) {
            if (shopSnap.empty) {
                console.error("No shops found in DB.");
                process.exit(1);
            }
            userId = shopSnap.docs[0].id;
            console.log("Auto-resolved Shop ID:", userId);
        } else {
            console.log("Using Env Shop ID:", userId);
        }

        const staffRef = collection(db, 'shops', userId, 'staff');
        const snapshot = await getDocs(staffRef);

        console.log(`Scanning ${snapshot.size} staff records...`);

        const targets = snapshot.docs.filter(d => {
            const data = d.data();
            const name = (data.name || '').toUpperCase();

            // Allow-list: Keep specific names if they look real?
            // Test Criteria:
            return name.includes('TEST') ||
                name.includes('OOOO') ||
                name.includes('SHOP OWNER') ||
                name.includes('RECRUIT') ||
                name.includes('USER') ||
                name === 'TEMP';
        });

        if (targets.length === 0) {
            console.log("No obvious test staff found.");
        } else {
            console.log(`Found ${targets.length} test records.`);
            for (const t of targets) {
                console.log(`❌ DELETING: [${t.data().role}] ${t.data().name} (ID: ${t.id})`);
                await deleteDoc(doc(db, 'shops', userId, 'staff', t.id));
                console.log("✅ DELETED.");
            }
        }

        console.log("Valid Remaining Staff:");
        const remaining = (await getDocs(staffRef)).docs;
        remaining.forEach(d => console.log(`- ${d.data().name} (${d.data().role})`));

        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

run();
