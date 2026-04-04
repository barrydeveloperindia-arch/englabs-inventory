
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, query, where, limit } from "firebase/firestore";
import XHR2 from 'xhr2';

// Polyfill
global.XMLHttpRequest = XHR2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Load Env
function loadEnv() {
    const envPath = path.resolve(ROOT_DIR, '.env.local');
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

console.log("Initializing Firebase...");
const firebaseApp = initializeApp(FIREBASE_CONFIG);
const db = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
}, "englabs1");

async function verify() {
    const userId = env.VITE_USER_ID;
    let targetId = userId;

    if (!targetId) {
        const shopsRef = collection(db, 'shops');
        const shopSnap = await getDocs(shopsRef);
        targetId = shopSnap.docs[0].id;
    }

    console.log(`Checking purchases for Shop: ${targetId}`);

    const purchasesRef = collection(db, 'shops', targetId, 'purchases');
    // Check specific known migrated invoice
    const q = query(purchasesRef, where("invoiceNumber", "==", "290403"));
    const snapshot = await getDocs(q);

    let hasReceipts = 0;
    let validUrls = 0;

    console.log(`Found ${snapshot.size} recent purchases.`);

    for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log("Full Data:", JSON.stringify(data, null, 2));
        if (data.receiptData) {
            hasReceipts++;
            console.log(`[Entry ${doc.id}] Found receiptData: ${data.receiptData.substring(0, 50)}...`);

            if (data.receiptData.startsWith('http')) {
                try {
                    const res = await fetch(data.receiptData);
                    if (res.ok) {
                        const type = res.headers.get('content-type');
                        console.log(`   -> Link is valid! Content-Type: ${type} Size: ${res.headers.get('content-length')}`);
                        validUrls++;
                    } else {
                        console.error(`   -> Link check failed: ${res.status} ${res.statusText}`);
                    }
                } catch (e) {
                    console.error(`   -> Network error checking link:`, e.message);
                }
            } else {
                console.log(`   -> Data is Base64 (Legacy/Local).`);
            }
        }
    }

    console.log(`\nVerification Summary:`);
    console.log(`- Total Checked: ${snapshot.size}`);
    console.log(`- With Receipts: ${hasReceipts}`);
    console.log(`- Verified Accessible URLs: ${validUrls}`);

    if (validUrls > 0) {
        console.log("\nSUCCESS: Production data contains accessible receipt images.");
    } else {
        console.log("\nWARNING: No accessible receipt URLs found in the checked batch.");
    }

    process.exit(0);
}

verify();
