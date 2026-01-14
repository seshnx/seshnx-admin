import { Clerk } from '@clerk/clerk-sdk-node';

const clerkSecretKey = import.meta.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.warn('⚠️  Clerk: CLERK_SECRET_KEY is not set');
}

export const clerk = clerkSecretKey ? new Clerk({ secretKey: clerkSecretKey }) : null;

/**
 * Get the Clerk publishable key for client-side use
 */
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Verify a Clerk JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Decoded token payload
 */
export async function verifyToken(token) {
  if (!clerk) {
    throw new Error('Clerk client is not configured');
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
 * Get user details from Clerk by user ID
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Object>} User object
 */
export async function getClerkUser(userId) {
  if (!clerk) {
    throw new Error('Clerk client is not configured');
  }

  try {
    const user = await clerk.users.getUser(userId);
    return user;
  } catch (error) {
    console.error('Failed to get Clerk user:', error);
    throw error;
  }
}
