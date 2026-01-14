import { verifyAdminAuth } from '../middleware/auth.js';

/**
 * GET /api/admin/me
 * Get current admin user information
 */
export async function GET(req) {
  // Verify authentication (will attach req.admin if successful)
  const authError = await verifyAdminAuth(req, {});
  if (authError) {
    return authError;
  }

  // Return admin user info from middleware
  return new Response(JSON.stringify({
    user: req.admin,
    success: true
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
