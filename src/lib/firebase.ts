import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA2aNmuGOStDibvAWMUDOceYbOnWMHosmE",
  authDomain: "coursecampus-b2c7a.firebaseapp.com",
  projectId: "coursecampus-b2c7a",
  storageBucket: "coursecampus-b2c7a.firebasestorage.app",
  messagingSenderId: "978236014348",
  appId: "1:978236014348:web:80462151ff8b9dce671329"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
