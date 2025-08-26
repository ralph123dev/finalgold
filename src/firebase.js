// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgETth1b2OxvI4bitwktJrcIg-kPHaEbg",
  authDomain: "goldin-85ffc.firebaseapp.com",
  projectId: "goldin-85ffc",
  storageBucket: "goldin-85ffc.firebasestorage.app",
  messagingSenderId: "196306206186",
  appId: "1:196306206186:web:05ce070c048a71226fc693",
  measurementId: "G-C0QYXGY1ZX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialiser Firestore et Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Exporter les instances
export { db, storage };