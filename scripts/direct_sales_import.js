import { initializeApp } from "firebase/app";
import { getFirestore, doc, writeBatch, initializeFirestore } from "firebase/firestore";

// Config from .env.local
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732",
    databaseId: "englabs1"
};

const USER_ID = "hop-in-express-";

// Init Firebase
const app = initializeApp(FIREBASE_CONFIG);
// Explicitly using the databaseId found in .env.local
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, "englabs1");

const data = [
    {
        "date": "2026-01-01",
        "dayOfWeek": "Thursday",
        "totalSales": 145.39,
        "cashTaken": 65.95,
        "cashPurchases": 0.00,
        "cardTaken": 79.44,
        "categoryBreakdown": {
            "alcohol": 11.54,
            "tobacco": 70.25,
            "lottery": 1.05,
            "drinks": 12.01,
            "groceries": 15.30,
            "household": 0.00,
            "snacks": 4.29,
            "paypoint": 20.95,
            "news": 0,
            "other": 10.00
        },
        "id": "2026-01-01",
        "timestamp": new Date().toISOString()
    },
    {
        "date": "2025-12-30",
        "dayOfWeek": "Tuesday",
        "totalSales": 610.39,
        "cashTaken": 331.59,
        "cashPurchases": 0.00,
        "cardTaken": 278.80,
        "categoryBreakdown": {
            "alcohol": 69.79,
            "tobacco": 182.55,
            "lottery": 30.58,
            "drinks": 55.76,
            "groceries": 104.44,
            "household": 0.00,
            "snacks": 57.21,
            "paypoint": 101.50,
            "news": 0,
            "other": 8.56
        },
        "id": "2025-12-30",
        "timestamp": new Date().toISOString()
    },
    {
        "date": "2025-12-29",
        "dayOfWeek": "Monday",
        "totalSales": 342.98,
        "cashTaken": 130.28,
        "cashPurchases": 0.00,
        "cardTaken": 212.70,
        "categoryBreakdown": {
            "alcohol": 106.19,
            "tobacco": 60.51,
            "lottery": 16.11,
            "drinks": 38.51,
            "groceries": 98.77,
            "household": 4.37,
            "snacks": 17.02,
            "paypoint": 0,
            "news": 0,
            "other": 1.50
        },
        "id": "2025-12-29",
        "timestamp": new Date().toISOString()
    },
    {
        "date": "2025-12-28",
        "dayOfWeek": "Sunday",
        "totalSales": 252.51,
        "cashTaken": 50.74,
        "cashPurchases": 0.00,
        "cardTaken": 201.77,
        "categoryBreakdown": {
            "alcohol": 48.80,
            "tobacco": 31.83,
            "lottery": 20.82,
            "drinks": 3.59,
            "groceries": 106.33,
            "household": 0.00,
            "snacks": 22.73,
            "paypoint": 0,
            "news": 0,
            "other": 18.41
        },
        "id": "2025-12-28",
        "timestamp": new Date().toISOString()
    },
    {
        "date": "2025-12-27",
        "dayOfWeek": "Saturday",
        "totalSales": 306.98,
        "cashTaken": 109.37,
        "cashPurchases": 0.00,
        "cardTaken": 197.61,
        "categoryBreakdown": {
            "alcohol": 67.70,
            "tobacco": 111.62,
            "lottery": 10.87,
            "drinks": 43.18,
            "groceries": 51.58,
            "household": 0.69,
            "snacks": 16.63,
            "paypoint": 0,
            "news": 0,
            "other": 4.71
        },
        "id": "2025-12-27",
        "timestamp": new Date().toISOString()
    }
];

async function importData() {
    console.log(`Starting import for user: ${USER_ID}`);
    const batch = writeBatch(db);

    data.forEach(record => {
        const ref = doc(db, 'shops', USER_ID, 'daily_sales', record.id);
        batch.set(ref, record);
        console.log(`Queueing: ${record.date} - £${record.totalSales}`);
    });

    try {
        await batch.commit();
        console.log("Batch commit successful! Database updated.");
    } catch (error) {
        console.error("Batch commit failed:", error);
    }
    process.exit();
}

importData();
