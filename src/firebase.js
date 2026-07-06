import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTeQuNjf8azsMAydE69EOR47eEj8SL-oI",
  authDomain: "cskahoot.firebaseapp.com",
  projectId: "cskahoot",
  storageBucket: "cskahoot.firebasestorage.app",
  messagingSenderId: "1077000631781",
  appId: "1:1077000631781:web:96ace36d07537eab532b0c",
  measurementId: "G-D7HPRRMKJD"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);