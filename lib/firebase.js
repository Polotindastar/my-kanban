import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDih-8Y6Rg8DeUYq5o7HOroRNvENneffJI",
  authDomain: "web-app-3ebe7.firebaseapp.com",
  projectId: "web-app-3ebe7",
  storageBucket: "web-app-3ebe7.firebasestorage.app",
  messagingSenderId: "1086590134263",
  appId: "1:1086590134263:web:6e2c8be38435918c9630f2",
  measurementId: "G-YK09BWELDE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();