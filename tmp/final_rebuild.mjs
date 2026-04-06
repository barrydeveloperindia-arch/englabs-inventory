import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import * as crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const envPath = path.resolve(__dirname, '../.env.local');

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
const PUBLIC_DIR = "public/vendor_invoices";

async function clearCollection(colPath) {
    console.log(`Wiping collection: ${colPath}`);
    const snap = await getDocs(collection(specificDb, colPath));
    for (const d of snap.docs) {
        await deleteDoc(d.ref);
    }
}

function parseOCRText(text, dirName) {
    const t = text.replace(/\n|\\n/g, ' ');

    let gstin = '', phone = '', email = '', amount = 0, invNo = '', dateStr = '';
    
    // Vendor Info
    const gstinMatch = text.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}/);
    if(gstinMatch) gstin = gstinMatch[0];
    const phoneMatch = text.match(/[\+]?[0-9]{2}[\-\s]?[0-9]{10}|[0-9]{10}/);
    if(phoneMatch) phone = phoneMatch[0];
    const emailMatch = text.match(/[a-zA-Z0-9_\-\.]+@[a-zA-Z0-9_\-\.]+\.[a-zA-Z]{2,5}/);
    if(emailMatch) email = emailMatch[0];
    
    // Financial Info
    const amounts = t.match(/[0-9]{1,3}(?:,[0-9]{3})*\.[0-9]{2}/g);
    if(amounts && amounts.length > 0) {
        // usually total amount is the largest or last
        const numericAmounts = amounts.map(a => parseFloat(a.replace(/,/g, '')));
        amount = Math.max(...numericAmounts);
    }
    
    const invMatch = t.match(/(?:INV|INVOICE\s*NO|BILL\s*NO|Inv\.|Invoice)[\s\:\.\-\#]*([A-Z0-9\-\/]+)/i);
    invNo = invMatch ? invMatch[1].trim() : `INV-${dirName.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    if(invNo.length > 20) invNo = invNo.substring(0, 15);
    
    const dateMatch = t.match(/[0-9]{2}[\/\-\.][0-9]{2}[\/\-\.][0-9]{4}/);
    dateStr = new Date().toISOString().split('T')[0];
    if(dateMatch) {
         const pts = dateMatch[0].replace(/[\.\-]/g, '/').split('/');
         if(pts.length === 3) dateStr = `${pts[2]}-${pts[1]}-${pts[0]}`;
    }

    // Items line parsing
    const items = [];
    // Looking for lines ending in numbers: "Item Name 10 500 5000" or similar
    const lines = text.split('\n');
    for(const line of lines) {
       const lineMatch = line.match(/^(.+?)\s+(\d+)\s+([\d\.,]+)\s+([\d\.,]+)$/);
       if(lineMatch && lineMatch[1] && lineMatch[1].length > 3 && !lineMatch[1].toLowerCase().includes('total')) {
            const qty = parseInt(lineMatch[2] || '1', 10);
            const rate = parseFloat((lineMatch[3] || '0').replace(/,/g, ''));
            const txt = lineMatch[1].replace(/[^a-zA-Z0-9\-\s]/g, '').trim();
            if(txt.length > 3) {
                 items.push({ name: txt, qty, rate, total: qty * rate });
            }
       }
    }
    
    // If no strict regex layout match, just put a default logic to "Machine Tools" 
    if(items.length === 0) {
       items.push({ name: `Industrial Materials (${dirName})`, qty: 1, rate: amount, total: amount });
    }

    return { gstin, phone, email, amount, invoiceNumber: invNo, date: dateStr, items };
}

async function rebuildSystem() {
    console.log("=== PHASE 1: Wiping Data ===");
    await clearCollection(`shops/${userId}/inventory`);
    await clearCollection(`shops/${userId}/purchases`);
    await clearCollection(`shops/${userId}/suppliers`);
    
    console.log("=== PHASE 2: Rebuilding from OCR Dump ===");
    if(!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, {recursive: true});

    const ocrDump = JSON.parse(fs.readFileSync('tmp/raw_ocr_dump.json'));
    
    for(const [vendorName, rawText] of Object.entries(ocrDump)) {
        console.log(`Processing: ${vendorName}`);
        
        // Locate physical file to copy
        const dirPath = path.join(BASE_DIR, vendorName);
        let targetFile = null, displayFile = '';
        if(fs.statSync(dirPath).isDirectory()) {
            const files = fs.readdirSync(dirPath);
            for(const item of files) {
               const fullPath = path.join(dirPath, item);
               if(!fs.statSync(fullPath).isDirectory() && fullPath.match(/\.(pdf|jpe?g|png)$/i)) { 
                   targetFile = fullPath; break; 
               }
            }
        }
        if(targetFile) {
            const ext = path.extname(targetFile);
            displayFile = `/vendor_invoices/${vendorName.replace(/\s+/g, '_')}${ext}`;
            fs.copyFileSync(targetFile, path.join(process.cwd(), 'public', 'vendor_invoices', `${vendorName.replace(/\s+/g, '_')}${ext}`));
        }
        
        const extracted = parseOCRText(rawText, vendorName);
        
        // 1. Create Vendor
        const supId = crypto.randomUUID();
        const vendor = {
            id: supId, name: vendorName,
            contactName: vendorName, phone: extracted.phone, email: extracted.email,
            address: 'Verified Invoice Address', gstin: extracted.gstin,
            category: 'Approved Supplier',
            totalSpend: extracted.amount, outstandingBalance: extracted.amount, orderCount: 1,
            verificationStatus: 'VERIFIED'
        };
        await setDoc(doc(specificDb, 'shops', userId, 'suppliers', supId), vendor);
        
        // 2. Create Items & Purchase Line Items
        const purchaseItems = [];
        for(const item of extracted.items) {
             // Create Inventory Item strictly based on extracted data
             const invId = crypto.randomUUID();
             const invData = {
                 id: invId,
                 name: item.name,
                 sku: `SKU-${Date.now().toString().slice(-5)}`,
                 category: 'Procurement',
                 price: item.rate, // selling price can be same for now
                 costPrice: item.rate,
                 stock: item.qty,
                 unit: 'nos',
                 minStock: 2,
                 createdAt: new Date().toISOString()
             };
             await setDoc(doc(specificDb, 'shops', userId, 'inventory', invId), invData);
             
             purchaseItems.push({
                 id: crypto.randomUUID(),
                 itemId: invId,
                 name: item.name,
                 qty: item.qty,
                 unitPrice: item.rate,
                 total: item.total
             });
        }
        
        // 3. Create Purchase Entry
        const pId = crypto.randomUUID();
        const purchase = {
            id: pId,
            date: extracted.date,
            supplierId: supId,
            vendorName: vendorName,
            invoiceNumber: extracted.invoiceNumber,
            items: extracted.items.map(i => i.name).join(', '),
            amount: extracted.amount,
            qty: extracted.items.reduce((s, a) => s + a.qty, 0),
            unitPrice: purchaseItems[0]?.unitPrice || extracted.amount,
            status: 'Received',
            category: 'Stock',
            paymentMode: 'NET BANKING',
            invoiceUrl: displayFile // Linked Invoice Document
        };
        await setDoc(doc(specificDb, 'shops', userId, 'purchases', pId), purchase);
        
        console.log(` -> Completed: ${vendorName} (${purchaseItems.length} items, amount: ${extracted.amount})`);
    }
    
    console.log("\n=== Operation Completed! All systems rebuilt ===");
    process.exit(0);
}

rebuildSystem().catch(console.error);
