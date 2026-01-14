import { neon } from '@neondatabase/serverless';

const neonUrl = import.meta.env.VITE_NEON_DATABASE_URL;

if (!neonUrl) {
  console.error('❌ Neon: VITE_NEON_DATABASE_URL is not set');
}

export const neonClient = neonUrl ? neon(neonUrl, { fetch: fetch }) : null;

/**
 * Execute a SQL query with parameters
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(sql, params = []) {
  if (!neonClient) {
    throw new Error('Neon client is not configured. Please check VITE_NEON_DATABASE_URL environment variable.');
  }

  try {
    const result = await neonClient(sql, params);
    return result;
  } catch (error) {
    console.error('Neon query error:', error);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a query and return the first row
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object|null>} First row or null
 */
export async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a query and return the first column of the first row
 * Useful for COUNT queries
 * @param {string} sql - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<any>} First column value
 */
export async function queryScalar(sql, params = []) {
  const result = await queryOne(sql, params);
  if (!result) return null;

  const keys = Object.keys(result);
  return result[keys[0]];
}
