
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simple unique PIN generator
const usedPins = new Set();

function generatePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

async function run() {
    const shopId = process.env.VITE_USER_ID || 'hop-in-express-';
    console.log(`Checking staff PINs for Shop ID: ${shopId}`);

    try {
        const staffRef = collection(db, 'shops', shopId, 'staff');
        const snapshot = await getDocs(staffRef);

        if (snapshot.empty) {
            console.log("No staff found!");
            process.exit(0);
        }

        // First pass: collect existing PINs
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.pin) {
                usedPins.add(data.pin);
            }
        });

        let updates = 0;

        for (const docSnap of snapshot.docs) {
            const staff = docSnap.data();
            let pin = staff.pin;
            let needsUpdate = false;

            if (!pin || pin.length !== 4) {
                needsUpdate = true;
            }

            if (needsUpdate) {
                do {
                    pin = generatePin();
                } while (usedPins.has(pin));

                usedPins.add(pin);
                await updateDoc(doc(db, 'shops', shopId, 'staff', staff.id), { pin });
                console.log(`Updated ${staff.name} (${staff.role}) -> New PIN: ${pin}`);
                updates++;
            } else {
                console.log(`Verified ${staff.name} -> PIN: ${pin}`);
            }
        }

        console.log(`\nProcess Complete. Updated ${updates} staff records.`);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}

run();
