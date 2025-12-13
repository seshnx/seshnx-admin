# Firebase Admin SDK Setup for Vercel

This document explains how to set up and configure Firebase Admin SDK with Vercel serverless functions for the SeshNx Admin App.

## Overview

The Admin SDK runs on Vercel serverless functions (API routes) and bypasses Firestore security rules. This provides:
- **Secure server-side access** to Firebase
- **Cross-project authentication** support
- **Bypass Firestore rules** for admin operations
- **No client-side security rules** needed

## Architecture

```
Client (React) → API Routes (/api/admin/*) → Firebase Admin SDK → Firestore
                                   ↓
                            Verifies auth token
                                   ↓
                            Bypasses Firestore rules
```

## Setup Steps

### 1. Get Service Account Keys

You need service account JSON files from both Firebase projects:

#### Database Project (`seshnx-db`)
1. Go to: https://console.firebase.google.com/project/seshnx-db/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Download the JSON file

#### Auth Project (`seshnx-admin-auth`) - Optional but Recommended
1. Go to: https://console.firebase.google.com/project/seshnx-admin-auth/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Download the JSON file

### 2. Add Environment Variables to Vercel

Go to your Vercel project settings → Environment Variables and add:

#### Option A: Separate Service Accounts (Recommended)
```
FIREBASE_SERVICE_ACCOUNT_DB=<paste entire JSON from seshnx-db>
FIREBASE_SERVICE_ACCOUNT_AUTH=<paste entire JSON from seshnx-admin-auth>
```

#### Option B: Single Service Account
```
FIREBASE_SERVICE_ACCOUNT=<paste entire JSON from seshnx-db>
```

**Important:** When pasting JSON in Vercel:
- Paste the entire JSON object as a single string
- Vercel will handle the newlines automatically
- No need to escape quotes or format

### 3. API Routes Structure

All API routes are in `/api/admin/`:
- `/api/admin/users.js` - User management (fetch, update roles)
- `/api/admin/schools.js` - School management (CRUD)
- `/api/admin/register.js` - Admin account registration
- `/api/admin/initAdmin.js` - Admin SDK initialization utility

### 4. How It Works

#### Authentication Flow
1. Client gets auth token from Firebase Auth (auth project)
2. Client sends request to API route with `Authorization: Bearer <token>` header
3. API route uses `verifyAdmin()` to verify token and check admin status
4. API route uses Admin SDK to access Firestore (bypasses rules)

#### Example Request
```javascript
// Client code (React)
const token = await auth.currentUser.getIdToken();
const response = await fetch('/api/admin/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Example API Route
```javascript
// api/admin/users.js
export default async function handler(req, res) {
  // Verify admin
  const token = req.headers.authorization?.replace('Bearer ', '');
  const adminUser = await verifyAdmin(token);
  if (!adminUser) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Use Admin SDK (bypasses rules)
  const db = getDb();
  const snapshot = await db.collection('users').get();
  // ...
}
```

## Security Considerations

1. **Token Verification**: All API routes verify the auth token before processing
2. **Admin Check**: Routes check if user is admin in auth project's Firestore
3. **Master Account**: Environment-based master accounts always have access
4. **CORS**: API routes include CORS headers for client access

## Testing Locally

### Option 1: Use Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run dev server (includes API routes)
vercel dev
```

### Option 2: Environment Variables
Create `.env.local`:
```
FIREBASE_SERVICE_ACCOUNT_DB={"type":"service_account","project_id":"seshnx-db",...}
FIREBASE_SERVICE_ACCOUNT_AUTH={"type":"service_account","project_id":"seshnx-admin-auth",...}
```

Then run:
```bash
npm run dev
```

## Production Deployment

1. Push environment variables to Vercel (via CLI or dashboard)
2. Deploy to Vercel
3. API routes will be available at: `https://your-domain.vercel.app/api/admin/*`

## Troubleshooting

### Error: "Admin SDK not initialized"
- Check that `FIREBASE_SERVICE_ACCOUNT_DB` is set in Vercel
- Verify JSON is valid (no extra quotes or formatting)

### Error: "Forbidden: Not an administrator"
- User must exist in `seshnx-admin-auth` Firestore `admins` collection
- Or user must be master account (via env vars)

### Error: "Missing or insufficient permissions" (still)
- This shouldn't happen with Admin SDK
- Check that API routes are being called, not direct Firestore calls
- Verify Admin SDK initialization in `initAdmin.js`

## Benefits Over Client-Side Firestore Rules

1. **No rule complexity** - Admin SDK bypasses all rules
2. **Cross-project access** - Can access both projects easily
3. **Secure** - Service account keys never exposed to client
4. **Centralized logic** - All admin operations in one place
5. **Easy to audit** - All admin actions go through API routes

## Next Steps

1. Add more API routes as needed (invites, reports, etc.)
2. Add rate limiting for production
3. Add request logging/auditing
4. Consider adding API key authentication for additional security

