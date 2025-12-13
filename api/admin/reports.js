import { verifyAdmin, getDb } from './initAdmin.js';

const APP_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'seshnx-db';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      // Fetch all reports/support tickets
      const reportsRef = db.collection(`artifacts/${APP_ID}/public/data/service_requests`);
      const snapshot = await reportsRef.orderBy('timestamp', 'desc').limit(100).get();
      
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));

      return res.status(200).json({ reports });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update report status
      const { reportId, status } = req.body;

      if (!reportId || !status) {
        return res.status(400).json({ error: 'Missing required fields: reportId, status' });
      }

      const reportRef = db.doc(`artifacts/${APP_ID}/public/data/service_requests/${reportId}`);
      await reportRef.update({ status: status });

      return res.status(200).json({
        success: true,
        message: 'Report updated successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Reports API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

