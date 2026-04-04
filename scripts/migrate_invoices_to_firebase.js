
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, initializeFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Jimp } from 'jimp'; // v1.x syntax or use default
import XHR2 from 'xhr2';

// Polyfill
global.XMLHttpRequest = XHR2;
// global.File and global.Blob might be needed for Firebase Storage SDK in Node environment
// if standard uploadBytes is used with Buffers, it should be fine.

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

import { getAuth, signInAnonymously } from "firebase/auth";

console.log("Initializing Firebase...");
const firebaseApp = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(firebaseApp);

// Match the server.js db instance settings to be safe
const db = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
}, "englabs1");

const storage = getStorage(firebaseApp);

async function optimizeImage(filePath) {
    try {
        const image = await Jimp.read(filePath);
        // Resize if too large
        if (image.bitmap.width > 1024 || image.bitmap.height > 1024) {
            image.scaleToFit({ w: 1024, h: 1024 });
        }
        // Quality
        image.quality(70);

        return await image.getBuffer('image/jpeg');
    } catch (e) {
        console.error("Jimp optimization failed, falling back to raw buffer:", e.message);
        return fs.readFileSync(filePath);
    }
}

async function migrate() {
    try {
        console.log("Signing in...");
        await signInAnonymously(auth);
        console.log("Signed in anonymously.");
    } catch (e) {
        console.error("Auth failed:", e.message);
        // Continue anyway? rules might be public
    }

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
    }

    for (const entry of successEntries) {
        if (!entry.extracted || !entry.extracted.inv_num) {
            console.log("Skipping entry with missing invoice number:", entry.fileName);
            continue;
        }

        const invNum = entry.extracted.inv_num;
        if (invNum !== '290403') continue; // Debug: Force single invoice

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

        // Check if ALREADY uploaded to Storage (contains 'firebasestorage')
        if (purchaseData.receiptData && purchaseData.receiptData.includes('firebasestorage')) {
            console.log(`  -> Already on Firebase Storage. Skipping.`);
            continue;
        }

        // Process File
        try {
            const ext = path.extname(srcPath).toLowerCase();
            let fileBuffer;
            let mimeType = 'application/octet-stream';

            if (ext === '.pdf') {
                fileBuffer = fs.readFileSync(srcPath);
                mimeType = 'application/pdf';
            } else if (['.jpg', '.jpeg', '.png', '.bmp'].includes(ext)) {
                // Optimize locally with Jimp
                console.log("  -> Optimizing image...");
                fileBuffer = await optimizeImage(srcPath);
                mimeType = 'image/jpeg';
            } else {
                fileBuffer = fs.readFileSync(srcPath);
            }

            // Upload to Firebase Storage
            const storagePath = `receipts/${targetId}/MIGRATED_${invNum}_${Date.now()}${ext === '.pdf' ? '.pdf' : '.jpg'}`;
            const storageRef = ref(storage, storagePath);

            console.log(`  -> Uploading to ${storagePath}...`);
            const snapshot = await uploadBytes(storageRef, fileBuffer, { contentType: mimeType });
            const downloadUrl = await getDownloadURL(snapshot.ref);

            console.log(`  -> Uploaded! URL: ${downloadUrl}`);

            // Update Doc
            await updateDoc(doc(db, 'shops', targetId, 'purchases', purchaseDoc.id), {
                receiptData: downloadUrl
            });

            console.log(`  -> Purchase updated.`);
        } catch (err) {
            console.error(`  -> Error processing file:`, err);
        }
    }

    console.log("Migration Complete.");
    process.exit(0);
}

migrate();
