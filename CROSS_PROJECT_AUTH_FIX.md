# Fix: Cross-Project Authentication Issue

## Problem
Users authenticated in `seshnx-admin-auth` cannot access `seshnx-db` Firestore because:
- Auth tokens from one Firebase project don't work in another project's Firestore rules
- `request.auth` in `seshnx-db` rules doesn't recognize users from `seshnx-admin-auth`

## Quick Fix for Testing

Update Firestore rules in `seshnx-db` to allow authenticated users:

1. Go to: https://console.firebase.google.com/project/seshnx-db/firestore/rules
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMP: Allow all authenticated users for testing
    allow read, write: if request.auth != null;
  }
}
```

3. Click **Publish**

## Alternative: Authenticate with Database Project Too

We could modify the code to authenticate users with BOTH projects, but that's more complex.

For now, the quick fix above will allow you to test the admin app functionality.

