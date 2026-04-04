
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Determine Environment
const args = process.argv.slice(2);
const targetEnv = args[0] || 'development'; // Default to dev

const envFileMap = {
    'development': '.env.development',
    'staging': '.env.staging',
    'production': '.env.production'
};

const filename = envFileMap[targetEnv];
if (!filename) {
    console.error(`❌ Unknown environment '${targetEnv}'. Use: development, staging, or production.`);
    process.exit(1);
}

console.log(`\n🌱 SEEDING TARGET: [ ${targetEnv.toUpperCase()} ]`);
console.log(`📂 Configuration: ${filename}`);

// 2. Load Config
const envPath = path.resolve(__dirname, `../${filename}`);
if (!fs.existsSync(envPath)) {
    console.error(`❌ Config file not found: ${envPath}`);
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) env[k.trim()] = v.trim();
});

const DB_ID = env.VITE_FIREBASE_DATABASE_ID || '(default)';
const SHOP_ID = env.VITE_USER_ID;

if (!SHOP_ID) {
    console.error("❌ Missing USER_ID in config.");
    process.exit(1);
}

console.log(`🎯 Database ID: ${DB_ID}`);
console.log(`🏪 Shop ID:     ${SHOP_ID}`);

// 3. Initialize Firebase
const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, DB_ID);

// 4. Seeder Logic
async function seedByEnv() {
    try {
        console.log("\n--- STARTING SEED ---");

        // A. Setup Shop Basics
        const shopRef = doc(db, 'shops', SHOP_ID);
        await setDoc(shopRef, {
            name: `ENGLABS Inventory (${targetEnv})`,
            owner: "Salil Anand",
            address: "1021-1022, Disha Arcade, MDC Sec-4, Panchkula, Haryana 134114",
            contact: "098764-57934",
            currency: "INR",
            taxRate: 18,
            createdAt: new Date().toISOString(),
            environment: targetEnv
        }, { merge: true });
        console.log("✓ Shop Profile synced.");

        // B. Add Original Baseline Staff Members
        console.log("👤 Syncing Original Baseline Staff Members...");
        const ORIGINAL_BASELINE_STAFF = [
            { id: '1', name: 'Bharat Anand', role: 'Owner', pin: '1111', email: 'bharat@englabscivil.com', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
            { id: '4', name: 'Salil Anand', role: 'Business Coordinator', pin: '4444', email: 'salil@englabscivil.com', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
            { id: '5', name: 'Gaurav Panchal', role: 'Manager', pin: '5555', email: 'gaurav@englabscivil.com', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
            { id: '8', name: 'Nayan Kumar Godhani', role: 'Staff', pin: '8888', email: 'nayan@englabscivil.com', photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
            { id: '9', name: 'Nisha', role: 'Staff', pin: '9999', email: 'nisha@englabscivil.com', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
            { id: '10', name: 'Paras', role: 'Manager', pin: '1010', email: 'paras@englabscivil.com', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' },
            { id: '11', name: 'Parth', role: 'Business Coordinator', pin: '1212', email: 'parth@englabscivil.com', photo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80' }
        ];

        for (const member of ORIGINAL_BASELINE_STAFF) {
            const memberRef = doc(db, 'shops', SHOP_ID, 'staff', member.id);
            const memberSnap = await getDoc(memberRef);

            if (!memberSnap.exists() || memberSnap.data().name !== member.name || memberSnap.data().photo !== member.photo || memberSnap.data().email !== member.email) {
                console.log(`👤 Syncing: ${member.name}...`);
                await setDoc(memberRef, {
                    ...member,
                    status: 'Active',
                    joinedDate: new Date().toISOString(),
                    environment: targetEnv,
                    loginBarcode: member.id === '1' ? 'OWNER01' : (member.id === '4' ? 'OWNER02' : `STAFF${member.id}`)
                });
            }
        }

        // C. Add Sample Product
        const testItemRef = doc(db, 'shops', SHOP_ID, 'inventory', 'seed-test-item');
        console.log("📦 Syncing Sample Inventory Item...");
        await setDoc(testItemRef, {
            name: "Test Product (Seed)",
            price: 1.99,
            category: "Test",
            stock: 100,
            barcode: "00000000",
            status: "LIVE",
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log("\n✅ SEED COMPLETE!");

    } catch (e) {
        console.error("\n❌ SEED FAILED:", e.message);
        console.error(e.stack);
    }
    process.exit(0);
}

seedByEnv();
