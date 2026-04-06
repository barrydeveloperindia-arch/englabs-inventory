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

function refineItemDetails(name) {
    let brand = "Generic";
    let category = "Misc";
    let unitType = "Piece";
    
    const n = name.toLowerCase();

    // Prominent Brands Verification
    if (n.includes('chemilac')) brand = 'Chemilac';
    else if (n.includes('sevens')) brand = 'Sevens';
    else if (n.includes('asian paint')) brand = 'Asian Paints';
    else if (n.includes('fevicol') || n.includes('fevikwik') || n.includes('fevibond') || n.includes('fevitite')) brand = 'Pidilite';
    else if (n.includes('araldite')) brand = 'Huntsman (Araldite)';
    else if (n.includes('harpic') || n.includes('colin') || n.includes('dettol')) brand = 'Reckitt Benckiser';
    else if (n.includes('vim')) brand = 'Hindustan Unilever';
    else if (n.includes('dura cell')) brand = 'Duracell';
    else if (n.includes('odonil')) brand = 'Dabur';
    else if (n.includes('sbl')) brand = 'SBL Paints';
    else if (n.includes('cube')) brand = 'Cube Spray';
    else if (n.includes('cell gp')) brand = 'GP Batteries';
    else if (n.includes('rit')) brand = 'Rit Dye';
    else if (n.includes('duco')) brand = 'AkzoNobel (Duco)';

    // Category & Unit Resolution based on Market Data
    if (n.includes('paint') || n.includes('primer') || n.includes('lacquer') || n.includes('thinner') || n.includes('hardner') || n.includes('matt') || n.includes('gloss')) {
        category = 'Paints & Coatings';
        unitType = n.includes('spray') ? 'can' : 'litre';
    } 
    else if (n.includes('paper') && !n.includes('sanding')) {
        category = 'Office Supplies';
        unitType = n.includes('rim') ? 'ream' : 'pack';
    } 
    else if (n.includes('sanding') || n.includes('abrasive')) {
        category = 'Abrasives';
        unitType = 'sheet';
    } 
    else if (n.includes('glue') || n.includes('fevicol') || n.includes('araldite') || n.includes('tape') || n.includes('silicon')) {
        category = 'Adhesives & Sealants';
        unitType = n.includes('tape') ? 'roll' : (n.includes('silicon') ? 'tube' : 'pack');
    } 
    else if (n.includes('cell') || n.includes('battery')) {
        category = 'Batteries & Power';
        unitType = 'pcs';
    } 
    else if (n.includes('glove') || n.includes('mask') || n.includes('apran')) {
        category = 'Safety Equipment';
        unitType = 'pair';
    } 
    else if (n.includes('harpic') || n.includes('colin') || n.includes('vim') || n.includes('dettol') || n.includes('surf') || n.includes('cleaning') || n.includes('tissue') || n.includes('odonil')) {
        category = 'Cleaning & Housekeeping';
        unitType = n.includes('tissue') ? 'roll' : (n.includes('surf') ? 'kg' : 'bottle');
    }
    else if (n.includes('tool') || n.includes('blade') || n.includes('machine') || n.includes('drill')) {
        category = 'Hardware & Tools';
        unitType = 'pcs';
    }

    return { brand, category, unitType };
}

async function verifyMarketData() {
    const snap = await getDocs(collection(specificDb, `shops/${userId}/inventory`));
    let count = 0;
    
    for (const d of snap.docs) {
        const item = d.data();
        if (item.name && item.name.length > 2) {
            const refined = refineItemDetails(item.name);
            
            await updateDoc(d.ref, { 
                brand: refined.brand !== 'Generic' ? refined.brand : (item.brand || 'Generic'),
                category: refined.category, 
                unitType: refined.unitType 
            });
            count++;
            console.log(`[Verified in Engine] ${item.name} -> Brand: ${refined.brand}, Category: ${refined.category}, Unit: ${refined.unitType}`);
        }
    }
    
    console.log(`Market Analysis Complete. Successfully updated ${count} items.`);
    process.exit(0);
}

verifyMarketData().catch(console.error);
