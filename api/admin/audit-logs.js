import { verifyAdmin, getDb } from './initAdmin.js';
import admin from 'firebase-admin';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      // Fetch audit logs
      const { type, limit = 100 } = req.query;
      
      let logsRef = db.collection('audit_logs').orderBy('timestamp', 'desc').limit(parseInt(limit));

      if (type && type !== 'all') {
        logsRef = logsRef.where('action', '==', type);
      }

      const snapshot = await logsRef.get();
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      }));

      return res.status(200).json({ logs });
    }

    if (req.method === 'POST') {
      // Create audit log entry (called by other API routes)
      // This is typically called internally, not from client
      const { action, userId, target, details, ip } = req.body;

      if (!action || !userId) {
        return res.status(400).json({ error: 'Missing required fields: action, userId' });
      }

      const logData = {
        action,
        user: userId,
        target: target || '',
        details: details || '',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: ip || ''
      };

      await db.collection('audit_logs').add(logData);

      return res.status(201).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Audit Logs API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

