
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, writeBatch, initializeFirestore } from "firebase/firestore";
import XLSX from 'xlsx';
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

const EXCEL_PATH = path.resolve(__dirname, '../output/2026_Time Sheet .xlsx');

async function main() {
    console.log("🚀 Starting Bulk Import from Excel Manifest...");



    // 1. Init Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    // Use Named Database 'englabs1'
    const db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, "englabs1");

    const userId = env.VITE_USER_ID || 'hop-in-express-';
    // Note: If ID is incomplete, script might fail. Assuming hop-in-express- from prev context or auto-discovery is better.
    // For robustness, let's just use the discovered one if possible or default to what's in env.

    console.log(`Target Shop: ${userId}`);

    // 2. Read Excel
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error(`File not found: ${EXCEL_PATH}`);
        process.exit(1);
    }
    const workbook = XLSX.readFile(EXCEL_PATH, { cellDates: true });

    // 3. Process Sheets
    let staffCount = 0;
    let attendanceCount = 0;

    for (const name of workbook.SheetNames) {
        // Skip metadata sheets if any known ones
        if (name.toLowerCase().includes('summary') || name.toLowerCase().includes('sheet')) {
            // "Time Sheet" might be in title, but sheet names were "Paras", "Salil" etc.
            // Let's assume most sheets are staff.
        }

        console.log(`\nProcessing Staff: ${name}`);
        const sheet = workbook.Sheets[name];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 5) continue; // Skip empty/header-only

        // A. Create/Ensure Staff Profile
        // sanitized ID
        const staffId = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const staffRef = doc(db, 'shops', userId, 'staff', staffId);



        // A. Create/Ensure Staff Profile (Blind Write)
        // sanitized ID is already declared above? No, I pasted it twice in previous step.


        await setDoc(staffRef, {
            id: staffId,
            name: name,
            role: 'Stock Staff', // Default
            contractType: 'Zero-hour',
            pin: '0000', // Default
            status: 'Active',
            joinedDate: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString()
        }, { merge: true });

        console.log(`   + Synced Profile: ${name}`);
        staffCount++;


        // B. Process Attendance Rows
        const batch = writeBatch(db);
        let batchOp = 0;

        // Analysis indicates Cols 9 and 10 are the Times
        let inTimeIdx = 9;
        let outTimeIdx = 10;
        let dateIdx = 0;

        console.log(`   > Using Observed Mapping: Date@${dateIdx}, In@${inTimeIdx}, Out@${outTimeIdx}`);

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[dateIdx]) continue; // Use dynamic dateIdx

            const dateVal = row[dateIdx];

            // Debug Log
            if (i < 30) console.log(`   [Row ${i}] DateCol: ${dateVal}`);

            let isDate = dateVal instanceof Date;

            // Only process if valid date >= 2025
            if (isDate && dateVal.getFullYear() >= 2025) {
                const dateStr = dateVal.toISOString().split('T')[0];
                const recordId = `${staffId}_${dateStr}`;

                // DEBUG: Look at the row content to decipher where "Time" is
                if (i < 30) {
                    console.log(`      [DEBUG Row ${i}] FullRow:`, JSON.stringify(row));
                }

                const inTimeVal = row[inTimeIdx];
                const outTimeVal = row[outTimeIdx];

                let clockIn = null;
                let clockOut = null;
                let status = 'Absent';

                // Helper to format HH:mm
                const fmtTime = (d) => {
                    if (d instanceof Date) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                    if (typeof d === 'string' && d.includes(':') && d.length < 20) return d; // Simple safety check
                    return null;
                };

                if (inTimeVal) {
                    clockIn = fmtTime(inTimeVal);
                    if (clockIn) status = 'Present';
                }
                if (outTimeVal) {
                    clockOut = fmtTime(outTimeVal);
                }

                if (i < 30 && status === 'Present') console.log(`      >> HIT: ${dateStr} In:${clockIn}`);



                // If no times, maybe it's a holiday or off?
                // For now, only log Present if we have times.
                if (status === 'Present') {
                    const record = {
                        id: recordId,
                        staffId: staffId,
                        date: dateStr,
                        status: status,
                        clockIn: clockIn,
                        clockOut: clockOut,
                        updatedAt: new Date().toISOString()
                    };

                    const attRef = doc(db, 'shops', userId, 'attendance', recordId);
                    batch.set(attRef, record, { merge: true });
                    batchOp++;
                    attendanceCount++;
                }
            }
        }

        if (batchOp > 0) {
            await batch.commit();
            console.log(`   + Synced ${batchOp} attendance records.`);
        }
    }

    console.log(`\n✅ Import Complete.`);
    console.log(`Staff Processed: ${staffCount} (New)`);
    console.log(`Attendance Records: ${attendanceCount}`);
    process.exit(0);
}

main().catch(e => console.error(e));
