import { verifyAdmin, getDb } from './initAdmin.js';

const APP_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'seshnx-db';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify admin authorization (SuperAdmin required for user actions)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const adminUser = await verifyAdmin(token);
    if (!adminUser || !adminUser.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
    }

    const db = getDb();
    const { userId, action, profilePath } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'Missing required fields: userId, action' });
    }

    // Build profile path if not provided
    const userProfilePath = profilePath || `artifacts/${APP_ID}/users/${userId}/profiles/main`;

    if (action === 'ban') {
      const profileRef = db.doc(userProfilePath);
      await profileRef.update({ isBanned: true });

      return res.status(200).json({
        success: true,
        message: 'User banned successfully'
      });
    }

    if (action === 'unban') {
      const profileRef = db.doc(userProfilePath);
      await profileRef.update({ isBanned: false });

      return res.status(200).json({
        success: true,
        message: 'User unbanned successfully'
      });
    }

    if (action === 'delete') {
      // Note: This only deletes the profile document, not subcollections
      // For full deletion, a Cloud Function would be needed
      const profileRef = db.doc(userProfilePath);
      await profileRef.delete();

      return res.status(200).json({
        success: true,
        message: 'User profile deleted successfully (subcollections may remain)'
      });
    }

    return res.status(400).json({ error: 'Invalid action. Must be: ban, unban, or delete' });
  } catch (error) {
    console.error('User Actions API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

