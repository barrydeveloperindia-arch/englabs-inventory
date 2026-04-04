
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

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

const ROLE_UPDATES: Record<string, string> = {
    // Map Name Parts (uppercase) to New Role
    'SALIL': 'Business Coordinator',
    'PARTH': 'Business Coordinator',
    'NAYAN': 'Shop Assistant',
    'NISHA': 'Shop Assistant',
    // Paras stays Manager (no change needed actually, but verification good)
};

async function migrateRoles() {
    console.log("🚀 Starting Role Migration...");

    try {
        const staffRef = collection(db, 'staff');
        const snapshot = await getDocs(staffRef);
        let updatedCount = 0;

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const name = (data.name || '').toUpperCase();

            let newRole = null;

            if (name.includes('SALIL')) newRole = 'Business Coordinator';
            else if (name.includes('PARTH')) newRole = 'Business Coordinator';
            else if (name.includes('NAYAN')) newRole = 'Shop Assistant';
            else if (name.includes('NISHA')) newRole = 'Shop Assistant';

            if (newRole && data.role !== newRole) {
                console.log(`Updating ${data.name}: ${data.role} -> ${newRole}`);
                await updateDoc(doc(db, 'staff', docSnap.id), { role: newRole });
                updatedCount++;
            }
        }

        console.log(`✅ Migration Complete. Updated ${updatedCount} staff records.`);
    } catch (error) {
        console.error("❌ Migration Failed:", error);
    }
}

migrateRoles();
