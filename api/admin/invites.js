import { verifyAdmin, getDb, getAuth } from './initAdmin.js';
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
      // Fetch all invites
      const invitesRef = db.collection('invites');
      const snapshot = await invitesRef.orderBy('createdAt', 'desc').get();
      
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));

      return res.status(200).json({ invites });
    }

    if (req.method === 'POST') {
      // Generate new invite
      const { role = 'GAdmin' } = req.body;

      const inviteCode = 'ADM-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      await db.collection('invites').doc(inviteCode).set({
        code: inviteCode,
        createdBy: adminUser.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        used: false,
        role: role
      });

      return res.status(201).json({
        success: true,
        invite: {
          id: inviteCode,
          code: inviteCode,
          role: role
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Invites API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

