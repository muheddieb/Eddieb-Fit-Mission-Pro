import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const env = (import.meta as any).env || {};

// Read all Firebase settings from environment variables with fallback to config json (Vercel & AI Studio support)
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (firebaseConfigJson as any).apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfigJson as any).authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || (firebaseConfigJson as any).projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfigJson as any).storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfigJson as any).messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || (firebaseConfigJson as any).appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || (firebaseConfigJson as any).measurementId,
};

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, (firebaseConfigJson as any).firestoreDatabaseId || undefined);

export default app;
