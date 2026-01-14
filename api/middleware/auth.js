import { Clerk } from '@clerk/clerk-sdk-node';
import { queryOne } from '../../src/config/neon.js';

// Initialize Clerk with secret key from environment
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.warn('⚠️  Clerk: CLERK_SECRET_KEY is not set in environment variables');
}

const clerk = clerkSecretKey ? new Clerk({ secretKey: clerkSecretKey }) : null;

/**
 * Verify a Clerk JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token payload
 */
async function verifyToken(token) {
  if (!clerk) {
    throw new Error('Clerk client is not configured - missing CLERK_SECRET_KEY');
  }

  try {
    const payload = await clerk.verifyToken(token);
    return payload;
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify admin authentication middleware
 * Checks for valid Clerk JWT token and admin role in Neon database
 */
export async function verifyAdminAuth(req, res) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized: No token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify Clerk token
    let payload;
    try {
      payload = await verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Get user ID from token
    const userId = payload.sub;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid token payload',
        code: 'INVALID_PAYLOAD'
      });
    }

    // Check if user has admin role in Neon database
    let adminUser;
    try {
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
    } catch (error) {
      console.error('Database error checking admin user:', error);
      return res.status(500).json({
        error: 'Internal server error: Database query failed',
        code: 'DB_ERROR'
      });
    }

    // Check if user exists
    if (!adminUser) {
      return res.status(403).json({
        error: 'Forbidden: User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is banned (soft deleted)
    if (adminUser.deleted_at) {
      return res.status(403).json({
        error: 'Forbidden: User account is banned',
        code: 'USER_BANNED'
      });
    }

    // Check if user has admin role (GAdmin or SuperAdmin)
    const accountTypes = adminUser.account_types || [];
    const isAdmin = accountTypes.includes('GAdmin') || accountTypes.includes('SuperAdmin');

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Admin access required',
        code: 'NOT_ADMIN'
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
    return res.status(500).json({
      error: 'Internal server error: Authentication failed',
      code: 'AUTH_ERROR'
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
