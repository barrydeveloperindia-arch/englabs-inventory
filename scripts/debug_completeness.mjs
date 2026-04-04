
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
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
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const dbId = env.VITE_FIREBASE_DATABASE_ID || 'englabs1';
const db = initializeFirestore(app, { experimentalForceLongPolling: true }, dbId);
const SHOP_ID = env.VITE_USER_ID || 'hop-in-express-';

async function auditCompleteness() {
    console.log(`🚀 Auditing Inventory Completeness for ${SHOP_ID}...`);
    const invSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'inventory'));
    const items = invSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`Total Items: ${items.length}`);

    const incomplete = [];
    items.forEach(item => {
        const missing = [];
        if (!item.name) missing.push('name');
        if (!item.barcode && !item.sku) missing.push('barcode/sku');
        if (item.price === undefined || item.price === null || item.price === 0) missing.push('price');
        if (item.category === 'Unclassified' || !item.category) missing.push('category');

        if (missing.length > 0) {
            incomplete.push({ name: item.name || 'MISSING', id: item.id, missing });
        }
    });

    console.log(`Items missing critical data: ${incomplete.length}`);
    if (incomplete.length > 0) {
        console.log("Sample of incomplete items:");
        incomplete.slice(0, 5).forEach(i => console.log(` - ${i.name} (${i.id}): ${i.missing.join(', ')}`));
    } else {
        console.log("✅ All items possess critical data fields.");
    }

    // Now check if "cell is being updated in Excel"
    // Search for any file with "update" and "excel" in it
    const scriptsDir = path.resolve(__dirname, '../scripts');
    const files = fs.readdirSync(scriptsDir);
    const excelScripts = files.filter(f => f.toLowerCase().includes('excel') || f.toLowerCase().includes('xlsx'));
    console.log("\nExcel related scripts found:", excelScripts);

    process.exit(0);
}

auditCompleteness().catch(console.error);
