# Firebase Admin SDK Options for SeshNx Admin App

## Overview

The **Firebase Admin SDK** runs with elevated privileges and bypasses Firestore security rules. It's perfect for:
- Cross-project operations (auth in one project, data in another)
- Admin-only operations
- Operations that need to bypass client-side security rules

## Admin SDK Options

### Option 1: Vercel Serverless Functions (Recommended for Your Setup)

Since you're using Vercel, you can create API routes that use the Admin SDK.

**Pros:**
- No separate server needed
- Scales automatically
- Easy to deploy with your existing Vercel setup
- Can handle cross-project authentication

**Cons:**
- Requires API endpoints instead of direct Firestore calls
- Slightly more complex than client-side

**Setup:**
```bash
npm install firebase-admin
```

Create API routes in `/api/` directory.

### Option 2: Firebase Cloud Functions

Serverless functions hosted by Firebase.

**Pros:**
- Native Firebase integration
- Automatic scaling
- Can use Admin SDK easily

**Cons:**
- Separate deployment process
- Additional Firebase project configuration
- Cost per invocation

### Option 3: Separate Node.js Backend Server

Traditional backend server (Express, etc.)

**Pros:**
- Full control
- Can handle complex business logic
- Persistent connections

**Cons:**
- Requires server infrastructure
- More complex deployment
- Ongoing maintenance

## Recommended: Vercel Serverless Functions

For your setup, **Vercel Serverless Functions** are the best choice.

### Implementation Structure

```
seshnx-admin/
├── api/                    # Vercel serverless functions
│   ├── admin/
│   │   ├── users.js       # User management endpoints
│   │   ├── schools.js     # School management endpoints
│   │   └── auth.js        # Auth/registration endpoints
│   └── ...
├── src/                    # Your React app (existing)
└── package.json
```

### Example: Admin API Route

**`api/admin/users.js`**:
```javascript
import admin from 'firebase-admin';

// Initialize Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Can initialize multiple projects
  });
}

// Database project Firestore (for data)
const dbProject = admin.firestore();

// Auth project Firestore (for admin checks)
const authProject = admin.firestore();
// Note: For multiple projects, use app() method

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user is admin (check auth project)
    const authToken = req.headers.authorization?.split('Bearer ')[1];
    if (!authToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token from auth project
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    
    // Check if user is admin in auth project
    const adminDoc = await authProject
      .collection('admins')
      .doc(decodedToken.uid)
      .get();
    
    if (!adminDoc.exists || adminDoc.data().active === false) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Fetch users from database project (bypasses rules)
    const usersSnapshot = await dbProject
      .collection('artifacts/seshnx-db/public/data/profiles')
      .limit(100)
      .get();

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).json({ users });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

### Client-Side Usage

```javascript
// In your React component
const fetchUsers = async () => {
  const token = await auth.currentUser.getIdToken();
  const response = await fetch('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  setUsers(data.users);
};
```

## Setup Instructions

### Step 1: Install Firebase Admin SDK

```bash
npm install firebase-admin
```

### Step 2: Get Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Select project (`seshnx-db` or `seshnx-admin-auth`)
3. Click "Generate New Private Key"
4. Download the JSON file

**For dual projects, you can:**
- Use service account from database project (can access both if properly configured)
- Or use service account from auth project and initialize both projects

### Step 3: Add to Environment Variables

In Vercel, add:
```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"..."}'
```

Or store the JSON file securely and load it.

### Step 4: Create API Routes

Create functions in `/api/` directory that Vercel will automatically deploy as serverless functions.

## Multi-Project Admin SDK Setup

### Initializing Multiple Projects

```javascript
import admin from 'firebase-admin';

// Service accounts for both projects
const authServiceAccount = JSON.parse(process.env.AUTH_FIREBASE_SERVICE_ACCOUNT);
const dbServiceAccount = JSON.parse(process.env.DB_FIREBASE_SERVICE_ACCOUNT);

// Initialize auth project
const authApp = admin.initializeApp({
  credential: admin.credential.cert(authServiceAccount),
  projectId: 'seshnx-admin-auth'
}, 'auth-project');

// Initialize database project  
const dbApp = admin.initializeApp({
  credential: admin.credential.cert(dbServiceAccount),
  projectId: 'seshnx-db'
}, 'db-project');

// Get Firestore instances
const authDb = admin.firestore(authApp);
const dbDb = admin.firestore(dbApp);

// Get Auth instances
const authAuth = admin.auth(authApp);
const dbAuth = admin.auth(dbApp);
```

## Benefits for Your Use Case

1. **Cross-Project Access**: Admin SDK can access both projects regardless of auth tokens
2. **Bypass Rules**: All operations bypass Firestore security rules
3. **Custom Tokens**: Can create custom tokens for cross-project authentication
4. **Secure Operations**: Sensitive operations run server-side, not exposed to client

## Use Cases

### 1. User Registration (Create admin record)
```javascript
// api/admin/register.js
// User registers → verify → create admin record in auth project
// Admin SDK can write to auth project even if rules block client writes
```

### 2. Fetch Users (Cross-project)
```javascript
// api/admin/users.js
// Verify user is admin (check auth project)
// Fetch users (from database project)
// Return data (bypasses all Firestore rules)
```

### 3. School Management
```javascript
// api/admin/schools.js
// Verify admin status
// Create/update schools in database project
// Bypass GAdmin-only rules
```

### 4. Custom Tokens (Advanced)
```javascript
// Create custom token that works in database project
const customToken = await admin.auth().createCustomToken(userId, {
  admin: true,
  project: 'seshnx-db'
});
```

## Security Considerations

1. **Never expose service account keys** in client code
2. **Always verify user tokens** in API routes
3. **Check admin status** before allowing operations
4. **Rate limit** API endpoints
5. **Log all admin operations** for audit

## Next Steps

1. Decide if you want to use Admin SDK (recommended for production)
2. Set up Vercel serverless functions
3. Create API endpoints for admin operations
4. Update client code to use API endpoints instead of direct Firestore

Would you like me to help set up Vercel serverless functions with Admin SDK?

