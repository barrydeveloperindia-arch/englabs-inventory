
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, initializeFirestore, query, where } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';
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

const FIREBASE_CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

async function main() {
    console.log("🚀 Starting Staff ID Migration...");

    const app = initializeApp(FIREBASE_CONFIG);
    const dbId = env.VITE_FIREBASE_DATABASE_ID || '(default)';
    const db = initializeFirestore(app, { experimentalForceLongPolling: true }, dbId);
    const userId = env.VITE_USER_ID || 'hop-in-express-';

    console.log(`Target Shop: ${userId}`);

    // Mappings: Old ID -> New ID
    const MIGRATIONS = {
        'salil': 'salilanand',
        'nayan': 'narayan'
    };

    const batch = writeBatch(db);
    let opCount = 0;

    for (const [oldId, newId] of Object.entries(MIGRATIONS)) {
        console.log(`\nProcessing: ${oldId} -> ${newId}`);

        // 1. Move Attendance
        const attRef = collection(db, 'shops', userId, 'attendance');
        const q = query(attRef, where('staffId', '==', oldId));
        const snapshot = await getDocs(q);

        console.log(`   Found ${snapshot.size} attendance records to move.`);

        snapshot.forEach(d => {
            const data = d.data();
            const newDocId = `${newId}_${data.date}`; // Re-key ID

            // Create New
            const newRef = doc(db, 'shops', userId, 'attendance', newDocId);
            batch.set(newRef, {
                ...data,
                id: newDocId,
                staffId: newId,
                migratedFrom: oldId
            });

            // Delete Old
            const oldRef = doc(db, 'shops', userId, 'attendance', d.id);
            batch.delete(oldRef);
            opCount += 2;
        });

        // 2. Delete Old Staff Profile
        // (We assume New Profile already exists from CSV import)
        const oldStaffRef = doc(db, 'shops', userId, 'staff', oldId);
        batch.delete(oldStaffRef);
        console.log(`   Scheduled deletion of staff profile: ${oldId}`);
        opCount++;
    }

    if (opCount > 0) {
        await batch.commit();
        console.log(`\n✅ Migration Committed! ${opCount} operations performed.`);
    } else {
        console.log("\n⚠️ No operations needed.");
    }

    process.exit(0);
}

main().catch(console.error);
