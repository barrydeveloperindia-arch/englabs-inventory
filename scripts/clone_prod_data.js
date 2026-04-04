
import { initializeApp } from "firebase/app";
import { collection, getDocs, setDoc, doc, getDoc, writeBatch, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load Prod Config (Source)
const prodEnvPath = path.resolve(__dirname, '../.env.production');
if (!fs.existsSync(prodEnvPath)) {
    console.error("❌ .env.production not found!");
    process.exit(1);
}

const loadEnv = (p) => {
    const content = fs.readFileSync(p, 'utf-8');
    const env = {};
    content.split('\n').forEach(line => {
        const [k, v] = line.split('=');
        if (k && v) env[k.trim()] = v.trim();
    });
    return env;
};

const prodEnv = loadEnv(prodEnvPath);
const PROD_DB_ID = prodEnv.VITE_FIREBASE_DATABASE_ID;
const SHOP_ID = prodEnv.VITE_USER_ID; // Use Prod User ID

// 2. Determine Target Env
const args = process.argv.slice(2);
const targetEnv = args[0];
if (!targetEnv || !['development', 'staging'].includes(targetEnv)) {
    console.error("❌ Usage: node scripts/clone_prod_data.js [development | staging]");
    process.exit(1);
}

const targetEnvPath = path.resolve(__dirname, `../.env.${targetEnv}`);
if (!fs.existsSync(targetEnvPath)) {
    console.error(`❌ .env.${targetEnv} not found!`);
    process.exit(1);
}

const targetConfig = loadEnv(targetEnvPath);
const TARGET_DB_ID = targetConfig.VITE_FIREBASE_DATABASE_ID;
const TARGET_SHOP_ID = targetConfig.VITE_USER_ID;

console.log(`\n🚀 CLONING PROD DATA to [ ${targetEnv.toUpperCase()} ]`);
console.log(`SOURCE DB: ${PROD_DB_ID}  (Shop: ${SHOP_ID})`);
console.log(`TARGET DB: ${TARGET_DB_ID} (Shop: ${TARGET_SHOP_ID})`);

if (PROD_DB_ID === TARGET_DB_ID) {
    console.error("❌ Safety Stop: Source and Target DB are the same!");
    process.exit(1);
}

// 3. Initialize Firebase (Two Apps)
const firebaseConfig = {
    apiKey: prodEnv.VITE_FIREBASE_API_KEY,
    authDomain: prodEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: prodEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: prodEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: prodEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: prodEnv.VITE_FIREBASE_APP_ID
};

// Source App (Prod)
const appSource = initializeApp(firebaseConfig, 'SourceApp');
const dbSrc = initializeFirestore(appSource, {
    experimentalForceLongPolling: true,
}, PROD_DB_ID);

// Target App (Dev/Staging)
const appTarget = initializeApp(firebaseConfig, 'TargetApp');
const dbTgt = initializeFirestore(appTarget, {
    experimentalForceLongPolling: true,
}, TARGET_DB_ID);

console.log(" -> Connected to Firebase Apps.");

async function cloneData() {
    try {
        console.log("\n📦 Reading PROD Data...");

        // 0. Clone Shop Metadata
        const shopRef = doc(dbSrc, 'shops', SHOP_ID);
        const shopSnap = await getDoc(shopRef);

        if (shopSnap.exists()) {
            console.log("   ✅ Synced Shop Profile");
            await setDoc(doc(dbTgt, 'shops', TARGET_SHOP_ID), {
                ...shopSnap.data(),
                environment: targetEnv // Tag it
            });
        } else {
            console.warn("⚠️ Valid Shop Profile not found in Prod!");
        }

        const collectionsToClone = ['staff', 'inventory', 'suppliers', 'rota', 'attendance'];

        for (const colName of collectionsToClone) {
            console.log(`   -> Cloning '${colName}'...`);
            const colRef = collection(dbSrc, 'shops', SHOP_ID, colName);
            const snap = await getDocs(colRef);

            if (snap.empty) {
                console.log(`      (Empty in Prod)`);
                continue;
            }

            // 1. CLEAR TARGET COLLECTION FIRST (Avoid duplicates/stale data)
            const colRefTgt = collection(dbTgt, 'shops', TARGET_SHOP_ID, colName);
            const snapTgt = await getDocs(colRefTgt);
            if (!snapTgt.empty) {
                console.log(`      ...clearing ${snapTgt.size} existing items in target...`);
                // Chunk deletes
                const deleteChunks = [];
                for (let i = 0; i < snapTgt.docs.length; i += 400) {
                    deleteChunks.push(snapTgt.docs.slice(i, i + 400));
                }
                for (const chunk of deleteChunks) {
                    const batch = writeBatch(dbTgt);
                    chunk.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
            }

            // 2. WRITE NEW DATA

            // Chunking Strategy to avoid Batch reuse errors
            const chunkSize = 400;
            const docChunks = [];
            for (let i = 0; i < snap.docs.length; i += chunkSize) {
                docChunks.push(snap.docs.slice(i, i + chunkSize));
            }

            let count = 0;
            for (const chunk of docChunks) {
                const batch = writeBatch(dbTgt); // New batch for every chunk
                for (const d of chunk) {
                    const ref = doc(dbTgt, 'shops', TARGET_SHOP_ID, colName, d.id);
                    batch.set(ref, d.data());
                    count++;
                }
                await batch.commit();
                process.stdout.write('.');
            }

            console.log(` ✅ Cloned ${count} items.`);
        }

        console.log("\n✨ CLONE COMPLETE!");
        console.log(`Test with: npm run ${targetEnv === 'development' ? 'dev' : 'preview:staging'}`);

    } catch (e) {
        console.error("\n❌ Clone Failed:", e.message);
        if (e.message.includes("NOT_FOUND") || JSON.stringify(e).includes("NOT_FOUND")) {
            console.error("\nCRITICAL: The Target Database does not exist!");
            console.error("1. Go to Firebase Console -> Firestore");
            console.error("2. Click ( + ) Create Database");
            console.error(`3. ID: ${TARGET_DB_ID}`);
            console.error("4. Location: europe-west2 (London)");
        }
    }
    process.exit(0);
}

cloneData();
