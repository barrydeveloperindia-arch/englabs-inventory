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
const targetName = "GENERIC Trs Black Eye Beans 500G";

async function checkSpecificItem() {
    console.log(`Checking inventory for: ${targetName}...`);
    try {
        const inventoryRef = collection(db, 'shops', userId, 'inventory');
        // We try to match the exact name
        const q = query(inventoryRef, where("name", "==", targetName));

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.log(`❌ Item '${targetName}' not found.`);

            // Fallback: Try a looser search or just list items containing 'Beans'
            console.log("Attempting looser search for 'Black Eye Beans'...");
            const allDocs = await getDocs(inventoryRef);
            let found = false;
            allDocs.forEach(doc => {
                const d = doc.data();
                if (d.name && d.name.toLowerCase().includes("black eye beans")) {
                    console.log("MATCH FOUND:");
                    console.log(`Name: ${d.name}`);
                    console.log(`Stock: ${d.stock}`);
                    console.log(`Barcode: ${d.barcode}`);
                    found = true;
                }
            });
            if (!found) console.log("No partial matches found either.");

            return;
        }

        console.log(`✅ Found ${snapshot.size} matches:`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nID: ${doc.id}`);
            console.log(`Name: ${data.name}`);
            console.log(`Stock: ${data.stock}`);
            console.log(`Barcode: ${data.barcode}`);
            console.log(`Updated At: ${data.updatedAt}`);
        });
    } catch (error) {
        console.error("Error fetching inventory:", error);
    }
}

checkSpecificItem();
