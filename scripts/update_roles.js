
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, updateDoc, initializeFirestore } from "firebase/firestore";
import xhr2 from "xhr2";

global.XMLHttpRequest = xhr2;

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const dbId = 'englabs1';
console.log(`Connecting to db: ${dbId}`);

const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
}, dbId);

const auth = getAuth(app);

const updateRoles = async () => {
    await signInAnonymously(auth);
    console.log("Signed in anonymously");

    const staffRef = collection(db, 'staff');
    const snapshot = await getDocs(staffRef);

    console.log(`Found ${snapshot.size} staff members.`);

    for (const docSnap of snapshot.docs) {
        const s = docSnap.data();
        // Check if name exists before processing
        if (!s.name) {
            console.log(`Skipping staff with ID ${docSnap.id}: No name field`);
            continue;
        }
        const name = s.name.toLowerCase();
        let newRole = s.role;
        let shouldUpdate = false;

        if (name.includes('salil') || name.includes('bharat')) {
            if (s.role !== 'Owner') {
                newRole = 'Owner';
                shouldUpdate = true;
            }
        } else if (name.includes('gaurav')) {
            if (s.role !== 'Manager') {
                newRole = 'Manager';
                shouldUpdate = true;
            }
        } else {
            // Demote existing Owners/Managers who are NOT Salil/Bharat/Gaurav
            if (s.role === 'Owner' || s.role === 'Manager') {
                newRole = 'Inventory Staff';
                shouldUpdate = true;
            }
        }

        if (shouldUpdate) {
            console.log(`Updating ${s.name}: ${s.role} -> ${newRole}`);
            await updateDoc(doc(db, 'staff', docSnap.id), { role: newRole });
        } else {
            console.log(`Skipping ${s.name}: already ${s.role}`);
        }
    }
    console.log('Role update complete.');
    process.exit(0);
};

updateRoles().catch(err => {
    console.error(err);
    process.exit(1);
});
