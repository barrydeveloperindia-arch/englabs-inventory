
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env.local manually
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

const USER_ID = env.VITE_USER_ID;

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

async function main() {
    console.log("🚀 Starting Batch Currency Conversion (INR -> GBP)...");

    let targetUserId = USER_ID;

    if (!targetUserId) {
        console.log("⚠️ VITE_USER_ID is missing. Attempting auto-discovery...");
        try {
            const shopsRef = collection(db, 'shops');
            const snapshot = await getDocs(shopsRef);
            if (!snapshot.empty) {
                targetUserId = snapshot.docs[0].id;
                console.log(`✅ Auto-discovered User ID: ${targetUserId}`);
            } else {
                console.error("❌ No shops found in database. Cannot auto-detect User ID.");
                console.error("Please register in the app first.");
                process.exit(1);
            }
        } catch (err) {
            console.error("❌ Auto-discovery failed:", err.message);
            process.exit(1);
        }
    }

    await runConversion(db, targetUserId);
}

async function runConversion(db, userId) {
    console.log(`☁️ Fetching inventory for User: ${userId}`);
    const inventoryRef = collection(db, 'shops', userId, 'inventory');
    const snapshot = await getDocs(inventoryRef);

    if (snapshot.empty) {
        console.log("⚠️ No inventory items found to convert.");
        process.exit(0);
    }

    console.log(`🔍 Found ${snapshot.size} items. Proceeding with conversion...`);

    const batchSize = 500;
    let batch = writeBatch(db);
    let opCount = 0;
    let updatedCount = 0;

    for (const docSnap of snapshot.docs) {
        const item = docSnap.data();

        // Conversion Logic: Price / 105, rounded to 2 decimals
        // Only convert if it looks like it hasn't been converted (optional safety check?)
        // For now, we trust the user's explicit command.

        const oldPrice = item.price || 0;
        const newPrice = Number((oldPrice / 105).toFixed(2));

        const oldCost = item.costPrice || 0;
        const newCost = Number((oldCost / 105).toFixed(2));

        const updates = {
            currency: 'GBP',
            price: newPrice,
            costPrice: newCost,
            // Add a flag or note?
            updatedAt: new Date().toISOString()
        };

        batch.update(docSnap.ref, updates);
        updatedCount++;
        opCount++;

        if (opCount >= batchSize) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
            process.stdout.write('.');
        }
    }

    if (opCount > 0) {
        await batch.commit();
    }

    console.log(`\n✅ Conversion Complete!`);
    console.log(`🔄 Updated ${updatedCount} items.`);
    console.log(`💱 Currency set to GBP. Prices divided by 105.`);
    process.exit(0);
}

main().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});
