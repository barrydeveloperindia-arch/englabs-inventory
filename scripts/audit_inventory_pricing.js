
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xhr2 from "xhr2";

global.XMLHttpRequest = xhr2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                env[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
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

const app = initializeApp(firebaseConfig);
const dbId = env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
const db = getFirestore(app, dbId);

async function checkInventoryPricing() {
    const userId = env.VITE_USER_ID; // "hop-in-express-"
    if (!userId) {
        console.error("No User ID found.");
        return;
    }

    console.log(`Checking inventory for User: ${userId}...`);
    const inventoryRef = collection(db, 'shops', userId, 'inventory');
    const snapshot = await getDocs(inventoryRef);

    if (snapshot.empty) {
        console.log("No inventory items found.");
        return;
    }

    let total = 0;
    let missingCost = 0;
    let missingPrice = 0;
    let zeroCost = 0;
    let zeroPrice = 0;

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        total++;

        // Check Cost Price
        if (data.costPrice === undefined || data.costPrice === null) {
            missingCost++;
            // console.log(`[Missing Cost] ${data.name} (${data.barcode})`);
        } else if (Number(data.costPrice) === 0) {
            zeroCost++;
            if (zeroCost <= 5) console.log(`[Zero Cost] ${data.name} (${data.barcode})`);
        }

        // Check Sales Price
        if (data.price === undefined || data.price === null) {
            missingPrice++;
            console.log(`[Missing Price] ${data.name} (${data.barcode})`);
        } else if (Number(data.price) === 0) {
            zeroPrice++;
            if (zeroPrice <= 5) console.log(`[Zero Price] ${data.name} (${data.barcode})`);
        }
    });

    console.log("\n--- Inventory Pricing Audit ---");
    console.log(`Total Items Scanned: ${total}`);
    console.log(`Items with Missing Cost Price (undefined/null): ${missingCost}`);
    console.log(`Items with Zero Cost Price (0.00): ${zeroCost}`);
    console.log(`Items with Missing Sales Price (undefined/null): ${missingPrice}`);
    console.log(`Items with Zero Sales Price (0.00): ${zeroPrice}`);

    const validCostPct = ((total - (missingCost + zeroCost)) / total) * 100;
    console.log(`\nValid Cost Price Coverage: ${validCostPct.toFixed(1)}%`);

    process.exit(0);
}

checkInventoryPricing().catch(console.error);
