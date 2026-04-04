
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, initializeFirestore } from "firebase/firestore";
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
// Match the server.js db instance settings to be safe
const db = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
}, "englabs1");

async function migrate() {
    const reportPath = path.resolve(ROOT_DIR, 'invoice_ingestion_report.json');
    if (!fs.existsSync(reportPath)) {
        console.error("Report file not found:", reportPath);
        process.exit(1);
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    const successEntries = reportData.filter(e => e.status === 'Success');

    console.log(`Found ${successEntries.length} successful entries in report.`);

    // Get Shop ID
    const userId = env.VITE_USER_ID;
    let targetId = userId;

    if (!targetId) {
        console.log("No VITE_USER_ID in env, attempting to discover...");
        const shopsRef = collection(db, 'shops');
        const shopSnap = await getDocs(shopsRef);
        if (shopSnap.empty) {
            console.error("No shops found in DB.");
            process.exit(1);
        }
        targetId = shopSnap.docs[0].id;
        console.log("Discovered Shop ID:", targetId);
    } // Assuming there is at least one shop

    // Ensure uploads dir exists
    const uploadDir = path.resolve(ROOT_DIR, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }

    for (const entry of successEntries) {
        if (!entry.extracted || !entry.extracted.inv_num) {
            console.log("Skipping entry with missing invoice number:", entry.fileName);
            continue;
        }

        const invNum = entry.extracted.inv_num;
        const srcPath = entry.filePath;

        // Check source file
        if (!fs.existsSync(srcPath)) {
            console.warn(`Source file missing: ${srcPath} (Invoice: ${invNum})`);
            continue;
        }

        console.log(`Processing Invoice ${invNum}...`);

        // Find Purchase
        const purchasesRef = collection(db, 'shops', targetId, 'purchases');
        const q = query(purchasesRef, where("invoiceNumber", "==", invNum));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log(`  -> Purchase record not found for invoice ${invNum}. Skipping.`);
            continue;
        }

        const purchaseDoc = querySnapshot.docs[0];
        const purchaseData = purchaseDoc.data();

        if (purchaseData.receiptData) {
            console.log(`  -> Purchase already has receipt data. Skipping.`);
            continue;
        }

        // Copy File
        try {
            const ext = path.extname(srcPath);
            const safeName = `MATCHED_${invNum}_${Date.now()}${ext}`;
            const destPath = path.join(uploadDir, safeName);

            fs.copyFileSync(srcPath, destPath);

            // Construct URL
            // Using 127.0.0.1 to match server.js logic, assuming port 3001
            const fileUrl = `http://127.0.0.1:3001/uploads/${safeName}`;

            // Update Doc
            await updateDoc(doc(db, 'shops', targetId, 'purchases', purchaseDoc.id), {
                receiptData: fileUrl
            });

            console.log(`  -> Success! Linked to purchase ${purchaseDoc.id}`);
        } catch (err) {
            console.error(`  -> Error processing file:`, err);
        }
    }

    console.log("Migration Complete.");
    process.exit(0);
}

migrate();
