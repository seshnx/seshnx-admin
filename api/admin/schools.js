import { verifyAdminAuth } from '../middleware/auth.js';
import * as neonQueries from '../utils/neonQueries.js';
import { logAuditAction, extractAdminInfo, AuditActions } from '../utils/auditLogger.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify admin authentication
    const authError = await verifyAdminAuth(req, res);
    if (authError) return authError;

    // GET: List all schools
    if (req.method === 'GET') {
      try {
        const schools = await neonQueries.getAllSchools();
        return res.status(200).json({ schools });
      } catch (error) {
        console.error('Error fetching schools:', error);
        return res.status(500).json({ error: 'Failed to fetch schools' });
      }
    }

    // POST: Create new school
    if (req.method === 'POST') {
      const { name, address, city, state, zip_code, phone, email, website,
             primary_color, secondary_color, logo_url, required_hours, description } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing required field: name' });
      }

      // Only SuperAdmin and GAdmin can create schools
      const canCreate = req.admin.roles.some(r => r === 'SuperAdmin' || r === 'GAdmin');
      if (!canCreate) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to create schools' });
      }

      try {
        const school = await neonQueries.createSchool({
          name,
          address,
          city,
          state,
          zip_code,
          phone,
          email,
          website,
          primary_color,
          secondary_color,
          logo_url,
          required_hours,
          description
        });

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          AuditActions.SCHOOL_CREATED,
          { type: 'school', id: school.id, newValues: school }
        );

        return res.status(201).json({
          success: true,
          schoolId: school.id,
          school
        });
      } catch (error) {
        console.error('Error creating school:', error);
        return res.status(500).json({ error: 'Failed to create school' });
      }
    }

    // PUT/PATCH: Update school
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { schoolId, ...updates } = req.body;

      if (!schoolId) {
        return res.status(400).json({ error: 'Missing required field: schoolId' });
      }

      // Check permissions
      const canUpdate = req.admin.roles.some(r =>
        r === 'SuperAdmin' || r === 'GAdmin' || r === 'EDUAdmin'
      );

      if (!canUpdate) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to update schools' });
      }

      try {
        // Get old values for audit log
        const oldSchool = await neonQueries.getSchoolById(schoolId);
        if (!oldSchool) {
          return res.status(404).json({ error: 'School not found' });
        }

        // Update school
        const updatedSchool = await neonQueries.updateSchool(schoolId, updates);

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          AuditActions.SCHOOL_UPDATED,
          { type: 'school', id: schoolId, oldValues: oldSchool, newValues: updatedSchool }
        );

        return res.status(200).json({
          success: true,
          school: updatedSchool
        });
      } catch (error) {
        console.error('Error updating school:', error);
        return res.status(500).json({ error: 'Failed to update school' });
      }
    }

    // DELETE: Delete school
    if (req.method === 'DELETE') {
      const { schoolId } = req.query;

      if (!schoolId) {
        return res.status(400).json({ error: 'Missing required parameter: schoolId' });
      }

      // Only SuperAdmin and GAdmin can delete schools
      const canDelete = req.admin.roles.some(r => r === 'SuperAdmin' || r === 'GAdmin');
      if (!canDelete) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions to delete schools' });
      }

      try {
        const deletedSchool = await neonQueries.deleteSchool(schoolId);

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          AuditActions.SCHOOL_DELETED,
          { type: 'school', id: schoolId, oldValues: deletedSchool }
        );

        return res.status(200).json({
          success: true,
          message: 'School deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting school:', error);
        return res.status(500).json({ error: 'Failed to delete school' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

