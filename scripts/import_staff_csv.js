
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, initializeFirestore } from "firebase/firestore";
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

const CSV_PATH = path.resolve(__dirname, './data/staff_template.csv');

async function main() {
    console.log("🚀 Starting Staff Import from CSV...");

    // 1. Init Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    // Use Named Database if configured
    const dbId = env.VITE_FIREBASE_DATABASE_ID || '(default)';
    console.log(`Target Database: ${dbId}`);

    // Force Long Polling
    const db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, dbId);

    const userId = env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Target Shop: ${userId}`);

    // 2. Read CSV
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`File not found: ${CSV_PATH}`);
        process.exit(1);
    }
    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    // Headers: Name,Role,Pin,ContractType,NINumber,TaxCode,HourlyRate,EmergencyContact,Phone
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    console.log("Headers:", headers);

    let count = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(',').map(c => c.trim());
        if (cols.length < 2) continue;

        const row = {};
        headers.forEach((h, idx) => {
            row[h] = cols[idx];
        });

        // Generate ID
        const name = row['name'];
        if (!name) continue;

        // Match existing ID logic: lowercase, alphanumeric
        let staffId = name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Handle "Gaurav Panchal" -> "gauravpanchal" or "gaurav"? 
        // Previous script used full name. let's stick to that to avoid collisions, 
        // BUT if existing staff is just "Paras", that is "paras". "Gaurav Panchal" -> "gauravpanchal".
        // Use manual mapping if needed, but for now standard logic:

        // Prepare Data
        const staffData = {
            id: staffId,
            name: name,
            role: row['role'] || 'Staff',
            pin: row['pin'] || '0000',
            contractType: row['contracttype'] || 'Zero-hour',
            niNumber: row['ninumber'] || '',
            taxCode: row['taxcode'] || '',
            hourlyRate: parseFloat(row['hourlyrate']) || 0,
            phone: row['phone'] || '',
            emergencyContact: row['emergencycontact'] || '',
            joinedDate: row['joineddate'] || row['startdate'] || new Date().toISOString().split('T')[0],
            status: 'Active',
            updatedAt: new Date().toISOString()
        };

        // Write to Firestore
        const staffRef = doc(db, 'shops', userId, 'staff', staffId);
        await setDoc(staffRef, staffData, { merge: true });

        console.log(`   + Upserted: ${name} (${staffId}) - Rate: ${staffData.hourlyRate}, PIN: ${staffData.pin}`);
        count++;
    }

    console.log(`\n✅ Import Complete. Processed ${count} records.`);
    process.exit(0);
}

main().catch(e => console.error(e));
