import { verifyAdmin, getDb } from './initAdmin.js';
import admin from 'firebase-admin';

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
      // Fetch all schools
      const schoolsRef = db.collection('schools');
      const snapshot = await schoolsRef.orderBy('createdAt', 'desc').get();
      
      const schools = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json({ schools });
    }

    if (req.method === 'POST') {
      // Create new school (only SuperAdmin/GAdmin can do this)
      const { name, address, primaryColor, requiredHours } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing required field: name' });
      }

      const schoolData = {
        name,
        address: address || '',
        primaryColor: primaryColor || '#4f46e5',
        requiredHours: requiredHours || 100,
        admins: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const schoolRef = await db.collection('schools').add(schoolData);
      const schoolId = schoolRef.id;

      // Create default Admin role for the school
      await db.collection(`schools/${schoolId}/roles`).add({
        name: 'Admin',
        color: '#dc2626',
        permissions: []
      });

      return res.status(201).json({ 
        success: true,
        schoolId,
        school: { id: schoolId, ...schoolData }
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update school
      const { schoolId, name, address, primaryColor, requiredHours } = req.body;

      if (!schoolId) {
        return res.status(400).json({ error: 'Missing required field: schoolId' });
      }

      const schoolRef = db.doc(`schools/${schoolId}`);
      const updateData = {};

      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
      if (requiredHours !== undefined) updateData.requiredHours = requiredHours;

      await schoolRef.update(updateData);

      const updatedDoc = await schoolRef.get();
      return res.status(200).json({ 
        success: true,
        school: { id: schoolId, ...updatedDoc.data() }
      });
    }

    if (req.method === 'DELETE') {
      // Delete school
      const { schoolId } = req.query;

      if (!schoolId) {
        return res.status(400).json({ error: 'Missing required parameter: schoolId' });
      }

      await db.doc(`schools/${schoolId}`).delete();

      return res.status(200).json({ 
        success: true,
        message: 'School deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

