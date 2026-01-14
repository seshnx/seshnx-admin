import { query, queryOne } from '../../src/config/neon.js';

// ============================================================================
// USER MANAGEMENT QUERIES
// ============================================================================

/**
 * Get all users with pagination and optional filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of users
 */
export async function getAllUsers(options = {}) {
  const {
    limit = 100,
    offset = 0,
    search = null,
    role = null,
    status = 'active' // 'active' | 'banned' | 'all'
  } = options;

  let sql = `
    SELECT
      cu.id,
      cu.email,
      cu.username,
      cu.first_name,
      cu.last_name,
      cu.account_types,
      cu.active_role,
      cu.profile_photo_url,
      cu.created_at,
      cu.deleted_at,
      p.display_name,
      p.bio,
      p.location
    FROM clerk_users cu
    LEFT JOIN profiles p ON p.user_id = cu.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Filter by search (email, username, display name)
  if (search) {
    sql += ` AND (
      cu.email ILIKE $${paramIndex} OR
      cu.username ILIKE $${paramIndex} OR
      p.display_name ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Filter by role
  if (role) {
    sql += ` AND cu.account_types @> ARRAY[$${paramIndex}]::TEXT[]`;
    params.push(role);
    paramIndex++;
  }

  // Filter by status
  if (status === 'active') {
    sql += ` AND cu.deleted_at IS NULL`;
  } else if (status === 'banned') {
    sql += ` AND cu.deleted_at IS NOT NULL`;
  }

  sql += ` ORDER BY cu.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return await query(sql, params);
}

/**
 * Get user by ID with full profile
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
export async function getUserById(userId) {
  const sql = `
    SELECT
      cu.*,
      p.display_name,
      p.bio,
      p.location,
      p.photo_url as profile_photo,
      p.talent_info,
      p.engineer_info,
      p.producer_info,
      p.studio_info
    FROM clerk_users cu
    LEFT JOIN profiles p ON p.user_id = cu.id
    WHERE cu.id = $1
  `;

  return await queryOne(sql, [userId]);
}

/**
 * Update user roles (grant or revoke)
 * @param {string} userId - User ID
 * @param {string} role - Role to grant/revoke
 * @param {string} action - 'grant' | 'revoke'
 * @returns {Promise<Object>} Updated user
 */
export async function updateUserRole(userId, role, action) {
  const actionSql = action === 'grant'
    ? 'array_append(account_types, $1)'
    : 'array_remove(account_types, $1)';

  const sql = `
    UPDATE clerk_users
    SET account_types = ${actionSql},
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  return await queryOne(sql, [role, userId]);
}

/**
 * Ban user (soft delete)
 * @param {string} userId - User ID
 * @param {string} reason - Ban reason
 * @returns {Promise<Object>} Updated user
 */
export async function banUser(userId, reason = null) {
  const sql = `
    UPDATE clerk_users
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  const result = await queryOne(sql, [userId]);

  // Log ban reason in audit table if needed
  if (reason) {
    // This will be handled by the audit logger
  }

  return result;
}

/**
 * Unban user (restore)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
export async function unbanUser(userId) {
  const sql = `
    UPDATE clerk_users
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  return await queryOne(sql, [userId]);
}

/**
 * Hard delete user (permanent deletion)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export async function hardDeleteUser(userId) {
  const sql = `DELETE FROM clerk_users WHERE id = $1`;
  await query(sql, [userId]);
  return true;
}

// ============================================================================
// CONTENT MANAGEMENT QUERIES
// ============================================================================

/**
 * Get posts with filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of posts
 */
export async function getPosts(options = {}) {
  const {
    limit = 50,
    offset = 0,
    userId = null,
    status = 'all', // 'all' | 'flagged' | 'deleted'
    startDate = null,
    endDate = null
  } = options;

  let sql = `
    SELECT
      p.*,
      cu.username,
      cu.email,
      prof.display_name,
      prof.photo_url as author_photo
    FROM posts p
    JOIN clerk_users cu ON p.user_id = cu.id
    LEFT JOIN profiles prof ON prof.user_id = cu.id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  // Filter by user
  if (userId) {
    sql += ` AND p.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  // Filter by status
  if (status === 'flagged') {
    sql += ` AND p.flagged = true`;
  } else if (status === 'deleted') {
    sql += ` AND p.deleted_at IS NOT NULL`;
  } else if (status === 'active') {
    sql += ` AND p.deleted_at IS NULL`;
  }

  // Filter by date range
  if (startDate) {
    sql += ` AND p.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    sql += ` AND p.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return await query(sql, params);
}

/**
 * Get comments by post ID or with filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of comments
 */
export async function getComments(options = {}) {
  const {
    limit = 50,
    offset = 0,
    postId = null,
    status = 'all' // 'all' | 'flagged' | 'deleted'
  } = options;

  let sql = `
    SELECT
      c.*,
      cu.username,
      cu.email,
      prof.display_name,
      prof.photo_url as author_photo,
      p.content as post_content
    FROM comments c
    JOIN clerk_users cu ON c.user_id = cu.id
    LEFT JOIN profiles prof ON prof.user_id = cu.id
    LEFT JOIN posts p ON p.id = c.post_id
    WHERE 1=1
  `;

  const params = [];
  let paramIndex = 1;

  if (postId) {
    sql += ` AND c.post_id = $${paramIndex}`;
    params.push(postId);
    paramIndex++;
  }

  if (status === 'flagged') {
    sql += ` AND c.flagged = true`;
  } else if (status === 'deleted') {
    sql += ` AND c.deleted_at IS NOT NULL`;
  } else if (status === 'active') {
    sql += ` AND c.deleted_at IS NULL`;
  }

  sql += ` ORDER BY c.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  return await query(sql, params);
}

/**
 * Get all flagged content
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of flagged content
 */
export async function getFlaggedContent(options = {}) {
  const { limit = 50, offset = 0 } = options;

  // Get flagged posts
  const posts = await query(
    `SELECT
      p.id,
      p.content,
      p.created_at,
      'post' as content_type,
      cu.username,
      prof.display_name
    FROM posts p
    JOIN clerk_users cu ON p.user_id = cu.id
    LEFT JOIN profiles prof ON prof.user_id = cu.id
    WHERE p.flagged = true AND p.deleted_at IS NULL
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Get flagged comments
  const comments = await query(
    `SELECT
      c.id,
      c.content,
      c.created_at,
      'comment' as content_type,
      cu.username,
      prof.display_name
    FROM comments c
    JOIN clerk_users cu ON c.user_id = cu.id
    LEFT JOIN profiles prof ON prof.user_id = cu.id
    WHERE c.flagged = true AND c.deleted_at IS NULL
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return [...posts, ...comments];
}

/**
 * Delete post (soft delete)
 * @param {string} postId - Post ID
 * @param {string} deletedBy - Admin user ID who deleted it
 * @returns {Promise<Object>} Deleted post
 */
export async function deletePost(postId, deletedBy) {
  const sql = `
    UPDATE posts
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  return await queryOne(sql, [postId]);
}

/**
 * Delete comment (soft delete)
 * @param {string} commentId - Comment ID
 * @param {string} deletedBy - Admin user ID who deleted it
 * @returns {Promise<Object>} Deleted comment
 */
export async function deleteComment(commentId, deletedBy) {
  const sql = `
    UPDATE comments
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
  `;

  return await queryOne(sql, [commentId]);
}

/**
 * Approve flagged content (remove flag)
 * @param {string} contentId - Content ID
 * @param {string} contentType - 'post' | 'comment'
 * @returns {Promise<Object>} Updated content
 */
export async function approveContent(contentId, contentType) {
  const table = contentType === 'post' ? 'posts' : 'comments';
  const sql = `
    UPDATE ${table}
    SET flagged = false
    WHERE id = $1
    RETURNING *
  `;

  return await queryOne(sql, [contentId]);
}

// ============================================================================
// SCHOOL MANAGEMENT QUERIES
// ============================================================================

/**
 * Get all schools with statistics
 * @returns {Promise<Array>} List of schools
 */
export async function getAllSchools() {
  const sql = `
    SELECT
      s.*,
      COUNT(DISTINCT st.id) as student_count,
      COUNT(DISTINCT ss.id) as staff_count
    FROM schools s
    LEFT JOIN students st ON st.school_id = s.id
    LEFT JOIN school_staff ss ON ss.school_id = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `;

  return await query(sql, []);
}

/**
 * Get school by ID with full details
 * @param {string} schoolId - School ID
 * @returns {Promise<Object|null>} School object
 */
export async function getSchoolById(schoolId) {
  const sql = `
    SELECT
      s.*,
      COUNT(DISTINCT st.id) as student_count,
      COUNT(DISTINCT ss.id) as staff_count
    FROM schools s
    LEFT JOIN students st ON st.school_id = s.id
    LEFT JOIN school_staff ss ON ss.school_id = s.id
    WHERE s.id = $1
    GROUP BY s.id
  `;

  return await queryOne(sql, [schoolId]);
}

/**
 * Create new school
 * @param {Object} schoolData - School data
 * @returns {Promise<Object>} Created school
 */
export async function createSchool(schoolData) {
  const {
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
  } = schoolData;

  const sql = `
    INSERT INTO schools (
      name, address, city, state, zip_code, phone, email, website,
      primary_color, secondary_color, logo_url, required_hours, description
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;

  return await queryOne(sql, [
    name, address, city, state, zip_code, phone, email, website,
    primary_color, secondary_color, logo_url, required_hours, description
  ]);
}

/**
 * Update school
 * @param {string} schoolId - School ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated school
 */
export async function updateSchool(schoolId, updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(schoolId);

  const sql = `
    UPDATE schools
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  return await queryOne(sql, values);
}

/**
 * Delete school
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} Deleted school
 */
export async function deleteSchool(schoolId) {
  const sql = `
    DELETE FROM schools
    WHERE id = $1
    RETURNING *
  `;

  return await queryOne(sql, [schoolId]);
}

/**
 * Get students by school
 * @param {string} schoolId - School ID
 * @returns {Promise<Array>} List of students
 */
export async function getStudentsBySchool(schoolId) {
  const sql = `
    SELECT
      st.*,
      cu.email,
      cu.first_name,
      cu.last_name,
      cu.username,
      p.display_name,
      p.photo_url
    FROM students st
    JOIN clerk_users cu ON cu.id = st.user_id
    LEFT JOIN profiles p ON p.user_id = cu.id
    WHERE st.school_id = $1 AND st.deleted_at IS NULL
    ORDER BY cu.last_name, cu.first_name
  `;

  return await query(sql, [schoolId]);
}

/**
 * Get school staff
 * @param {string} schoolId - School ID
 * @returns {Promise<Array>} List of staff
 */
export async function getSchoolStaff(schoolId) {
  const sql = `
    SELECT
      ss.*,
      cu.email,
      cu.first_name,
      cu.last_name,
      cu.username,
      p.display_name
    FROM school_staff ss
    JOIN clerk_users cu ON cu.id = ss.user_id
    LEFT JOIN profiles p ON p.user_id = cu.id
    WHERE ss.school_id = $1
    ORDER BY ss.role_id, cu.last_name, cu.first_name
  `;

  return await query(sql, [schoolId]);
}

/**
 * Enroll student in school
 * @param {string} userId - User ID
 * @param {string} schoolId - School ID
 * @returns {Promise<Object>} Enrollment record
 */
export async function enrollStudent(userId, schoolId) {
  const sql = `
    INSERT INTO students (user_id, school_id, enrollment_date, status)
    VALUES ($1, $2, NOW(), 'Active')
    ON CONFLICT (user_id) DO UPDATE SET
      school_id = EXCLUDED.school_id,
      enrollment_date = NOW(),
      status = 'Active',
      deleted_at = NULL
    RETURNING *
  `;

  return await queryOne(sql, [userId, schoolId]);
}

/**
 * Remove student from school
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated student
 */
export async function removeStudent(userId) {
  const sql = `
    UPDATE students
    SET deleted_at = NOW(), status = 'Inactive'
    WHERE user_id = $1
    RETURNING *
  `;

  return await queryOne(sql, [userId]);
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get system-wide statistics
 * @returns {Promise<Object>} System stats
 */
export async function getSystemStats() {
  const sql = `
    WITH user_stats AS (
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_users
      FROM clerk_users
    ),
    content_stats AS (
      SELECT
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_posts_week,
        COUNT(*) FILTER (WHERE flagged = true AND deleted_at IS NULL) as flagged_posts
      FROM posts
    ),
    comment_stats AS (
      SELECT
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_comments_week,
        COUNT(*) FILTER (WHERE flagged = true AND deleted_at IS NULL) as flagged_comments
      FROM comments
    ),
    school_stats AS (
      SELECT
        COUNT(*) as total_schools,
        COUNT(DISTINCT st.id) as total_students
      FROM schools s
      LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
    )
    SELECT * FROM user_stats, content_stats, comment_stats, school_stats
  `;

  return await queryOne(sql, []);
}

/**
 * Get user growth over time
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Daily user counts
 */
export async function getUserGrowth(days = 30) {
  const sql = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as new_users
    FROM clerk_users
    WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  return await query(sql, [days]);
}

/**
 * Get content engagement stats
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Content stats
 */
export async function getContentStats(days = 30) {
  const sql = `
    SELECT
      COUNT(*) as total_posts,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_posts,
      SUM(comment_count) as total_comments_on_posts,
      SUM(reaction_count) as total_reactions
    FROM posts
    WHERE deleted_at IS NULL
  `;

  return await queryOne(sql, [days]);
}

/**
 * Get school enrollment stats
 * @returns {Promise<Array>} School enrollment data
 */
export async function getSchoolStats() {
  const sql = `
    SELECT
      s.id,
      s.name,
      COUNT(DISTINCT st.id) as student_count,
      COUNT(DISTINCT ss.id) as staff_count
    FROM schools s
    LEFT JOIN students st ON st.school_id = s.id AND st.deleted_at IS NULL
    LEFT JOIN school_staff ss ON ss.school_id = s.id
    GROUP BY s.id, s.name
    ORDER BY student_count DESC
  `;

  return await query(sql, []);
}

// ============================================================================
// SETTINGS QUERIES
// ============================================================================

/**
 * Get all app settings
 * @returns {Promise<Array>} List of settings
 */
export async function getAppSettings() {
  const sql = `
    SELECT * FROM app_settings
    ORDER BY category, key
  `;

  return await query(sql, []);
}

/**
 * Get single app setting
 * @param {string} key - Setting key
 * @returns {Promise<Object|null>} Setting object
 */
export async function getAppSetting(key) {
  const sql = `
    SELECT * FROM app_settings
    WHERE key = $1
  `;

  return await queryOne(sql, [key]);
}

/**
 * Update app setting
 * @param {string} key - Setting key
 * @param {Object} value - Setting value (will be JSON stringified)
 * @param {string} updatedBy - Admin user ID
 * @returns {Promise<Object>} Updated setting
 */
export async function updateAppSetting(key, value, updatedBy) {
  const sql = `
    INSERT INTO app_settings (key, value, updated_by, updated_at)
    VALUES ($1, $2::jsonb, $3, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
    RETURNING *
  `;

  return await queryOne(sql, [key, JSON.stringify(value), updatedBy]);
}

/**
 * Get feature flags
 * @returns {Promise<Object>} Feature flags object
 */
export async function getFeatureFlags() {
  const sql = `
    SELECT key, value
    FROM app_settings
    WHERE category = 'features' OR category = 'system'
  `;

  const results = await query(sql, []);

  // Convert to object
  const flags = {};
  for (const row of results) {
    flags[row.key] = row.value;
  }

  return flags;
}
