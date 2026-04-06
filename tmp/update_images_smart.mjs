import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";
import 'dotenv/config';

import url from 'url';
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

const IMG_MAP = {
    paint: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop",
    tool: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=800&auto=format&fit=crop",
    paper: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop",
    cleaning: "https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=800&auto=format&fit=crop",
    tape: "https://images.unsplash.com/photo-1628148816823-388ed7c641cc?q=80&w=800&auto=format&fit=crop",
    battery: "https://images.unsplash.com/photo-1620288820638-34857ed8eabf?q=80&w=800&auto=format&fit=crop",
    glove: "https://images.unsplash.com/photo-1584634731339-252c581abfc5?q=80&w=800&auto=format&fit=crop",
    hardware: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=800&auto=format&fit=crop",
    default: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop"
};

function assignImage(name) {
    if (!name) return IMG_MAP.default;
    const n = name.toLowerCase();
    if (n.includes('paint') || n.includes('primer') || n.includes('lac') || n.includes('coat') || n.includes('thinner')) return IMG_MAP.paint;
    if (n.includes('tool') || n.includes('blade') || n.includes('machine') || n.includes('rod') || n.includes('insert')) return IMG_MAP.tool;
    if (n.includes('paper') || n.includes('pen') || n.includes('pad') || n.includes('book') || n.includes('marker')) return IMG_MAP.paper;
    if (n.includes('clean') || n.includes('wash') || n.includes('colin') || n.includes('harpic') || n.includes('surf') || n.includes('tissue') || n.includes('freshner')) return IMG_MAP.cleaning;
    if (n.includes('tape') || n.includes('glue') || n.includes('fevicol') || n.includes('fevikwik') || n.includes('araldite')) return IMG_MAP.tape;
    if (n.includes('cell') || n.includes('battery') || n.includes('headphon')) return IMG_MAP.battery;
    if (n.includes('glove') || n.includes('mask') || n.includes('cap') || n.includes('apran')) return IMG_MAP.glove;
    if (n.includes('clip') || n.includes('pin') || n.includes('zip') || n.includes('rubb')) return IMG_MAP.hardware;
    
    return IMG_MAP.default;
}

async function updateImages() {
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    let count = 0;
    
    for (const d of snap.docs) {
        const item = d.data();
        // If it's a completely empty or invalid item from the legacy generator, just skip or standardize
        if (item.name) {
            const newImg = assignImage(item.name);
            await updateDoc(d.ref, { imageUrl: newImg, photoUrl: newImg });
            count++;
            console.log(`Updated [${item.name}] => ${newImg.slice(0, 35)}...`);
        }
    }
    
    console.log(`Successfully updated ${count} inventory images based on context.`);
    process.exit(0);
}

updateImages().catch(console.error);
