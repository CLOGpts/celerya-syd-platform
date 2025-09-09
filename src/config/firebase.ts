import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAc-Fp6WWB8c7d1TPSlJiFvVVwxSPHo3E",
  authDomain: "adept-presence-464522-s3.firebaseapp.com",
  projectId: "adept-presence-464522-s3",
  storageBucket: "adept-presence-464522-s3.firebasestorage.app",
  messagingSenderId: "325094546058",
  appId: "1:325094546058:web:74cdcd05fcb98b24752b73"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;