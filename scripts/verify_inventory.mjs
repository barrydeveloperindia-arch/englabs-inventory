import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit, initializeFirestore } from "firebase/firestore";

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

async function checkInventory() {
    console.log(`Checking inventory for shop: ${userId}...`);
    try {
        const inventoryRef = collection(db, 'shops', userId, 'inventory');
        // Order by updated_at descending to see the very latest changes
        const q = query(inventoryRef, orderBy("updatedAt", "desc"), limit(5));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log("No inventory items found.");
            return;
        }

        console.log(`Found ${snapshot.size} recent items:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Stock: ${data.stock}`);
            console.log(`Updated At: ${data.updatedAt}`);
        });
    } catch (error) {
        console.error("Error fetching inventory:", error);
    }
}

checkInventory();
