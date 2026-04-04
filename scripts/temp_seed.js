
import { initializeApp } from "firebase/app";
import { doc, setDoc, writeBatch, initializeFirestore } from "firebase/firestore";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log("Config detected:", firebaseConfig.projectId);

if (!firebaseConfig.apiKey) {
  console.error("No API key found in .env.local!");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, process.env.VITE_FIREBASE_DATABASE_ID || '(default)');
const SHOP_ID = process.env.VITE_USER_ID || 'englabs-enterprise';

async function seed() {
  console.log("🚀 Seeding new ENGLABS project:", firebaseConfig.projectId);
  
  // 1. Seed Shop Profile
  await setDoc(doc(db, 'shops', SHOP_ID), {
    name: "ENGLABS Enterprise",
    owner: "englabscivilteam@gmail.com",
    address: "ENGLABS HQ",
    status: "Active",
    createdAt: new Date().toISOString()
  });
  console.log("✅ Shop profile created.");

  // 2. Seed Staff (Admin)
  await setDoc(doc(db, 'shops', SHOP_ID, 'staff', 'admin-001'), {
    id: 'admin-001',
    name: 'ENGLABS ADMIN',
    role: 'Owner',
    pin: '7788',
    loginBarcode: 'ENG-ADMIN-01',
    status: 'Active'
  });
  console.log("✅ Admin staff created.");

  // 3. Seed Inventory from inventory_full.json
  if (fs.existsSync('inventory_full.json')) {
    const rawData = fs.readFileSync('inventory_full.json', 'utf8');
    const inventory = JSON.parse(rawData);
    
    // Note: writeBatch is limited to 500 ops. If more than 500, we'll need loops.
    // inventory_full.json has ~100 items based on previous checks.
    const batch = writeBatch(db);
    inventory.forEach(item => {
      const id = item.id || `item-${Math.random().toString(36).substr(2, 9)}`;
      const ref = doc(db, 'shops', SHOP_ID, 'inventory', String(id));
      batch.set(ref, { ...item, updatedAt: new Date().toISOString() });
    });
    
    await batch.commit();
    console.log(`✅ Seeded ${inventory.length} inventory items.`);
  } else {
    console.warn("⚠️ inventory_full.json not found, skipping inventory seed.");
  }

  console.log("✨ ALL DONE!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
