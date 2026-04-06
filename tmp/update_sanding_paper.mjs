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

async function updateSandingPaper() {
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    let count = 0;
    
    for (const d of snap.docs) {
        const item = d.data();
        if (item.name && item.name.toLowerCase().includes('sanding paper')) {
            const newImg = "/assets/sanding_paper.png";
            await updateDoc(d.ref, { imageUrl: newImg, photoUrl: newImg });
            count++;
            console.log(`Updated [${item.name}] => ${newImg}`);
        }
    }
    
    console.log(`Successfully updated ${count} sanding paper images.`);
    process.exit(0);
}

updateSandingPaper().catch(console.error);
