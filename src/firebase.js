import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Auth Project Configuration (seshnx-admin-auth) - for authentication only
const authProjectConfig = {
  apiKey: "AIzaSyCOab4qaIkcSbZ7lnUdowtz70JHB6KIx9I",
  authDomain: "seshnx-admin-auth.firebaseapp.com",
  projectId: "seshnx-admin-auth",
  storageBucket: "seshnx-admin-auth.firebasestorage.app",
  messagingSenderId: "876734492148",
  appId: "1:876734492148:web:a80826de0ccce518e5dda1"
};

// Database Project Configuration (seshnx-db) - for data access
const dbProjectConfig = {
  apiKey: "AIzaSyCmGxvXX2D11Jo3NZlD0jO1vQpskaG0sCU",
  authDomain: "seshnx-db.firebaseapp.com",
  databaseURL: "https://seshnx-db-default-rtdb.firebaseio.com",
  projectId: "seshnx-db",
  storageBucket: "seshnx-db.firebasestorage.app",
  messagingSenderId: "718084970004",
  appId: "1:718084970004:web:d68ba48c5eb493af9db901"
};

// Initialize Auth Project (separate app instance named 'admin-auth')
let authApp;
const existingAuthApp = getApps().find(app => app.name === 'admin-auth');
if (!existingAuthApp) {
  authApp = initializeApp(authProjectConfig, 'admin-auth');
} else {
  authApp = existingAuthApp;
}

// Initialize Database Project (default app instance)
let dbApp;
const existingDbApp = getApps().find(app => app.name === '[DEFAULT]');
if (!existingDbApp) {
  dbApp = initializeApp(dbProjectConfig);
} else {
  dbApp = existingDbApp;
}

// Export auth from auth project, db from database project
export const auth = getAuth(authApp);
export const db = getFirestore(dbApp);

// Helper to get auth project's Firestore (for admin checks)
export const getAuthDb = () => {
  return getFirestore(authApp);
};

// Use database project's projectId for paths
export const APP_ID = dbProjectConfig.projectId;
export const COLLECTIONS = {
    USERS: `artifacts/${APP_ID}/users`,
    PROFILES: `artifacts/${APP_ID}/public/data/profiles`,
    POSTS: `artifacts/${APP_ID}/public/data/posts`,
    MARKET: `artifacts/${APP_ID}/public/data/market_items`,
    BOOKINGS: `artifacts/${APP_ID}/public/data/bookings`,
    REPORTS: `artifacts/${APP_ID}/public/data/service_requests`
};
