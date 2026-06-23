import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAOfsqc_kW7IqMeYVFK1ahNr0Ie7ZUV_dQ",
  authDomain: "hemoconnect-9a804.firebaseapp.com",
  projectId: "hemoconnect-9a804",
  storageBucket: "hemoconnect-9a804.firebasestorage.app",
  messagingSenderId: "101048440601",
  appId: "1:101048440601:web:f97f6059ece17068435788",
  measurementId: "G-8S7KJ61DTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Analytics (only works in browser environments)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
