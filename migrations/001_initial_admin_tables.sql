-- ============================================
-- SeshNx Admin - Initial Database Migration
-- ============================================
-- This migration creates the tables needed for the admin system
-- to connect to webapp-main's Neon PostgreSQL database
--
-- Run this in your Neon database SQL editor:
-- https://console.neon.tech/
-- ============================================

-- ============================================
-- 1. APP SETTINGS TABLE
-- Stores application-wide settings and feature flags
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  category TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value, description, category) VALUES
  ('maintenance_mode', '{"enabled": false}', 'Enable site-wide maintenance mode', 'system'),
  ('registration_enabled', '{"enabled": true}', 'Allow new user registrations', 'system'),
  ('marketplace_enabled', '{"enabled": true}', 'Enable marketplace feature', 'features'),
  ('social_feed_enabled', '{"enabled": true}', 'Enable social feed feature', 'features'),
  ('booking_system_enabled', '{"enabled": true}', 'Enable booking system', 'features'),
  ('max_upload_size_mb', '{"value": 50}', 'Maximum file upload size in MB', 'limits'),
  ('max_post_length', '{"value": 5000}', 'Maximum post character length', 'limits')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 2. AUDIT LOG TABLE
-- Tracks all administrative actions for security and compliance
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_type, target_id);

-- ============================================
-- 3. PERFORMANCE INDEXES
-- Improve query performance for commonly accessed data
-- ============================================

-- clerk_users indexes
CREATE INDEX IF NOT EXISTS idx_clerk_users_account_types ON clerk_users USING GIN(account_types);
CREATE INDEX IF NOT EXISTS idx_clerk_users_deleted_at ON clerk_users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clerk_users_email ON clerk_users(email);
CREATE INDEX IF NOT EXISTS idx_clerk_users_username ON clerk_users(username);

-- posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_flagged ON posts(flagged) WHERE flagged = true;

-- comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_flagged ON comments(flagged) WHERE flagged = true;

-- schools indexes
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_created_at ON schools(created_at DESC);

-- students indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;

-- school_staff indexes
CREATE INDEX IF NOT EXISTS idx_school_staff_school_id ON school_staff(school_id);
CREATE INDEX IF NOT EXISTS idx_school_staff_user_id ON school_staff(user_id);

-- ============================================
-- 4. SCHOOL ROLES TABLE (if not exists)
-- Stores role definitions for schools
-- ============================================
CREATE TABLE IF NOT EXISTS school_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_roles_school_id ON school_roles(school_id);

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- ============================================

-- Check if tables were created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('app_settings', 'admin_audit_log', 'school_roles')
ORDER BY table_name;

-- Check default settings
SELECT * FROM app_settings ORDER BY category, key;

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN (
    'clerk_users',
    'posts',
    'comments',
    'schools',
    'students',
    'school_staff',
    'app_settings',
    'admin_audit_log',
    'school_roles'
)
ORDER BY tablename, indexname;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- Uncomment and run to rollback this migration
-- ============================================

-- DROP TABLE IF EXISTS admin_audit_log CASCADE;
-- DROP TABLE IF EXISTS app_settings CASCADE;
-- DROP TABLE IF EXISTS school_roles CASCADE;
-- DROP INDEX IF EXISTS idx_clerk_users_account_types;
-- DROP INDEX IF EXISTS idx_clerk_users_deleted_at;
-- DROP INDEX IF EXISTS idx_posts_user_id;
-- DROP INDEX IF EXISTS idx_posts_deleted_at;
-- DROP INDEX IF EXISTS idx_comments_post_id;
-- DROP INDEX IF EXISTS idx_comments_flagged;
-- DROP INDEX IF EXISTS idx_students_school_id;
