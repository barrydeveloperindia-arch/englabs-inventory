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
const targetBarcode = "5017689000332"; // TRS Black Eye Beans

async function checkItemByBarcode() {
    console.log(`Checking inventory for Barcode: ${targetBarcode}...`);
    try {
        const inventoryRef = collection(db, 'shops', userId, 'inventory');
        const q = query(inventoryRef, where("barcode", "==", targetBarcode));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`❌ No item found with barcode '${targetBarcode}'.`);
            return;
        }

        console.log(`✅ Found ${snapshot.size} matches:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Stock: ${data.stock}`);
            console.log(`Price: ${data.price}`);
            console.log(`Updated At: ${data.updatedAt}`);
        });
    } catch (error) {
        console.error("Error fetching inventory:", error);
    }
}

checkItemByBarcode();
