
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env.development');
const env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    });
}

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
    localCache: memoryLocalCache(),
}, env.VITE_FIREBASE_DATABASE_ID || "englabs-dev");

const SHOP_ID = env.VITE_USER_ID || "hop-in-express-dev-";

async function runPayrollAudit() {
    console.log(`🛡️ [Shield-Audit] Starting Payroll Security Audit...`);
    console.log(`📡 Database: ${env.VITE_FIREBASE_DATABASE_ID}`);
    console.log(`🛍️ Shop:     ${SHOP_ID}`);

    const targets = [
        { name: 'salaries', path: `shops/${SHOP_ID}/salaries` },
        { name: 'staff', path: `shops/${SHOP_ID}/staff` }
    ];

    for (const target of targets) {
        console.log(`\n🔍 Auditing ${target.name}...`);

        // 1. Try Read (Public?)
        try {
            const snap = await getDocs(collection(db, target.path));
            console.log(`   🔓 READ: SUCCESS (${snap.size} docs found)`);
            if (snap.size > 0) {
                console.log(`   ⚠️ WARNING: ${target.name} is PUBLICLY READABLE in Dev.`);
            }
        } catch (e) {
            console.log(`   🔒 READ: DENIED (Protected)`);
        }

        // 2. Try Write (Unauthorized?)
        try {
            const testDoc = doc(db, target.path, 'security-audit-test');
            await setDoc(testDoc, { audit: true, timestamp: new Date().toISOString() });
            console.log(`   🔓 WRITE: SUCCESS (Critical Security Risk if in Prod)`);
            // Cleanup
            await deleteDoc(testDoc);
        } catch (e) {
            console.log(`   🔒 WRITE: DENIED (Protected)`);
        }
    }

    console.log(`\n🛡️ [Shield-Audit] Audit Complete.`);
    process.exit();
}

runPayrollAudit();
