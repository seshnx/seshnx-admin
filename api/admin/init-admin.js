import { getAuthDb, getAuth } from './initAdmin.js';
import admin from 'firebase-admin';

/**
 * Initialize First Admin
 * 
 * This API route helps create the first admin in the auth project's Firestore.
 * Can be called manually or via script to bootstrap the admins collection.
 * 
 * Usage:
 * POST /api/admin/init-admin
 * Body: { email: "admin@example.com", role: "SuperAdmin" }
 * 
 * Note: User must already exist in Firebase Auth (create via Firebase Console or register API first)
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, uid, role = 'GAdmin' } = req.body;

    if (!email && !uid) {
      return res.status(400).json({ error: 'Missing required field: email or uid' });
    }

    const authDb = getAuthDb();
    const auth = getAuth();

    if (!authDb || !auth) {
      return res.status(500).json({ error: 'Admin SDK not properly initialized' });
    }

    let userUid = uid;

    // If email provided, look up user by email
    if (!userUid && email) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        userUid = userRecord.uid;
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          return res.status(404).json({ 
            error: 'User not found. Create the user in Firebase Auth first, or use the register API.',
            hint: 'Use POST /api/admin/register to create user and admin record together'
          });
        }
        throw error;
      }
    }

    // Create or update admin record
    await authDb.collection('admins').doc(userUid).set({
      email: email || 'unknown@example.com',
      role: role,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'init-admin-api',
      status: 'active'
    }, { merge: true });

    return res.status(200).json({
      success: true,
      message: 'Admin record created successfully',
      userId: userUid,
      role: role
    });
  } catch (error) {
    console.error('Init Admin API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

