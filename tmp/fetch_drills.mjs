import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function fetchDrills() {
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    snap.docs.forEach(d => {
        const item = d.data();
        if (item.name && item.name.toLowerCase().includes('drill')) {
            console.log(`[Drill] Name: ${item.name} | Brand: ${item.brand} | Image: ${item.imageUrl}`);
        }
    });
    console.log("Done");
    process.exit(0);
}
fetchDrills().catch(console.error);
