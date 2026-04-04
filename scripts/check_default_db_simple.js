
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs, limit, query } from "firebase/firestore";
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
const dbDefault = getFirestore(app);

async function checkDefault() {
    try {
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated!");

        console.log(`\n🔍 Checking (default) database...`);
        const shopId = "hop-in-express-";
        try {
            const shopRef = doc(dbDefault, 'shops', shopId);
            const snap = await getDoc(shopRef);
            if (snap.exists()) {
                console.log("✅ FOUND Shop Doc in (default)!");
            } else {
                console.log("❌ Shop Doc NOT FOUND in (default).");
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR in (default):", e.message);
        }
    } catch (error) {
        console.error("❌ Big Error:", error.message);
    }
    process.exit();
}

checkDefault();
