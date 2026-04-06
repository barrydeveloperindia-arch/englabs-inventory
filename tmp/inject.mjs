import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as crypto from 'crypto';
import fs from 'fs';
import 'dotenv/config';

import url from 'url';
import path from 'path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');
if(fs.existsSync(envPath)){
  import('dotenv').then(dotenv => dotenv.config({path: envPath}));
}

// Ensure env variables are available natively if running with --env-file
const apiKey = process.env.VITE_FIREBASE_API_KEY;
if(!apiKey) {
    console.error("No API key found. Process env keys:", Object.keys(process.env).filter(k => k.startsWith('VITE')));
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Use default db logic as initialized
const dbId = process.env.VITE_FIREBASE_DATABASE_ID || 'englabs-dev';
// Firestore initialization with named DB might need specific config in Node, we will use the standard default since the schema defines the collection path anyway: 'shops/userId/suppliers/...' but wait, if it uses a named DB, we can just use `initializeFirestore(app, {}, dbId)`
import { initializeFirestore } from "firebase/firestore";
const specificDb = initializeFirestore(app, {}, dbId);

const userId = process.env.VITE_USER_ID || 'englabs-enterprise';

async function main() {
    console.log(`Injecting into -> Project: ${firebaseConfig.projectId}, DB: ${dbId}, Shop: ${userId}`);
    const data = JSON.parse(fs.readFileSync('./tmp/scanned_vendors.json'));
    let added = 0;
    
    for(const v of data){
        const id = crypto.randomUUID();
        const obj = {
            id,
            name: v.name,
            contactName: v.contactName || '',
            phone: v.phone || '',
            email: v.email || '',
            category: v.category || 'General Wholesale',
            address: v.address || '',
            gstin: v.gstin || '',
            totalSpend: 0,
            outstandingBalance: 0,
            orderCount: 0
        };
        const ref = doc(specificDb, 'shops', userId, 'suppliers', id);
        await setDoc(ref, obj);
        console.log("Added supplier:", v.name);
        added++;
    }
    console.log(`Successfully added ${added} vendor records.`);
    process.exit(0);
}
main().catch(console.error);
