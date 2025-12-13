import { verifyAdmin, getDb } from './initAdmin.js';

const APP_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'seshnx-db';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify admin authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const adminUser = await verifyAdmin(token);
    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden: Not an administrator' });
    }

    const db = getDb();

    if (req.method === 'GET') {
      // Fetch users
      try {
        // Try public profiles collection first
        const profilesRef = db.collection(`artifacts/${APP_ID}/public/data/profiles`);
        const snapshot = await profilesRef.limit(100).get();
        
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          profilePath: `artifacts/${APP_ID}/users/${doc.id}/profiles/main`,
          ...doc.data()
        }));

        return res.status(200).json({ users });
      } catch (error) {
        // Fallback: Use collectionGroup query
        const profilesRef = db.collectionGroup('profiles');
        const snapshot = await profilesRef
          .where('__name__', '==', 'main')
          .limit(100)
          .get();

        const users = [];
        snapshot.docs.forEach(doc => {
          const pathParts = doc.ref.path.split('/');
          const userIdIndex = pathParts.indexOf('users');
          if (userIdIndex !== -1 && userIdIndex < pathParts.length - 1) {
            users.push({
              id: pathParts[userIdIndex + 1],
              profilePath: doc.ref.path,
              ...doc.data()
            });
          }
        });

        return res.status(200).json({ users });
      }
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update user role
      const { userId, profilePath, role, action } = req.body; // action: 'grant' or 'revoke'

      if (!userId || !profilePath || !role) {
        return res.status(400).json({ error: 'Missing required fields: userId, profilePath, role' });
      }

      // Only SuperAdmin can grant/revoke SuperAdmin role
      if (role === 'SuperAdmin' && !adminUser.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can manage SuperAdmin role' });
      }

      const profileRef = db.doc(profilePath);
      const profileDoc = await profileRef.get();

      if (!profileDoc.exists) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      const currentRoles = profileDoc.data().accountTypes || [];
      let newRoles;

      if (action === 'grant' || !action) {
        newRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];
      } else {
        // Revoke
        if (role === 'SuperAdmin' && userId === adminUser.uid) {
          // Prevent self-demotion unless GAdmin remains
          if (!currentRoles.includes('GAdmin')) {
            newRoles = currentRoles.filter(r => r !== 'SuperAdmin').concat('GAdmin');
          } else {
            newRoles = currentRoles.filter(r => r !== 'SuperAdmin');
          }
        } else {
          newRoles = currentRoles.filter(r => r !== role);
        }
      }

      await profileRef.update({ accountTypes: newRoles });

      return res.status(200).json({ 
        success: true,
        userId,
        accountTypes: newRoles
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

