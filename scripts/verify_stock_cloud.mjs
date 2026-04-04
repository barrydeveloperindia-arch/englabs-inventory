import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732",
    measurementId: "G-SY6450KXL9",
    databaseId: "englabs1"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, "englabs1");

const userId = "Wpz9qUwDRhbKJljmjs5YfI9JhMN2";
const targetBarcode = "5017689000332";

async function checkStock() {
    console.log(`Checking inventory for Barcode: ${targetBarcode}...`);
    try {
        const inventoryRef = collection(db, 'shops', userId, 'inventory');
        const q = query(inventoryRef, where("barcode", "==", targetBarcode));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            snapshot.forEach(d => {
                const data = d.data();
                console.log(`✅ MATCH FOUND in Cloud DB:`);
                console.log(`Name: ${data.name}`);
                console.log(`Stock: ${data.stock}`);
                console.log(`ID: ${d.id}`);
            });
        } else {
            console.log("❌ Item NOT found in Cloud DB.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

checkStock();
