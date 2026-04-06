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

function getAutoImageForAsset(name) {
    const n = name.toLowerCase();
    
    if (n.includes('sanding') || n.includes('emery')) return '/assets/sanding_paper.png';
    if (n.includes('glue') || n.includes('fevicol') || n.includes('araldite')) return 'https://images.unsplash.com/photo-1596769931885-30fa900f6074?q=80&w=800';
    if (n.includes('tool') || n.includes('diamond') || n.includes('blade') || n.includes('drill') || n.includes('milwaukee') || n.includes('dewalt') || n.includes('bosch') || n.includes('makita') || n.includes('hammer') || n.includes('power')) return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800';
    if (n.includes('cleaning') || n.includes('harpic') || n.includes('colin') || n.includes('dettol') || n.includes('vim') || n.includes('brush')) return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=800';
    if (n.includes('paper') && !n.includes('sanding')) return 'https://images.unsplash.com/photo-1628126235206-5260b9ea6441?q=80&w=800';
    if (n.includes('tissue')) return 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?q=80&w=800';
    if (n.includes('glove') || n.includes('apran') || n.includes('mask') || n.includes('safety') || n.includes('n95') || n.includes('respirator')) return 'https://images.unsplash.com/photo-1584308666744-24d5e4b2d5a3?q=80&w=800';
    if (n.includes('tape') || n.includes('zip lock') || n.includes('adhesive')) return 'https://images.unsplash.com/photo-1622322306265-1d4cb803aede?q=80&w=800';
    if (n.includes('cell') || n.includes('battery')) return 'https://images.unsplash.com/photo-1616422285623-1d0e1bbaaa0c?q=80&w=800';
    if (n.includes('tie') || n.includes('zip tie') || n.includes('cable tie')) return 'https://images.unsplash.com/photo-1655184638708-cf1feaf8a623?q=80&w=800';
    if (n.includes('hardware') || n.includes('screw') || n.includes('nut') || n.includes('bolt') || n.includes('chuck')) return 'https://images.unsplash.com/photo-1581280650962-d922a9eef113?q=80&w=800';
    if (n.includes('mouse') || n.includes('mouse pad') || n.includes('keyboard') || n.includes('computer')) return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800';

    return '/assets/englabs_logo.png'; // Fallback
}

async function forceUpdateAllImages() {
    console.log("Starting forced image update mapping...");
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    let count = 0;
    
    for (const d of snap.docs) {
        const item = d.data();
        if (item.name) {
            const newImage = getAutoImageForAsset(item.name);
            await updateDoc(d.ref, { 
                imageUrl: newImage,
                photoUrl: newImage // Also hit photoUrl just in case
            });
            count++;
            console.log(`[Re-mapped] ${item.name} -> ${newImage.substring(0, 50)}...`);
        }
    }
    
    console.log(`\n✅ Database Audit Complete. Re-mapped ${count} item images.`);
    process.exit(0);
}

forceUpdateAllImages().catch(console.error);
