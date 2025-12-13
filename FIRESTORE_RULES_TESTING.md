# Firestore Rules for Testing - Dual Project Setup

## Problem
Users authenticated in `seshnx-admin-auth` cannot access `seshnx-db` Firestore because authentication tokens from one Firebase project don't work in another project's Firestore rules.

## Solution: Update Firestore Rules

### For `seshnx-db` Project (Main Database)

Go to Firebase Console → `seshnx-db` → Firestore Database → Rules

**Option 1: Allow Authenticated Admins (Recommended for Testing)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Schools collection - allow GAdmin/SuperAdmin to read/write
    match /schools/{schoolId} {
      allow read, write: if request.auth != null;
      // For production, add proper checks:
      // allow read: if request.auth != null;
      // allow create: if request.auth != null && 
      //   exists(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)/profiles/main) &&
      //   get(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)/profiles/main)
      //     .data.accountTypes.hasAny(['GAdmin', 'SuperAdmin']);
    }
    
    // User profiles - allow admins to read
    match /artifacts/{appId}/users/{userId}/profiles/main {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public profiles collection
    match /artifacts/{appId}/public/data/profiles/{profileId} {
      allow read: if request.auth != null;
      allow write: if false; // Only via Admin SDK
    }
    
    // Other collections
    match /artifacts/{appId}/public/data/{collection}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Restrict further in production
    }
    
    // Invites collection
    match /invites/{inviteId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Option 2: Allow All Authenticated (Simple Testing)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users for testing
    // ⚠️  REMOVE THIS IN PRODUCTION!
    allow read, write: if request.auth != null;
  }
}
```

### For `seshnx-admin-auth` Project (Auth Project)

Go to Firebase Console → `seshnx-admin-auth` → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read their own admin document
    match /admins/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      // Allow users to write their own document (for registration)
      allow write: if request.auth != null && request.auth.uid == adminId;
      // Or restrict writes to Admin SDK only:
      // allow write: if false;
    }
  }
}
```

## Important Notes

1. **These rules are for testing only** - they're too permissive for production
2. **Cross-project authentication** - Auth tokens from one project don't work in another project's rules
3. **Production solution** - For production, consider:
   - Using Admin SDK on backend
   - Custom tokens
   - Same auth project for both (if security isolation isn't critical)
   - Firestore rules that check auth project separately (complex)

## Quick Testing Rules (Copy-Paste)

### seshnx-db Rules (Main Database)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    allow read, write: if request.auth != null;
  }
}
```

### seshnx-admin-auth Rules (Auth Project)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.uid == adminId;
    }
  }
}
```

