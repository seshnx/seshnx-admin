import admin from 'firebase-admin';

// Initialize Admin SDK for both Firebase projects
let authApp = null;
let dbApp = null;
let authDb = null;
let dbDb = null;
let authAuth = null;
let dbAuth = null;

function initializeAdmin() {
  // Check if already initialized
  try {
    if (admin.apps.length > 0) {
      try {
        authApp = admin.app('auth-project');
        authDb = admin.firestore(authApp);
        authAuth = admin.auth(authApp);
      } catch (e) {
        // Auth project not initialized, will initialize below
      }
      try {
        dbApp = admin.app('db-project') || admin.app();
        dbDb = admin.firestore(dbApp);
        dbAuth = admin.auth(dbApp);
      } catch (e) {
        // DB project not initialized, will initialize below
      }
      if (authApp && dbApp) {
        return { authApp, dbApp, authDb, dbDb, authAuth, dbAuth };
      }
    }
  } catch (e) {
    // Continue to initialization
  }

  try {
    // Auth Project Service Account (seshnx-admin-auth)
    let authServiceAccount = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_AUTH) {
      try {
        authServiceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT_AUTH === 'string'
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_AUTH)
          : process.env.FIREBASE_SERVICE_ACCOUNT_AUTH;
      } catch (parseError) {
        console.warn('Error parsing auth service account JSON, will use db service account:', parseError);
      }
    }

    // Database Project Service Account (seshnx-db)
    let dbServiceAccount = null;
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_DB) {
        dbServiceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT_DB === 'string'
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_DB)
          : process.env.FIREBASE_SERVICE_ACCOUNT_DB;
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        dbServiceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
          ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
          : process.env.FIREBASE_SERVICE_ACCOUNT;
      }
    } catch (parseError) {
      console.error('Error parsing service account JSON:', parseError);
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_DB or FIREBASE_SERVICE_ACCOUNT format');
    }

    // Initialize Database Project (primary)
    if (dbServiceAccount && dbServiceAccount.project_id) {
      dbApp = admin.initializeApp({
        credential: admin.credential.cert(dbServiceAccount),
        projectId: dbServiceAccount.project_id || 'seshnx-db'
      }, 'db-project');
      
      dbDb = admin.firestore(dbApp);
      dbAuth = admin.auth(dbApp);
    }

    // Initialize Auth Project (if separate service account provided)
    if (authServiceAccount && authServiceAccount.project_id) {
      authApp = admin.initializeApp({
        credential: admin.credential.cert(authServiceAccount),
        projectId: authServiceAccount.project_id || 'seshnx-admin-auth'
      }, 'auth-project');
      
      authDb = admin.firestore(authApp);
      authAuth = admin.auth(authApp);
    } else if (dbApp) {
      // Use same app for auth project if no separate service account
      authApp = dbApp;
      authDb = dbDb;
      authAuth = dbAuth;
    }

    return { authApp, dbApp, authDb, dbDb, authAuth, dbAuth };
  } catch (error) {
    console.error('Error initializing Admin SDK:', error);
    throw error;
  }
}

// Verify admin user from auth project
export async function verifyAdmin(token) {
  const initialized = initializeAdmin();
  const authDbInstance = initialized.authDb;
  const authAuthInstance = initialized.authAuth;
  
  try {
    // Verify token (from auth project)
    const decodedToken = await authAuthInstance.verifyIdToken(token);
    
    // Check if user is admin in auth project
    if (authDbInstance) {
      const adminDoc = await authDbInstance
        .collection('admins')
        .doc(decodedToken.uid)
        .get();
      
      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        if (adminData.active !== false) {
          return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: adminData.role || 'GAdmin',
            isSuperAdmin: adminData.role === 'SuperAdmin',
            ...adminData
          };
        }
      }
    }

    // Fallback: Check master account from env vars
    const masterEmail = process.env.VITE_MASTER_ACCOUNT_EMAIL || process.env.MASTER_ACCOUNT_EMAIL;
    const masterUid = process.env.VITE_MASTER_ACCOUNT_UID || process.env.MASTER_ACCOUNT_UID;
    const backupUids = (process.env.VITE_BACKUP_ADMIN_UIDS || process.env.BACKUP_ADMIN_UIDS || '')
      .split(',')
      .map(u => u.trim())
      .filter(Boolean);

    if (
      (masterEmail && decodedToken.email === masterEmail) ||
      (masterUid && decodedToken.uid === masterUid) ||
      backupUids.includes(decodedToken.uid)
    ) {
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: 'SuperAdmin',
        isSuperAdmin: true
      };
    }

    return null; // Not an admin
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

// Get database Firestore instance
export function getDb() {
  const { dbDb } = initializeAdmin();
  return dbDb;
}

// Get auth project Firestore instance
export function getAuthDb() {
  const { authDb } = initializeAdmin();
  return authDb;
}

// Get auth instance for creating users
export function getAuth() {
  const { authAuth } = initializeAdmin();
  return authAuth;
}

// Initialize lazily - will be called on first use

