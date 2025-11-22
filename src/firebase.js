import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Admin-specific Path Helpers
export const APP_ID = firebaseConfig.projectId;
export const COLLECTIONS = {
    USERS: `artifacts/${APP_ID}/users`, // Note: This requires collectionGroup queries often
    PROFILES: `artifacts/${APP_ID}/public/data/profiles`,
    POSTS: `artifacts/${APP_ID}/public/data/posts`,
    MARKET: `artifacts/${APP_ID}/public/data/market_items`,
    BOOKINGS: `artifacts/${APP_ID}/public/data/bookings`,
    REPORTS: `artifacts/${APP_ID}/public/data/service_requests`
};
