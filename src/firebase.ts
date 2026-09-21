import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Config from /firebase-applet-config.json
const firebaseConfig = {
  projectId: "cellular-pact-fn50x",
  appId: "1:528056156084:web:83426cfe783f61e9523ce1",
  apiKey: "AIzaSyD7Io6sHtRRFvuB2v3vfNHbuBtR1OcwpZw",
  authDomain: "cellular-pact-fn50x.firebaseapp.com",
  // Named Firestore custom database ID
  firestoreDatabaseId: "ai-studio-resumebuilder-8011cec2-e19b-4bae-994f-5dcceef11373",
  storageBucket: "cellular-pact-fn50x.firebasestorage.app",
  messagingSenderId: "528056156084",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Explicitly resolve the declared named database if configured, with safe fallback to default
let firestoreInstance: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    console.log(`Firestore initialized with named database: ${firebaseConfig.firestoreDatabaseId}`);
  } else {
    firestoreInstance = getFirestore(app);
    console.log("Firestore initialized with default database.");
  }
} catch (dbErr) {
  console.warn("Failed to connect to declared named database, falling back to default:", dbErr);
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;
export const googleProvider = new GoogleAuthProvider();

// Custom sign in helper using popup
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out helper
export const logOut = async () => {
  await signOut(auth);
};

// Retrieve current Firebase ID token for authenticated backend API requests
export const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch {
    return null;
  }
};
