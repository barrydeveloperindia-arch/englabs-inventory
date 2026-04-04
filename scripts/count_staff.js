
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, initializeFirestore, memoryLocalCache } from "firebase/firestore";

// Config from .env.local
const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

// Initialize
const app = initializeApp(firebaseConfig);
// Explicitly connect to the named database (second instance of Firestore if needed)
const db = initializeFirestore(app, {
    localCache: memoryLocalCache(), // Use memory cache for script
}, "englabs1");

const USER_ID = "hop-in-express-";
const COLLECTION_GROUP = "shops";
const SUB_COLLECTION = "staff";

async function countStaff() {
    console.log(`\n🔍 Connecting to Firestore Project: ${firebaseConfig.projectId}`);
    console.log(`🗄️  Target Database ID: englabs1`);

    // Construct Path
    const path = `${COLLECTION_GROUP}/${USER_ID}/${SUB_COLLECTION}`;
    console.log(`📂 Target Collection Path: ${path}`);

    try {
        const staffRef = collection(db, COLLECTION_GROUP, USER_ID, SUB_COLLECTION);
        const snapshot = await getDocs(staffRef);

        console.log(`\n✅ Query Successful!`);
        console.log(`📊 Total Staff Members Found: ${snapshot.size}`);

        if (snapshot.size > 0) {
            console.log("\n📋 Staff Directory:");
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   - [${data.role}] ${data.name} (${data.email || 'No Email'})`);
            });
        } else {
            console.log("\n⚠️  No staff records found in this collection.");
        }
    } catch (error) {
        console.error("❌ Error querying database:", error.message);
    }
    process.exit();
}

countStaff();
