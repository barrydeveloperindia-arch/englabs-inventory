import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
import * as crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

const API_KEY = process.env.VITE_GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are an expert procurement clerk. Extract all contact info, GST, items and invoice numbers exactly from the document."
});

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

const BASE_DIR = "G:\\Englabs Inventory 2026-27\\Purchased Invoice Details";

const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
            contactName: { type: SchemaType.STRING },
            phone: { type: SchemaType.STRING },
            email: { type: SchemaType.STRING },
            address: { type: SchemaType.STRING },
            gstin: { type: SchemaType.STRING },
            invoiceNumber: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING },
            totalAmount: { type: SchemaType.NUMBER },
            itemsDescription: { type: SchemaType.STRING }
        }
    }
};

async function scanVendor(dirName) {
    const dirPath = path.join(BASE_DIR, dirName);
    if (!fs.statSync(dirPath).isDirectory()) return null;

    let targetFile = null;
    const items = fs.readdirSync(dirPath);
    for(const item of items) {
       const fullPath = path.join(dirPath, item);
       if(!fs.statSync(fullPath).isDirectory()) {
           if(fullPath.match(/\.(pdf|jpe?g|png)$/i)) { targetFile = fullPath; break; }
       }
    }
    if (!targetFile) return null;

    console.log(`Analyzing: ${targetFile}...`);
    const fileBuffer = fs.readFileSync(targetFile);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = targetFile.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
    
    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [
                { text: "Extract contact details, GSTIN, invoice number, and totals." },
                { inlineData: { mimeType, data: base64Data } }
            ] }],
            generationConfig
        });
        const text = result.response.text();
        return JSON.parse(text);
    } catch (e) {
        console.error(`Error scanning ${targetFile}:`, e.message);
        return null;
    }
}

async function main() {
    console.log("Fetching existing vendors from DB...");
    const snap = await getDocs(collection(specificDb, 'shops', userId, 'suppliers'));
    const existingVendors = snap.docs.map(d => ({id: d.id, ...d.data()}));

    const dirs = fs.readdirSync(BASE_DIR);
    
    for (const dir of dirs) {
        if (dir.endsWith('.xlsx')) continue;
        
        let vendorInDb = existingVendors.find(v => v.name.toLowerCase() === dir.toLowerCase());
        
        if (!vendorInDb) {
             const id = crypto.randomUUID();
             vendorInDb = { id, name: dir, totalSpend: 0, outstandingBalance: 0, orderCount: 0 };
             existingVendors.push(vendorInDb);
        }
        
        // Skip if already successfully extracted (indicated by something we parsed like phone or gstin)
        if (vendorInDb.contactName || vendorInDb.gstin) {
            console.log(`Skipping ${dir}, already has data.`);
            continue;
        }

        const scanRes = await scanVendor(dir);

        
        if (scanRes) {
            vendorInDb.contactName = scanRes.contactName || vendorInDb.contactName || '';
            vendorInDb.phone = scanRes.phone || vendorInDb.phone || '';
            vendorInDb.email = scanRes.email || vendorInDb.email || '';
            vendorInDb.address = scanRes.address || vendorInDb.address || '';
            vendorInDb.gstin = scanRes.gstin || vendorInDb.gstin || '';
            if(!vendorInDb.category) vendorInDb.category = "Verified Partner";
            
            // Also create a Purchase!
            if (scanRes.invoiceNumber) {
                const pId = crypto.randomUUID();
                const purchase = {
                    id: pId,
                    date: scanRes.date || new Date().toISOString().split('T')[0],
                    supplierId: vendorInDb.id,
                    vendorName: vendorInDb.name,
                    invoiceNumber: scanRes.invoiceNumber,
                    items: scanRes.itemsDescription || 'Stock Inward',
                    amount: scanRes.totalAmount || 0,
                    qty: 1,
                    unitPrice: scanRes.totalAmount || 0,
                    status: 'Received',
                    category: 'Stock',
                    paymentMode: 'ON CREDIT' // default for testing
                };
                console.log(` -> Registering Purchase: ${purchase.invoiceNumber} for ${purchase.amount}`);
                await setDoc(doc(specificDb, 'shops', userId, 'purchases', pId), purchase);
                
                vendorInDb.orderCount += 1;
                vendorInDb.totalSpend += purchase.amount;
                vendorInDb.outstandingBalance += purchase.amount;
            }
        }
        
        console.log("Updating vendor details:", vendorInDb.name);
        await setDoc(doc(specificDb, 'shops', userId, 'suppliers', vendorInDb.id), vendorInDb);
        await new Promise(r => setTimeout(r, 15000));
    }
    
    console.log("\n--- Update Complete ---");
    process.exit(0);
}
main().catch(console.error);
