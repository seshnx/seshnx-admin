import { verifyAdmin, getDb } from './initAdmin.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify admin authorization (SuperAdmin required for settings)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const adminUser = await verifyAdmin(token);
    if (!adminUser || !adminUser.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden: SuperAdmin access required' });
    }

    const db = getDb();
    const SETTINGS_DOC_ID = 'platform_settings';

    if (req.method === 'GET') {
      // Fetch platform settings
      const settingsRef = db.collection('platform').doc(SETTINGS_DOC_ID);
      const settingsDoc = await settingsRef.get();

      if (settingsDoc.exists) {
        return res.status(200).json({ settings: settingsDoc.data() });
      } else {
        // Return default settings
        return res.status(200).json({
          settings: {
            maintenanceMode: false,
            registrationEnabled: true,
            inviteRequired: false,
            maxSchoolsPerAdmin: 10,
            defaultRequiredHours: 100,
            platformName: 'SeshNx',
            supportEmail: 'support@seshnx.com',
            announcementTitle: '',
            announcementMessage: '',
            announcementActive: false
          }
        });
      }
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      // Update platform settings
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({ error: 'Missing required field: settings' });
      }

      const settingsRef = db.collection('platform').doc(SETTINGS_DOC_ID);
      await settingsRef.set(settings, { merge: true });

      return res.status(200).json({
        success: true,
        settings: settings
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

