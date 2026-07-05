import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Config from /firebase-applet-config.json
const firebaseConfig = {
  projectId: "cellular-pact-fn50x",
  appId: "1:528056156084:web:83426cfe783f61e9523ce1",
  apiKey: "AIzaSyD7Io6sHtRRFvuB2v3vfNHbuBtR1OcwpZw",
  authDomain: "cellular-pact-fn50x.firebaseapp.com",
  // Note: Firestore custom database ID
  firestoreDatabaseId: "ai-studio-resumebuilder-8011cec2-e19b-4bae-994f-5dcceef11373",
  storageBucket: "cellular-pact-fn50x.firebasestorage.app",
  messagingSenderId: "528056156084"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
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
