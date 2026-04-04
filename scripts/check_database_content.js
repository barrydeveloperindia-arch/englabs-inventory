
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

const reportPath = path.resolve(__dirname, '../output/database_report.md');

async function main() {
    console.log("🔍 Starting Database Dump...");
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });

    // Clear Report
    fs.writeFileSync(reportPath, `# Firebase Database Report\nGenerated at: ${new Date().toISOString()}\n\n`);

    const app = initializeApp(FIREBASE_CONFIG);
    // Force Long Polling for named DB
    const db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, "englabs1");

    // Auto-discover Shop/User ID if not set
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
    } else {
        console.log(`ℹ️ Target Shop ID: ${userId}`);
    }

    fs.appendFileSync(reportPath, `**Shop ID:** \`${userId}\`\n\n`);

    const collectionsToCheck = [
        'inventory',
        'transactions',
        'staff',
        'attendance',
        'ledger',
        'suppliers',
        'bills',
        'expenses',
        'purchases',
        'daily_sales',
        'snapshots'
    ];

    for (const colName of collectionsToCheck) {
        process.stdout.write(`Scanning ${colName}... `);
        const colRef = collection(db, 'shops', userId, colName);
        try {
            const snapshot = await getDocs(colRef);
            const count = snapshot.size;
            process.stdout.write(`${count} docs.\n`);

            fs.appendFileSync(reportPath, `## Collection: ${colName.toUpperCase()} (${count})\n`);

            if (count > 0) {
                fs.appendFileSync(reportPath, `| ID | Data Summary |\n|---|---|\n`);
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Simplified JSON string for table
                    let json = JSON.stringify(data);
                    if (json.length > 500) json = json.substring(0, 500) + '...';
                    fs.appendFileSync(reportPath, `| \`${doc.id}\` | \`${json}\` |\n`);
                });
            } else {
                fs.appendFileSync(reportPath, `*(Empty)*\n`);
            }
            fs.appendFileSync(reportPath, `\n---\n\n`);

        } catch (e) {
            console.error(`Error: ${e.message}`);
            fs.appendFileSync(reportPath, `## Collection: ${colName.toUpperCase()} (ERROR)\nError accessing collection: ${e.message}\n\n`);
        }
    }

    console.log(`\n✅ Report generated at: ${reportPath}`);
    process.exit(0);
}

main().catch(err => {
    console.error("Fatal:", err);
    process.exit(1);
});
