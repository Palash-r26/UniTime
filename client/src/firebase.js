import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Note: Ensure you have a .env file in your client directory with these values
// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// etc.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const googleProvider = new GoogleAuthProvider();
// Permissions to view classes (roster for teachers, enrollment for students)
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');

export const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a a time.
    console.log("Persistence failed: Multiple tabs open");
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.log("Persistence failed: Not supported");
  }
});

export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);