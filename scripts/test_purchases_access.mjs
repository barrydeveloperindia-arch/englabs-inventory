
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const dbDev = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs-dev");
const dbProd = initializeFirestore(app, { experimentalForceLongPolling: true }, "englabs1");

async function test(db, dbName, shopId) {
    console.log(`Testing ${dbName} / ${shopId}...`);
    try {
        const snap = await getDocs(collection(db, 'shops', shopId, 'purchases'));
        console.log(`  ✅ Success! Found ${snap.size} purchases.`);
    } catch (e) {
        console.error(`  ❌ Error: ${e.message}`);
    }
}

async function main() {
    await test(dbProd, "Prod", "hop-in-express-");
    await test(dbDev, "Dev", "hop-in-express-dev-");
    process.exit(0);
}

main();
