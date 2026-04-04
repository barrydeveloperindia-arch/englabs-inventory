
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Determine Environment
const args = process.argv.slice(2);
const targetEnv = args[0] || 'development';

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

console.log(`\n🌱 SEEDING NAYAN AVAILABILITY: [ ${targetEnv.toUpperCase()} ]`);
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
async function seedNayanAvailability() {
    try {
        console.log("\n--- STARTING AVAILABILITY SEED ---");

        // Target: Week of Feb 9th 2026 (Monday)
        // Note: The UI screenshot shows "Week of 2/2/2026" as "Current".
        // If the user wants to see Feb 10-12 data, they should see it in the relevant week.
        // However, if the App is hardcoded to Feb 2, we should seed Feb 2 week as well just in case,
        // OR fix the app to show Feb 9.
        // Given I will fix the App to show "Current Week" (Feb 9), I should seed Feb 9.
        // BUT, if the user navigates back to Feb 2, they might expect to see it there?
        // Wait, Feb 10, 11, 12 are in Week of Feb 9.
        // So I will seed Week of Feb 9.

        const weekStart = "2026-02-09"; // Monday
        const staffId = "8"; // Nayan

        const docId = `pref-${staffId}-${weekStart}`;
        const prefRef = doc(db, 'shops', SHOP_ID, 'rota_preferences', docId);

        console.log(`📅 Setting Availability for Week: ${weekStart}`);

        // Define Availability
        // Mon (9): X (Unavailable based on screenshot pattern)
        // Tue (10): 09:00 - 15:00
        // Wed (11): 09:00 - 15:00
        // Thu (12): 09:00 - 15:00
        // Fri (13): X
        // Sat (14): X
        // Sun (15): X

        const availability = {
            Monday: { status: 'unavailable', start: '', end: '' },
            Tuesday: { status: 'specific', start: '09:00', end: '15:00' },
            Wednesday: { status: 'specific', start: '09:00', end: '15:00' },
            Thursday: { status: 'specific', start: '09:00', end: '15:00' },
            Friday: { status: 'unavailable', start: '', end: '' },
            Saturday: { status: 'unavailable', start: '', end: '' },
            Sunday: { status: 'unavailable', start: '', end: '' }
        };

        await setDoc(prefRef, {
            id: docId,
            staffId: staffId,
            weekStart: weekStart,
            targetBoardHours: 18, // 6 * 3
            availability: availability
        });

        console.log("✅ Availability Script Updated!");

        // ALSO Seed Week of Feb 2 (Last Week) just in case the UI is verifying that week
        // Feb 2 is Mon. 
        // Tue Feb 3...
        // The user screenshot showed Feb 2 week.
        // If the user mistakenly thinks Feb 10 is in Feb 2 week (unlikely), or if the UI is just stuck on Feb 2.
        // I will seed Feb 2 week with EMPTY or UNAVAILABLE to be safe, or just leave it.
        // Actually, the screenshot showed Partial for Tue/Wed/Thu in Feb 2 week. 
        // This implies somehow data for Feb 10 might be showing up there? Or just coincidence?
        // I'll focus on Feb 9 week as that is FACTUALLY correct for Feb 10 dates.

    } catch (e) {
        console.error("\n❌ SEED FAILED:", e.message);
    }
    process.exit(0);
}

seedNayanAvailability();
