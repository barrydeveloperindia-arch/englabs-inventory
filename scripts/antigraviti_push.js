
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Node.js specific firebase init
import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Load user config
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

const app = initializeApp(FIREBASE_CONFIG);
// Explicitly initialize with Database ID from env to avoid NOT_FOUND errors
const dbInstance = initializeFirestore(app, {}, env.VITE_FIREBASE_DATABASE_ID || "englabs1");

const USER_ID = env.VITE_USER_ID;

// CLI Args Parsing
const args = process.argv.slice(2);
const nameArg = args.indexOf('--name') > -1 ? args[args.indexOf('--name') + 1] : 'Antigraviti Item';
const skuArg = args.indexOf('--sku') > -1 ? args[args.indexOf('--sku') + 1] : `AG-${Date.now()}`;
const qtyArg = args.indexOf('--qty') > -1 ? parseInt(args[args.indexOf('--qty') + 1]) : 1;

async function pushItem() {
    console.log(`🚀 Antigraviti Push: Inventory`);
    console.log(`--------------------------------`);
    console.log(`📦 Item: ${nameArg}`);
    console.log(`🔖 SKU:  ${skuArg}`);
    console.log(`🔢 Qty:  ${qtyArg}`);

    if (!USER_ID) {
        console.error("❌ Error: VITE_USER_ID not found in .env.local");
        process.exit(1);
    }

    try {
        const inventoryRef = collection(dbInstance, 'shops', USER_ID, 'inventory');

        // Check if exists
        const q = query(inventoryRef, where("sku", "==", skuArg));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            console.log(`⚠️ Item with SKU ${skuArg} already exists. Updating stock...`);
            const docRef = snapshot.docs[0].ref;
            const currentStock = snapshot.docs[0].data().stock || 0;
            await setDoc(docRef, {
                stock: currentStock + qtyArg,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            console.log(`✅ Updated Stock: ${currentStock} -> ${currentStock + qtyArg}`);
        } else {
            const newItem = {
                id: crypto.randomUUID(),
                sku: skuArg,
                name: nameArg,
                brand: 'ANTIGRAVITI',
                category: 'Unclassified',
                stock: qtyArg,
                price: 0.00,
                costPrice: 0.00,
                vatRate: 20,
                status: 'Active',
                createdAt: new Date().toISOString(),
                origin: 'CLI Push'
            };

            // Use specific ID if generated, or let firestore gen if we used addDoc. 
            // We generated a UUID, so let's use it as doc ID for consistency.
            await setDoc(doc(inventoryRef, newItem.id), newItem);
            console.log(`✅ Created New Item: ${newItem.id}`);
        }

    } catch (error) {
        console.error("❌ Push Failed:", error);
    }
    process.exit(0);
}

pushItem();
