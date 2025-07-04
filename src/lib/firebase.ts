import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA2aNmuGOStDibvAWMUDOceYbOnWMHosmE",
  authDomain: "coursecampus-b2c7a.firebaseapp.com",
  databaseURL: "https://coursecampus-b2c7a-default-rtdb.firebaseio.com",
  projectId: "coursecampus-b2c7a",
  storageBucket: "coursecampus-b2c7a.firebasestorage.app",
  messagingSenderId: "978236014348",
  appId: "1:978236014348:web:80462151ff8b9dce671329",
  measurementId: "G-YDZVV5X299"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
