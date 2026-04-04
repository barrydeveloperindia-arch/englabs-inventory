

/**
 * 🚨 CRITICAL CONFIGURATION 🚨
 * DO NOT CHANGE or REMOVE the 'dbId' or database connection settings without
 * EXPLICIT USER PERMISSION. Changing this will disconnect the live app from
 * the 'englabs1' database and cause data loss for users.
 */
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

// Replace these with your actual Firebase project config from the console
// Safe environment access for both Vite and Node environments
export const getEnv = (key: string): string | undefined => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

if (!firebaseConfig.projectId) {
  console.error("🔥 [Firebase] CRITICAL ERROR: VITE_FIREBASE_PROJECT_ID is undefined. Firebase will not function correctly.");
} else {
  console.log("🔥 [Firebase] Initializing for Project:", firebaseConfig.projectId);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence failed:", err));

// Using getFirestore with explicit Database ID to support multi-db projects
const mode = import.meta.env.MODE;
const defaultDb = mode === 'production' ? 'englabs1' : 'englabs-dev';
const dbId = getEnv('VITE_FIREBASE_DATABASE_ID') || defaultDb;
console.log("[Firebase] Initializing Firestore with DB ID:", dbId);

// Force explicit initialization for the named database to avoid default fallback
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Force long polling to ensure stability
  ignoreUndefinedProperties: true,
}, dbId);

import { getStorage } from "firebase/storage";
export const storage = getStorage(app);
