
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, initializeFirestore } from "firebase/firestore";
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
const db = getFirestore(app); // DEFAULT DB

async function checkIds() {
    try {
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated!");

        const ids = ["hop-in-express", "hop-in-express-"];
        for (const id of ids) {
            console.log(`\n🔍 Checking Shop ID in (default) DB: ${id}`);
            try {
                const shopRef = doc(db, 'shops', id);
                const snap = await getDoc(shopRef);
                if (snap.exists()) {
                    console.log(`✅ FOUND Shop with ID: ${id}`);
                } else {
                    console.log(`❌ NOT FOUND: ${id}`);
                }
            } catch (e) {
                console.log(`❌ PERMISSION ERROR for ${id}:`, e.message);
            }
        }
    } catch (error) {
        console.error("❌ Auth Error:", error.message);
    }
    process.exit();
}

checkIds();
