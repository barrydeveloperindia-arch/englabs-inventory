import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc } from "firebase/firestore";
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

async function restoreGeneric() {
    console.log("Restoring 'Generic' to items that lack brands...");
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    let count = 0;
    
    for (const d of snap.docs) {
        const item = d.data();
        if (!item.brand || item.brand === '') {
            await updateDoc(d.ref, { brand: 'Generic' });
            count++;
            console.log(`[Restored] ${item.name} -> Brand: Generic`);
        }
    }
    
    console.log(`\n✅ Finished Restoring. Put 'Generic' back onto ${count} items natively in the database.`);
    process.exit(0);
}

restoreGeneric().catch(console.error);
