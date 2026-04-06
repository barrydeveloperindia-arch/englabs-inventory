import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import 'dotenv/config';

import url from 'url';
import path from 'path';
import fs from 'fs';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

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

async function listItems() {
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    const items = snap.docs.map(d => ({id: d.id, name: d.data().name }));
    fs.writeFileSync('tmp/inventory_names.json', JSON.stringify(items, null, 2));
    console.log(`Dumped ${items.length} items`);
    process.exit(0);
}
listItems();
