import { verifyAdminAuth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
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

    // GET: List users
    if (req.method === 'GET') {
      const { limit, offset, search, role, status } = req.query;

      try {
        const users = await neonQueries.getAllUsers({
          limit: parseInt(limit) || 100,
          offset: parseInt(offset) || 0,
          search: search || null,
          role: role || null,
          status: status || 'active'
        });

        return res.status(200).json({ users });
      } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
    }

    // PUT/PATCH: Update user
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { userId, role, action, schoolId } = req.body;

      // Handle school linking
      if (schoolId !== undefined) {
        // Check permissions
        const hasPermission = req.admin.roles.some(r =>
          r === 'SuperAdmin' || r === 'GAdmin' || r === 'EDUAdmin'
        );

        if (!hasPermission) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        try {
          await neonQueries.enrollStudent(userId, schoolId);

          // Log action
          await logAuditAction(
            extractAdminInfo(req),
            schoolId ? AuditActions.STUDENT_ENROLLED : AuditActions.STUDENT_REMOVED,
            { type: 'student', id: userId }
          );

          return res.status(200).json({
            success: true,
            userId,
            schoolId: schoolId || null
          });
        } catch (error) {
          console.error('Error updating school:', error);
          return res.status(500).json({ error: 'Failed to update school assignment' });
        }
      }

      // Handle role updates
      if (!userId || !role) {
        return res.status(400).json({ error: 'Missing required fields: userId, role' });
      }

      // Only SuperAdmin can grant/revoke SuperAdmin role
      if (role === 'SuperAdmin' && !req.admin.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can manage SuperAdmin role' });
      }

      // Prevent self-demotion from SuperAdmin unless keeping GAdmin
      if (role === 'SuperAdmin' && userId === req.admin.id && action === 'revoke') {
        const user = await neonQueries.getUserById(userId);
        if (!user.account_types.includes('GAdmin')) {
          return res.status(403).json({ error: 'Forbidden: Cannot remove your only admin role' });
        }
      }

      try {
        const updatedUser = await neonQueries.updateUserRole(userId, role, action || 'grant');

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          action === 'revoke' ? AuditActions.USER_ROLE_REVOKED : AuditActions.USER_ROLE_GRANTED,
          { type: 'user', id: userId, oldValues: { role }, newValues: { role, action } }
        );

        return res.status(200).json({
          success: true,
          userId,
          accountTypes: updatedUser.account_types
        });
      } catch (error) {
        console.error('Error updating user role:', error);
        return res.status(500).json({ error: 'Failed to update user role' });
      }
    }

    // DELETE: Delete user
    if (req.method === 'DELETE') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'Missing userId parameter' });
      }

      // Prevent self-deletion
      if (userId === req.admin.id) {
        return res.status(403).json({ error: 'Forbidden: Cannot delete your own account' });
      }

      // Only SuperAdmin can delete users
      if (!req.admin.isSuperAdmin) {
        return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can delete users' });
      }

      try {
        await neonQueries.hardDeleteUser(userId);

        // Log action
        await logAuditAction(
          extractAdminInfo(req),
          AuditActions.USER_DELETED,
          { type: 'user', id: userId }
        );

        return res.status(200).json({ success: true, userId });
      } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ error: 'Failed to delete user' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

