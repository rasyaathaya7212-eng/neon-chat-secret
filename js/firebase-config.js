// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your web app's Firebase configuration
// REPLACE WITH YOUR FIREBASE CONFIG KEYS
const firebaseConfig = {
    apiKey: "AIzaSyDCE8go7ue7mkyaOhiw-MSWlp6sl0Vr7kA",
  authDomain: "chat-secret-92fbb.firebaseapp.com",
  projectId: "chat-secret-92fbb",
  storageBucket: "chat-secret-92fbb.firebasestorage.app",
  messagingSenderId: "446730854694",
  appId: "1:446730854694:web:217b78e5f60812607be1e7",
  measurementId: "G-DS5W6X5EHN"
};

// SAFETY CHECK: Warn user if keys are missing
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    alert("CRITICAL ERROR: Firebase Configuration is missing!\n\nPlease open 'js/firebase-config.js' and paste your actual Firebase keys.");
    console.error("Firebase keys are missing. App will not work.");
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
