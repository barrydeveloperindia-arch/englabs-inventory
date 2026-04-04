
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

async function inspectCollections() {
    try {
        console.log("🔐 Authenticating...");
        await signInWithEmailAndPassword(auth, "bharat@englabs.com", "Owner2026!");
        console.log("✅ Authenticated!");

        const shopId = "hop-in-express-";
        console.log(`\n📂 Inspecting Shop: ${shopId}`);

        const knownSubcollections = ["staff", "inventory", "attendance", "transactions", "ledger", "rota", "tasks"];

        for (const sub of knownSubcollections) {
            try {
                const colRef = collection(db, 'shops', shopId, sub);
                const snap = await getDocs(query(colRef, limit(1)));
                if (!snap.empty) {
                    console.log(`✅ FOUND subcollection: ${sub} (at least 1 doc)`);
                } else {
                    console.log(`❌ EMPTY or MISSING subcollection: ${sub}`);
                }
            } catch (e) {
                console.log(`❌ ERROR reading subcollection ${sub}:`, e.message);
            }
        }

        console.log(`\n📂 Inspecting Root:`);
        const rootCollections = ["staff", "users", "agentic_audits"];
        for (const root of rootCollections) {
            const colRef = collection(db, root);
            try {
                const snap = await getDocs(query(colRef, limit(1)));
                if (!snap.empty) {
                    console.log(`✅ FOUND root collection: ${root} (at least 1 doc)`);
                } else {
                    console.log(`❌ EMPTY or MISSING root collection: ${root}`);
                }
            } catch (e) {
                console.log(`❌ ERROR reading root collection ${root}:`, e.message);
            }
        }
    } catch (error) {
        console.error("❌ Big Error:", error.message);
    }
    process.exit();
}

inspectCollections();
