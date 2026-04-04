
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

async function checkAuth() {
    try {
        console.log("🔐 Authenticating...");
        const userCred = await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated! UID:", userCred.user.uid);

        const shopId = "hop-in-express-";

        // Try reading own staff record
        console.log(`\n🔍 Checking own staff record: shops/${shopId}/staff/${userCred.user.uid}`);
        try {
            const staffRef = doc(db, 'shops', shopId, 'staff', userCred.user.uid);
            const snap = await getDoc(staffRef);
            if (snap.exists()) {
                console.log("✅ Found Staff Record!");
                console.log("Data:", JSON.stringify(snap.data(), null, 2));
            } else {
                console.log("❌ Staff Record NOT FOUND.");
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR for staff record:", e.message);
        }

        // Try reading the shop doc
        console.log(`\n🔍 Checking shop doc: shops/${shopId}`);
        try {
            const shopRef = doc(db, 'shops', shopId);
            const snap = await getDoc(shopRef);
            if (snap.exists()) {
                console.log("✅ Found Shop Doc!");
            } else {
                console.log("❌ Shop Doc NOT FOUND.");
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR for shop doc:", e.message);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

checkAuth();
