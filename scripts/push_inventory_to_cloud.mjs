
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, initializeFirestore, writeBatch } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env Loader
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').filter(l => !l.startsWith('#') && l.includes('=')).forEach(line => {
            const [k, v] = line.split('=');
            env[k.trim()] = v.trim();
        });
        return env;
    }
    return {};
}

const env = loadEnv();
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const userId = env.VITE_USER_ID || "englabs-enterprise";
const dataPath = path.resolve(__dirname, '../public/inventory_dump.json');

async function pushInventoryToCloud() {
    console.log("🚀 Initializing Enterprise Cloud Deployment...");
    
    if (!fs.existsSync(dataPath)) {
        console.error("❌ Source file missing: public/inventory_dump.json");
        process.exit(1);
    }

    const inventory = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`📦 Loaded ${inventory.length} items for deployment.`);

    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, env.VITE_FIREBASE_DATABASE_ID || "(default)");

    console.log(`🎯 Target: [Firestore] Database: ${env.VITE_FIREBASE_DATABASE_ID || "(default)"} | Shop: ${userId}`);

    let batch = writeBatch(db);
    let opCount = 0;
    let successCount = 0;

    for (const item of inventory) {
        const docId = item.id || item.barcode || item.sku;
        if (!docId) continue;

        const docRef = doc(db, 'shops', userId, 'inventory', docId);

        const sanitize = (val) => {
            if (val === undefined) return null;
            if (typeof val === 'number' && isNaN(val)) return 0;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                const n = {};
                for (const k in val) n[k] = sanitize(val[k]);
                return n;
            }
            return val;
        };

        const cleanedItem = sanitize(item);
        cleanedItem.updatedAt = new Date().toISOString();

        batch.set(docRef, cleanedItem, { merge: true });
        opCount++;
        successCount++;

        if (opCount >= 400) {
            process.stdout.write(`\r💾 Syncing Assets: ${successCount}...`);
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
        }
    }

    if (opCount > 0) {
        process.stdout.write(`\r💾 Finishing Sync: ${successCount}...`);
        await batch.commit();
    }

    console.log(`\n\n✅ ENTERPRISE CLOUD SYNC SUCCESSFUL!`);
    console.log(`🔗 Reflected ${successCount} items in production database.`);
    process.exit(0);
}

pushInventoryToCloud().catch(err => {
    console.error("❌ Cloud Push Failed:", err);
    process.exit(1);
});
