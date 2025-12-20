// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHpC9Gauv-LCPXBSKfrkmGcT_2sxvEUv0",
  authDomain: "indra-164b4.firebaseapp.com",
  projectId: "indra-164b4",
  storageBucket: "indra-164b4.firebasestorage.app",
  messagingSenderId: "78205962426",
  appId: "1:78205962426:web:62005752d29c47dbc45a83",
  measurementId: "G-LCV99K9VF9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

//npm install firebase

