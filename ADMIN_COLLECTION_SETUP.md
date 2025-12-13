# Setting Up the Admins Collection

The `admins` collection in the `seshnx-admin-auth` Firestore project doesn't exist yet. Here are the ways to create it and set up your first admin.

## Option 1: Automatic Creation (Recommended)

The `admins` collection will be **automatically created** when you use the registration API:

1. **Use the Register API** (if public registration is enabled):
   ```
   POST /api/admin/register
   Body: { email: "admin@example.com", password: "securepassword", role: "SuperAdmin" }
   ```

2. **Or use the Init Admin API** (if user already exists in Firebase Auth):
   ```
   POST /api/admin/init-admin
   Body: { email: "admin@example.com", role: "SuperAdmin" }
   ```

## Option 2: Manual Setup via Firebase Console

1. Go to: https://console.firebase.google.com/project/seshnx-admin-auth/firestore
2. Click "Start collection"
3. Collection ID: `admins`
4. Document ID: (your user UID - get it from Firebase Auth)
5. Add fields:
   - `email` (string): Your admin email
   - `role` (string): `"SuperAdmin"` or `"GAdmin"`
   - `active` (boolean): `true`
   - `createdAt` (timestamp): Current time
   - `status` (string): `"active"`

## Option 3: Use Init Admin API Route

After deployment, you can call the init-admin API:

```bash
# Get your user ID from Firebase Auth first, then:
curl -X POST https://your-domain.vercel.app/api/admin/init-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com", "role": "SuperAdmin"}'
```

**Note:** The user must already exist in Firebase Auth. If not, use the register API instead.

## Option 4: Use Master Account (No Collection Needed)

If you've set up environment variables in Vercel:
- `VITE_MASTER_ACCOUNT_EMAIL`
- `VITE_MASTER_ACCOUNT_UID`

The master account will work **without** needing an entry in the `admins` collection. This is the backup access method.

## How It Works

### Normal Flow
1. User registers → Registration API creates user in Firebase Auth + creates document in `admins` collection
2. User logs in → `verifyAdmin()` checks `admins` collection → Grants access if found

### Fallback Flow (if collection doesn't exist)
1. `verifyAdmin()` checks `admins` collection → Not found
2. Falls back to checking main database profile (`accountTypes` field)
3. Falls back to checking master account env vars
4. Grants access if any match

## Recommended First-Time Setup

1. **Set Master Account** (in Vercel env vars) - This ensures you always have access
2. **Register First Admin** via `/api/admin/register` - Creates the `admins` collection
3. **Verify Login** - Should work immediately

## Troubleshooting

### "Collection doesn't exist"
- This is normal! Firestore creates collections automatically on first write
- Use the register API or init-admin API to create the first document
- The collection will be created automatically

### "Forbidden: Not an administrator"
- Check that the user has a document in `admins` collection
- Or ensure master account env vars are set
- Or check that main database profile has `accountTypes` with `GAdmin` or `SuperAdmin`

### "User not found" when using init-admin
- Create the user in Firebase Auth first (via Firebase Console or register API)
- Or use the register API instead, which creates both Auth user and admin record

