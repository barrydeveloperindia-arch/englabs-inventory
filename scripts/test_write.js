
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, initializeFirestore } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const USER_ID = env.VITE_USER_ID || "hop-in-express-";

async function main() {
    console.log("🚀 Starting Write Test...");

    setTimeout(() => {
        console.error("❌ TIMEOUT after 10s");
        process.exit(1);
    }, 10000);

    const app = initializeApp(FIREBASE_CONFIG);
    const db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    }, "englabs1");

    console.log(`Writing to shops/${USER_ID}/inventory/test-write-check`);

    try {
        await setDoc(doc(db, "shops", USER_ID, "inventory", "test-write-check"), {
            name: "Write Check",
            timestamp: new Date().toISOString()
        });
        console.log("✅ Write Successful!");
    } catch (e) {
        console.error("❌ Write Failed:", e);
    }
    process.exit(0);
}

main();
