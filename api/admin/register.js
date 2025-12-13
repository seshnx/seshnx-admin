import { verifyAdmin, getAuthDb } from './initAdmin.js';
import admin from 'firebase-admin';

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
    const { email, password, role, inviteCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields: email, password' });
    }

    // For testing: allow registration without auth
    // For production: verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    const isPublicRegistration = !token; // TEMP: Allow public registration for testing

    if (!isPublicRegistration) {
      const adminUser = await verifyAdmin(token);
      if (!adminUser) {
        return res.status(403).json({ error: 'Forbidden: Not an administrator' });
      }
    }

    // Get auth instance (from auth project)
    const { getAuth } = await import('./initAdmin.js');
    const auth = getAuth();
    
    if (!auth) {
      return res.status(500).json({ error: 'Admin SDK not properly initialized' });
    }

    // Create user in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw error;
    }

    // Create admin record in auth project Firestore
    const authDb = getAuthDb();
    if (authDb) {
      const defaultRole = role || 'GAdmin'; // Default to GAdmin for temp accounts

      await authDb.collection('admins').doc(userRecord.uid).set({
        email: userRecord.email,
        role: defaultRole,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: isPublicRegistration ? 'self-registration' : 'admin',
        status: 'active'
      });
    }

    return res.status(201).json({
      success: true,
      userId: userRecord.uid,
      email: userRecord.email,
      role: role || 'GAdmin'
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

