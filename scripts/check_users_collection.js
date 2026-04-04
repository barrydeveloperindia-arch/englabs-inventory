
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

async function checkUsers() {
    try {
        console.log("🔐 Authenticating...");
        const userCred = await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated! UID:", userCred.user.uid);

        console.log(`\n🔍 Checking users collection in englabs1...`);
        try {
            const userRef = doc(db, 'users', userCred.user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                console.log("✅ Found User Doc!");
                console.log("Data:", JSON.stringify(snap.data(), null, 2));
            } else {
                console.log("❌ User Doc NOT FOUND in users collection.");

                // Try to list first doc in users just to see if collection exists
                const usersCol = collection(db, 'users');
                const listSnap = await getDocs(query(usersCol, limit(1)));
                if (!listSnap.empty) {
                    console.log("ℹ️ users collection exists, but your UID is not there.");
                } else {
                    console.log("❌ users collection is EMPTY or MISSING.");
                }
            }
        } catch (e) {
            console.log("❌ PERMISSION ERROR for users collection:", e.message);
        }
    } catch (error) {
        console.error("❌ Big Error:", error.message);
    }
    process.exit();
}

checkUsers();
