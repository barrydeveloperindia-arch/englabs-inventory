import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Env for Firebase Config
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

// --- CONFIG ---
const WEEK_START = '2026-02-02';
const HARDCODED_SHOP_ID = 'user_2s6hReiX3d4P0o9v2b5n8M7k1L'; // From setup script
const ENV_SHOP_ID = env.VITE_USER_ID;

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "englabs1");

async function getShopId() {
    if (ENV_SHOP_ID) return ENV_SHOP_ID;

    // Auto-discover
    const shopsRef = collection(db, 'shops');
    const shopSnap = await getDocs(shopsRef);
    if (!shopSnap.empty) {
        return shopSnap.docs[0].id;
    }
    return HARDCODED_SHOP_ID;
}

// --- TYPES ---
const ROLES = {
    TILL: ['Cashier', 'Till Manager', 'Manager', 'Owner', 'Founder', 'Stock Controller', 'Director', 'Store In-charge', 'Store Management', 'Assistant'],
    INVENTORY: ['Inventory Staff', 'Stock Staff', 'Manager', 'Owner', 'Founder', 'Stock Controller', 'Director', 'Store In-charge', 'Store Management', 'Assistant']
};

const SHIFTS = [
    { name: 'Morning', start: '08:00', end: '15:00', hours: 7 },
    { name: 'Evening', start: '15:00', end: '22:00', hours: 7 }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// --- HELPERS ---

function getDatesForWeek(weekStart) {
    const dates = {};
    const start = new Date(weekStart);
    DAYS.forEach((day, index) => {
        const d = new Date(start);
        d.setDate(start.getDate() + index);
        dates[day] = d.toISOString().split('T')[0];
    });
    return dates;
}

// --- MAIN LOGIC ---

async function autoPlanRota() {
    console.log(`Starting Auto-Plan for Week: ${WEEK_START}`);

    // 0. Resolve Shop ID
    const SHOP_ID = await getShopId();
    console.log("Resolved Shop ID:", SHOP_ID);

    // 1. Fetch Staff
    console.log("Fetching Staff using shop ID:", SHOP_ID);
    const staffRef = collection(db, 'shops', SHOP_ID, 'staff');
    const staffSnap = await getDocs(staffRef);

    if (staffSnap.empty) {
        console.error("No staff found! Check Shop ID or Database Permissions.");
        return;
    }

    const staff = staffSnap.docs.map(d => ({ ...d.data(), id: d.id }));
    console.log(`Found ${staff.length} staff members.`);
    staff.forEach(s => console.log(` - ${s.name} (${s.role})`));

    // 2. Fetch Preferences
    console.log("Fetching Preferences...");
    const prefSnap = await getDocs(collection(db, 'shops', SHOP_ID, 'rota_preferences'));
    const prefs = prefSnap.docs
        .map(d => d.data())
        .filter(p => p.weekStart === WEEK_START);

    // Map prefs by Staff ID
    const prefsMap = {};
    prefs.forEach(p => prefsMap[p.staffId] = p);

    // 3. Initialize Tracking
    const assignments = []; // The final shifts
    const staffLoad = {};   // Track hours/shifts per staff
    staff.forEach(s => {
        staffLoad[s.id] = {
            shifts: 0,
            hours: 0,
            days: new Set() // Days already working
        };
    });

    const dates = getDatesForWeek(WEEK_START);

    // 4. Algorithm
    // Iterate Days -> Shifts -> Roles
    for (const day of DAYS) {
        const date = dates[day];
        console.log(`Planning ${day} (${date})...`);

        for (const shift of SHIFTS) {
            // Requirements: 1 Till, 1 Inventory
            const requirements = [
                { roleType: 'TILL', label: 'Till' },
                { roleType: 'INVENTORY', label: 'Inventory' }
            ];

            for (const req of requirements) {
                // Find Candidate
                let candidate = null;

                // Shuffle staff to randomize assignment slightly? Or sort by least loaded?
                // Sort by least loaded to balance
                const sortedStaff = [...staff].sort((a, b) => staffLoad[a.id].hours - staffLoad[b.id].hours);

                for (const s of sortedStaff) {
                    // Check Role
                    // Normalized comparison
                    const staffRole = s.role;
                    const allowedRoles = ROLES[req.roleType];

                    const isAllowed = allowedRoles.some(r => r.toLowerCase() === staffRole.toLowerCase()) ||
                        (staffRole.includes('Manager') && req.roleType === 'TILL') ||
                        (staffRole.includes('Owner') || staffRole.includes('Founder'));

                    if (!isAllowed) continue;

                    // Check if already working TODAY
                    if (staffLoad[s.id].days.has(day)) continue;

                    // Check Weekly Limit (e.g., 40h)
                    if (staffLoad[s.id].hours + shift.hours > 50) continue;

                    // Check Availability Preference
                    const pref = prefsMap[s.id];
                    let isAvailable = true; // Default available if no pref? Or strict? 
                    // Let's assume available unless marked unavailable
                    if (pref && pref.availability && pref.availability[day]) {
                        if (pref.availability[day].status === 'unavailable') isAvailable = false;
                        // Handle specific times logic here if needed... simplified for now
                    }

                    if (isAvailable) {
                        candidate = s;
                        break;
                    }
                }

                if (candidate) {
                    // Assign
                    const shiftId = randomUUID();
                    assignments.push({
                        id: shiftId,
                        staff_id: candidate.id,
                        staff_name: candidate.name,
                        week_start: WEEK_START,
                        day: day,
                        date: date,
                        start_time: shift.start,
                        end_time: shift.end,
                        total_hours: shift.hours,
                        status: 'approved', // Auto-approve
                        role_task: req.label // Custom field to tracking
                    });

                    // Update Load
                    staffLoad[candidate.id].shifts++;
                    staffLoad[candidate.id].hours += shift.hours;
                    staffLoad[candidate.id].days.add(day);

                    console.log(`  -> Assigned ${shift.name} - ${req.label} : ${candidate.name}`);
                } else {
                    console.log(`  -> ⚠️ UNFILLED ${shift.name} ${req.label}`);
                }
            }
        }
    }

    // 5. Commit to Firestore
    if (assignments.length > 0) {
        console.log(`Generated ${assignments.length} shifts. Writing to DB...`);

        // Batch writes (max 500)
        const batch = writeBatch(db);
        const rotaRef = collection(db, 'shops', SHOP_ID, 'rota');

        assignments.forEach(s => {
            const ref = doc(rotaRef, s.id);
            batch.set(ref, s);
        });

        await batch.commit();
        console.log("✅ Rota Published Successfully!");
    } else {
        console.log("No assignments made.");
    }
}

autoPlanRota().catch(console.error);
