import { verifyToken } from '@clerk/clerk-sdk-node';
import { queryOne } from '../config/neon.js';

// Initialize Clerk with secret key from environment
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.warn('⚠️  Clerk: CLERK_SECRET_KEY is not set in environment variables');
} else {
  console.log('✅ Clerk: CLERK_SECRET_KEY is configured');
}

/**
 * Verify admin authentication middleware
 * Checks for valid Clerk JWT token and admin role in Neon database
 *
 * Returns a Response object on error, or null if authentication succeeds
 */
export async function verifyAdminAuth(req, res) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: No token provided',
        code: 'NO_TOKEN'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify Clerk token
    let payload;
    try {
      console.log('Attempting to verify token...');
      console.log('Clerk secret key configured:', !!clerkSecretKey);
      console.log('Token length:', token.length);
      console.log('Token prefix:', token.substring(0, 20) + '...');
      payload = await verifyToken(token, { secretKey: clerkSecretKey });
      console.log('Token verified successfully, payload sub:', payload.sub);
    } catch (error) {
      console.error('Clerk token verification failed:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      return new Response(JSON.stringify({
        error: 'Unauthorized: Invalid or expired token',
        code: 'INVALID_TOKEN'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user ID from token
    const userId = payload.sub;

    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Unauthorized: Invalid token payload',
        code: 'INVALID_PAYLOAD'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role in Neon database
    let adminUser;
    try {
      console.log('Querying database for user:', userId);
      adminUser = await queryOne(
        `SELECT
          id,
          email,
          username,
          account_types,
          active_role,
          first_name,
          last_name,
          deleted_at
        FROM clerk_users
        WHERE id = $1`,
        [userId]
      );
      console.log('Database query result:', adminUser ? 'User found' : 'User not found');
    } catch (error) {
      console.error('Database error checking admin user:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      return new Response(JSON.stringify({
        error: 'Internal server error: Database query failed',
        code: 'DB_ERROR',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user exists
    if (!adminUser) {
      return new Response(JSON.stringify({
        error: 'Forbidden: User not found',
        code: 'USER_NOT_FOUND'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user is banned (soft deleted)
    if (adminUser.deleted_at) {
      return new Response(JSON.stringify({
        error: 'Forbidden: User account is banned',
        code: 'USER_BANNED'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has admin role (GAdmin or SuperAdmin)
    const accountTypes = adminUser.account_types || [];
    const isAdmin = accountTypes.includes('GAdmin') || accountTypes.includes('SuperAdmin');

    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: 'Forbidden: Admin access required',
        code: 'NOT_ADMIN'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Attach admin user info to request
    req.admin = {
      id: adminUser.id,
      email: adminUser.email,
      username: adminUser.username,
      firstName: adminUser.first_name,
      lastName: adminUser.last_name,
      roles: accountTypes,
      activeRole: adminUser.active_role,
      isSuperAdmin: accountTypes.includes('SuperAdmin')
    };

    // Continue to next middleware/handler
    return null; // No error means authentication passed
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error: Authentication failed',
      code: 'AUTH_ERROR'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Express.js-style middleware wrapper for Vercel serverless functions
 * Use this for Express-compatible middleware
 */
export function authMiddleware(req, res, next) {
  verifyAdminAuth(req, res)
    .then((errorResponse) => {
      if (errorResponse) {
        return errorResponse; // Send error response
      }
      next(); // Continue to next handler
    })
    .catch((error) => {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        code: 'MIDDLEWARE_ERROR'
      });
    });
}
