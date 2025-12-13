import { verifyAdmin, getDb } from './initAdmin.js';

const APP_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'seshnx-db';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin authorization
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const adminUser = await verifyAdmin(token);
    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden: Not an administrator' });
    }

    const db = getDb();

    // Fetch counts for all collections
    const [
      usersCount,
      schoolsCount,
      postsCount,
      marketCount,
      bookingsCount
    ] = await Promise.all([
      db.collection(`artifacts/${APP_ID}/public/data/profiles`).count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection('schools').count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection(`artifacts/${APP_ID}/public/data/posts`).count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection(`artifacts/${APP_ID}/public/data/market_items`).count().get().catch(() => ({ data: () => ({ count: 0 }) })),
      db.collection(`artifacts/${APP_ID}/public/data/bookings`).count().get().catch(() => ({ data: () => ({ count: 0 }) }))
    ]);

    // Get actual schools count (count() doesn't work the same way in Admin SDK)
    const schoolsSnapshot = await db.collection('schools').get().catch(() => ({ docs: [] }));
    const actualSchoolsCount = schoolsSnapshot.docs?.length || 0;

    return res.status(200).json({
      stats: {
        totalUsers: usersCount.data?.()?.count || 0,
        totalSchools: actualSchoolsCount,
        totalPosts: postsCount.data?.()?.count || 0,
        totalMarketItems: marketCount.data?.()?.count || 0,
        totalBookings: bookingsCount.data?.()?.count || 0,
        activeUsers: 0 // TODO: Calculate active users based on recent activity
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

