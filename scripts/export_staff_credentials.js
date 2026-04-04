
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load .env.local manually
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

const FIREBASE_CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const OUTPUT_FILE = path.resolve(__dirname, '../docs/FIREBASE_STAFF_CREDENTIALS.md');

async function main() {
    console.log("🔐 Starting Staff Credentials Export...");

    // Initialize Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    // Force Long Polling for named DB
    const db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, "englabs1");

    // Get Shop ID
    let userId = env.VITE_USER_ID;
    if (!userId) {
        console.log("⚠️ VITE_USER_ID missing. Attempting auto-discovery...");
        const shopsRef = collection(db, 'shops');
        const snapshot = await getDocs(shopsRef);
        if (!snapshot.empty) {
            userId = snapshot.docs[0].id;
            console.log(`✅ Discovered Shop ID: ${userId}`);
        } else {
            console.error("❌ No shops found.");
            process.exit(1);
        }
    }

    console.log(`Fetching staff from Shop ID: ${userId}`);

    try {
        const staffRef = collection(db, 'shops', userId, 'staff');
        const snapshot = await getDocs(staffRef);

        if (snapshot.empty) {
            console.log("No staff members found.");
            process.exit(0);
        }

        console.log(`Found ${snapshot.size} staff members.`);

        let markdown = `# 🔥 Firebase Staff Credentials Export
Generated at: ${new Date().toLocaleString()}

This document contains current staff credentials fetched directly from the Firestore Production Database.

| Name | Role | PIN | Login Barcode | Email | System ID |
|:---|:---|:---:|:---:|:---|:---|
`;

        const staffList = [];
        snapshot.forEach(doc => {
            staffList.push({ id: doc.id, ...doc.data() });
        });

        // Sort by Name
        staffList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        staffList.forEach(s => {
            const name = s.name || 'Unknown';
            const role = s.role || '-';
            const pin = s.pin || '❌ NO PIN';
            const barcode = s.loginBarcode || '-';
            const email = s.email || '-';
            const id = s.id;

            markdown += `| **${name}** | ${role} | \`${pin}\` | \`${barcode}\` | ${email} | \`${id}\` |\n`;
        });

        markdown += `\n\n---
**Note:** This file is a snapshot of the live database. Do not manually edit this file to change credentials; update them in the application or database instead.
`;

        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, markdown);

        console.log(`✅ Credentials successfully exported to: ${OUTPUT_FILE}`);
        console.log("Please delete this file if it contains sensitive data that should not be persisted indefinitely.");

    } catch (error) {
        console.error("❌ Error fetching staff data:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
