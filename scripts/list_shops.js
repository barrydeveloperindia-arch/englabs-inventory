
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
}, "englabs1");

async function listShops() {
    try {
        console.log(`\n🔍 Listing Shop IDs in englabs1 database...`);
        const shopsRef = collection(db, 'shops');
        const snapshot = await getDocs(shopsRef);
        snapshot.forEach(doc => {
            console.log(`   - Shop ID: ${doc.id}`);
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

listShops();
