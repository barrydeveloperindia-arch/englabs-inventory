import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const dbIdEnv = 'englabs1';
const db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
}, dbIdEnv);

const shopId = 'hop-in-express-';

async function dumpStaff() {
    console.log("🔍 Dumping Staff Records...");
    try {
        const staffRef = collection(db, 'shops', shopId, 'staff');
        const snapshot = await getDocs(staffRef);

        snapshot.forEach(doc => {
            console.log(JSON.stringify({ id: doc.id, ...doc.data() }));
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

dumpStaff();
