
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
const dbDefault = getFirestore(app); // (default)

async function checkAuthDefault() {
    try {
        console.log("🔐 Authenticating...");
        const userCred = await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated! UID:", userCred.user.uid);

        const shopId = "hop-in-express-";

        console.log(`\n🔍 Checking shop doc in (default) DB: shops/${shopId}`);
        try {
            const shopRef = doc(dbDefault, 'shops', shopId);
            const snap = await getDoc(shopRef);
            if (snap.exists()) {
                console.log("✅ Found Shop Doc in (default)!");
            } else {
                console.log("❌ Shop Doc NOT FOUND in (default).");
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR for shop doc in (default):", e.message);
        }

        console.log(`\n🔍 Checking users collection in (default) DB: users/${userCred.user.uid}`);
        try {
            const userRef = doc(dbDefault, 'users', userCred.user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                console.log("✅ Found User Doc in (default)!");
                console.log("Data:", JSON.stringify(snap.data(), null, 2));
            } else {
                console.log("❌ User Doc NOT FOUND in (default).");
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR for user doc in (default):", e.message);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

checkAuthDefault();
