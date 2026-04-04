
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, initializeFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {}, "englabs1");

async function checkRootStaff() {
    try {
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated!");

        console.log(`\n🔍 Checking root staff collection...`);
        try {
            const staffCol = collection(db, 'staff');
            const snap = await getDocs(query(staffCol, limit(5)));
            if (!snap.empty) {
                console.log(`✅ FOUND ${snap.size} docs in root staff collection.`);
                snap.forEach(d => {
                    console.log(`ID: ${d.id}, Name: ${d.data().name}`);
                });
            } else {
                console.log("❌ root staff collection is EMPTY.");
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR for root staff:", e.message);
        }
    } catch (error) {
        console.error("❌ Big Error:", error.message);
    }
    process.exit();
}

checkRootStaff();
