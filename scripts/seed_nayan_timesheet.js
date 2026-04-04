
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

console.log(`\n🌱 SEEDING NAYAN TIMESHEET: [ ${targetEnv.toUpperCase()} ]`);
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

const DB_ID = env.VITE_FIREBASE_DATABASE_ID;
const SHOP_ID = env.VITE_USER_ID;

if (!DB_ID || !SHOP_ID) {
    console.error("❌ Missing DB_ID or USER_ID in config.");
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
async function seedNayan() {
    try {
        console.log("\n--- STARTING NAYAN SEED ---");

        // A. Ensure Nayan Exists as Staff
        const nayanId = "8";
        const staffRef = doc(db, 'shops', SHOP_ID, 'staff', nayanId);
        const staffSnap = await getDoc(staffRef);

        if (!staffSnap.exists()) {
            console.log("👤 Creating Nayan (ID: 8)...");
            await setDoc(staffRef, {
                id: "8",
                name: "Nayan Kumar Godhani",
                role: "Shop Assistant",
                pin: "8888",
                email: "nayan@example.com",
                joinedDate: "2025-02-01",
                status: "Active",
                photo: "https://example.com/nayan.jpg"
            });
        } else {
            console.log("✓ Nayan User exists.");
        }

        // B. Add Timesheet Data (Attendance)
        // Dates: Feb 10, 11, 12, 2026.
        const records = [
            { date: '2026-02-10', day: 'Tuesday', start: '09:00', end: '15:00', hours: 6.0 },
            { date: '2026-02-11', day: 'Wednesday', start: '09:00', end: '15:00', hours: 6.0 },
            { date: '2026-02-12', day: 'Thursday', start: '09:00', end: '15:00', hours: 6.0 }
        ];

        for (const r of records) {
            const docId = `att-nayan-${r.date}`;
            const attRef = doc(db, 'shops', SHOP_ID, 'attendance', docId);

            console.log(`📅 Adding Record: ${r.date} (${r.day}) | ${r.start} - ${r.end}`);
            await setDoc(attRef, {
                id: docId,
                staffId: "8",
                date: r.date,
                clockIn: r.start,
                clockOut: r.end,
                hoursWorked: r.hours,
                status: "Present", // Completed
                breaks: [],
                notes: "Seeded via Script"
            });
        }

        console.log("\n✅ NAYAN TIMESHEET SEEDED!");

    } catch (e) {
        console.error("\n❌ SEED FAILED:", e.message);
    }
    process.exit(0);
}

seedNayan();
