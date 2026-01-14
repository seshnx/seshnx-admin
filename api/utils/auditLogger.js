import { query } from '../../src/config/neon.js';

/**
 * Log an admin action to the audit log table
 * @param {Object} admin - Admin user object
 * @param {string} action - Action performed (e.g., 'user.banned', 'post.deleted')
 * @param {Object} target - Target object
 * @param {string} reason - Reason for action (optional)
 * @returns {Promise<Object>} Created audit log entry
 */
export async function logAuditAction(admin, action, target = {}, reason = null) {
  try {
    const sql = `
      INSERT INTO admin_audit_log (
        admin_id,
        admin_email,
        action,
        target_type,
        target_id,
        old_values,
        new_values,
        reason,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await query(sql, [
      admin.id,
      admin.email,
      action,
      target.type || null,
      target.id || null,
      target.oldValues ? JSON.stringify(target.oldValues) : null,
      target.newValues ? JSON.stringify(target.newValues) : null,
      reason || null,
      admin.ip || null,
      admin.userAgent || null
    ]);

    return result[0];
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw - audit logging shouldn't break the main operation
    return null;
  }
}

/**
 * Get audit log entries with filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit log entries
 */
export async function getAuditLog(options = {}) {
  const {
    limit = 100,
    offset = 0,
    adminId = null,
    action = null,
    targetType = null,
    startDate = null,
    endDate = null
  } = options;

  let sql = `
    SELECT
      al.*,
      cu.username,
      cu.first_name,
      cu.last_name
    FROM admin_audit_log al
    LEFT JOIN clerk_users cu ON cu.id = al.admin_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (adminId) {
    sql += ` AND al.admin_id = $${paramIndex}`;
    params.push(adminId);
    paramIndex++;
  }

  if (action) {
    sql += ` AND al.action = $${paramIndex}`;
    params.push(action);
    paramIndex++;
  }

  if (targetType) {
    sql += ` AND al.target_type = $${paramIndex}`;
    params.push(targetType);
    paramIndex++;
  }

  if (startDate) {
    sql += ` AND al.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND al.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  sql += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return await query(sql, params);
}

/**
 * Get audit log statistics
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Audit statistics
 */
export async function getAuditStats(options = {}) {
  const { days = 30, adminId = null } = options;

  let sql = `
    SELECT
      COUNT(*) as total_actions,
      COUNT(DISTINCT admin_id) as active_admins,
      COUNT(*) FILTER (WHERE action LIKE '%ban%' OR action LIKE '%delete%') as destructive_actions,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_actions
    FROM admin_audit_log
    WHERE 1=1
  `;

  const params = [days];

  if (adminId) {
    sql += ` AND admin_id = $2`;
    params.push(adminId);
  }

  return await query(sql, params);
}

/**
 * Helper to extract admin info from request
 * @param {Object} req - Request object
 * @returns {Object} Admin info
 */
export function extractAdminInfo(req) {
  return {
    id: req.admin?.id,
    email: req.admin?.email,
    ip: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || req.socket?.remoteAddress,
    userAgent: req.headers?.['user-agent']
  };
}

/**
 * Middleware to automatically log actions
 * @param {string} action - Action to log
 * @returns {Function} Middleware function
 */
export function auditLog(action) {
  return (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;

    // Override res.end to log after response
    res.end = function(...args) {
      // Only log successful operations (2xx and 3xx status codes)
      if (res.statusCode < 400 && req.admin) {
        const adminInfo = extractAdminInfo(req);

        logAuditAction(
          adminInfo,
          action,
          {
            type: req.params?.type || 'unknown',
            id: req.params?.id || req.body?.id || req.body?.userId
          },
          req.body?.reason
        ).catch(err => console.error('Audit log error:', err));
      }

      // Call original end
      originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Predefined action types for common admin operations
 */
export const AuditActions = {
  // User actions
  USER_BANNED: 'user.banned',
  USER_UNBANNED: 'user.unbanned',
  USER_DELETED: 'user.deleted',
  USER_ROLE_GRANTED: 'user.role_granted',
  USER_ROLE_REVOKED: 'user.role_revoked',
  USER_UPDATED: 'user.updated',

  // Content actions
  POST_DELETED: 'post.deleted',
  POST_APPROVED: 'post.approved',
  COMMENT_DELETED: 'comment.deleted',
  COMMENT_APPROVED: 'comment.approved',

  // School actions
  SCHOOL_CREATED: 'school.created',
  SCHOOL_UPDATED: 'school.updated',
  SCHOOL_DELETED: 'school.deleted',

  // Student actions
  STUDENT_ENROLLED: 'student.enrolled',
  STUDENT_REMOVED: 'student.removed',
  STUDENT_UPDATED: 'student.updated',

  // Settings actions
  SETTING_UPDATED: 'setting.updated',
  FEATURE_FLAG_TOGGLED: 'feature_flag.toggled',

  // Invite actions
  INVITE_CREATED: 'invite.created',
  INVITE_DELETED: 'invite.deleted'
};
