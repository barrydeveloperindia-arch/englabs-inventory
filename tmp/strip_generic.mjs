import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: process.env.VITE_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
import { initializeFirestore } from "firebase/firestore";
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs-dev';
const specificDb = initializeFirestore(app, {}, dbId);
const userId = process.env.VITE_USER_ID || 'englabs-enterprise';

async function stripGenericFromName() {
    console.log("Stripping 'Generic' from all database items...");
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    let count = 0;
    
    for (const d of snap.docs) {
        const item = d.data();
        let updated = false;
        const updates = {};
        
        if (item.name && item.name.toLowerCase().includes('generic')) {
            let n = item.name.replace(/generic/ig, '').trim();
            // Capitalize logically
            n = n.charAt(0).toUpperCase() + n.slice(1);
            updates.name = n;
            updated = true;
        }
        
        if (item.brand && item.brand.toLowerCase() === 'generic') {
            updates.brand = ''; // Totally remove brand if it's generic
            updated = true;
        }

        if (updated) {
            await updateDoc(d.ref, updates);
            count++;
            console.log(`[Cleaned] ${item.name} -> ${updates.name || item.name} (Brand: ${updates.brand !== undefined ? updates.brand : item.brand})`);
        }
    }
    
    console.log(`\n✅ Finished cleaning. Removed 'Generic' from ${count} items natively in the database.`);
    process.exit(0);
}

stripGenericFromName().catch(console.error);
