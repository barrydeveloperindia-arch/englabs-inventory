import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import currency from './config/currency.js';
import XHR2 from 'xhr2';

global.XMLHttpRequest = XHR2;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, initializeFirestore } from "firebase/firestore";
import multer from 'multer';

const app = express();
const PORT = 3001;

// Load Env Logic
function loadEnv() {
    // Determine file based on NODE_ENV
    let filename = '.env.development'; // Default
    if (process.env.NODE_ENV === 'production') filename = '.env.production';
    if (process.env.NODE_ENV === 'staging') filename = '.env.staging';

    // Check for existence, fallback to .env.local if specific env file missing
    let envPath = path.resolve(__dirname, filename);
    if (!fs.existsSync(envPath)) {
        console.warn(`[Env] ${filename} not found, checking .env.local...`);
        envPath = path.resolve(__dirname, '.env.local');
    }

    if (fs.existsSync(envPath)) {
        console.log(`[Env] Loading configuration from: ${path.basename(envPath)}`);
        const content = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const val = parts.slice(1).join('=').trim();
                env[key] = val;
            }
        });
        return env;
    }
    console.warn("[Env] No environment file found!");
    return {};
}

const env = loadEnv();
// console.log("Loaded Env Keys:", Object.keys(env)); // Reduced log spam
console.log("Storage Bucket:", env.VITE_FIREBASE_STORAGE_BUCKET);

const FIREBASE_CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

// Init Firebase
const firebaseApp = initializeApp(FIREBASE_CONFIG);
// Determine Database ID based on Env
let dbId = '(default)';
if (process.env.NODE_ENV === 'production') dbId = 'englabs1';
if (process.env.NODE_ENV === 'staging') dbId = 'englabs-staging';
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) dbId = 'englabs-dev';

console.log(`[Database] Connecting to: ${dbId}`);

const db = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
}, dbId);
const USER_ID = env.VITE_USER_ID;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    req.currency = currency.defaultCurrency;
    req.currencySymbol = currency.symbol;
    req.tax = currency.tax;
    next();
});

app.post("/shelf-scan/start", (req, res) => {
    exec(
        'antigravity shelf scan start --shop-type=grocery --location=UK --currency=GBP --vat-auto=true --barcode=true --inventory=auto --allow-unknown=true --auto-create-product=true --require-expiry=true --notify-admin=true',
        (err, stdout, stderr) => {
            if (err) return res.status(500).send(stderr);
            res.send({ message: "Shelf scan started (UK Grocery)", output: stdout });
        }
    );
});

app.get("/admin/unverified-products", async (req, res) => {
    try {
        if (!USER_ID) {
            // Auto discovery fallback if env missing
            const shopsRef = collection(db, 'shops');
            const shopSnap = await getDocs(shopsRef);
            if (shopSnap.empty) return res.status(500).json({ error: "No Shop ID found" });
            var resolvedUserId = shopSnap.docs[0].id; // using var for hoisting scope simplicity in this block
        }

        const targetId = USER_ID || resolvedUserId;
        const inventoryRef = collection(db, 'shops', targetId, 'inventory');
        const q = query(inventoryRef, where("status", "==", "UNVERIFIED"));
        const snapshot = await getDocs(q);

        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(items);
    } catch (error) {
        console.error("Admin Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch unverified products", details: error.message });
    }
});

app.post("/admin/verify-product/:id", async (req, res) => {
    try {
        if (!USER_ID) {
            // Auto discovery fallback logic if needed again (should be shared util but repeating for now)
            const shopsRef = collection(db, 'shops');
            const shopSnap = await getDocs(shopsRef);
            if (shopSnap.empty) return res.status(500).json({ error: "No Shop ID found" });
            var resolvedUserId = shopSnap.docs[0].id;
        }

        const targetId = USER_ID || resolvedUserId;
        const {
            name, category, price_gbp, vat_percent,
            brand, stock, shelfLocation, barcode, sku,
            batchNumber, expiryDate, minStock, unitType,
            origin, supplierId, costPrice
        } = req.body;

        // Map inputs to Firestore schema (InventoryItem)
        const updates = {
            name: name,
            category: category,
            price: parseFloat(price_gbp),
            vatRate: parseFloat(vat_percent),

            // Additional Fields for Full Sync
            brand: brand || 'GENERIC',
            stock: parseFloat(stock) || 0,
            shelfLocation: shelfLocation || '',
            barcode: barcode || '',
            sku: sku || '',
            batchNumber: batchNumber || '',
            expiryDate: expiryDate || null,
            minStock: parseInt(minStock) || 10,
            unitType: unitType || 'pcs',
            origin: origin || 'Import',
            supplierId: supplierId || '',
            costPrice: parseFloat(costPrice) || 0,

            status: "LIVE",
            authorizedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (req.body.imageUrl) {
            updates.imageUrl = req.body.imageUrl;
        }

        const docRef = doc(db, 'shops', targetId, 'inventory', req.params.id);

        await setDoc(docRef, updates, { merge: true });

        res.send("Product verified & live");
    } catch (e) {
        console.error("Verify Error:", e);
        res.status(500).send(e.message);
    }
});

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// LOCAL FILE STORAGE STRATEGY (Nuclear Option)
// This avoids all Firebase Storage authentication/CORS/Bucket 404 issues by serving files directly from this PC.
app.post("/api/proxy-upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send("No file uploaded.");

        // The file is already saved to 'uploads/' by multer
        // We just need to return the URL that points to this server
        // Since 'adb reverse tcp:3001 tcp:3001' is active, the phone can access localhost:3001

        const filename = req.file.filename;
        // Use 127.0.0.1 instead of localhost to prevent Capacitor from intercepting it as an internal asset
        const localUrl = `http://127.0.0.1:3001/uploads/${filename}`;

        console.log(`[Proxy] Saved locally: ${localUrl}`);

        res.json({ url: localUrl });

    } catch (e) {
        console.error("Local Upload Error:", e);
        res.status(500).send(e.message);
    }
});

app.post("/admin/verify-staff/:id", async (req, res) => {
    try {
        if (!USER_ID) {
            const shopsRef = collection(db, 'shops');
            const shopSnap = await getDocs(shopsRef);
            if (shopSnap.empty) return res.status(500).json({ error: "No Shop ID found" });
            var resolvedUserId = shopSnap.docs[0].id;
        }

        const targetId = USER_ID || resolvedUserId;
        const { name, role, pin, niNumber } = req.body;

        // Map inputs to Firestore schema (StaffMember)
        const updates = {
            name: name,
            role: role,
            pin: pin,
            niNumber: niNumber,
            status: "Active",
            joinedDate: new Date().toISOString().split('T')[0],
            authorizedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = doc(db, 'shops', targetId, 'staff', req.params.id);

        await updateDoc(docRef, updates);

        res.send("Staff Authorized & Active");
    } catch (e) {
        console.error("Verify Staff Error:", e);
        res.status(500).send(e.message);
    }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Automation Server running on http://localhost:${PORT}`);
    });
}

export default app;
