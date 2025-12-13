# Deployment Checklist

## ✅ Pre-Deployment Setup

### Environment Variables in Vercel
- [x] `FIREBASE_SERVICE_ACCOUNT_DB` - Database project service account JSON
- [x] `FIREBASE_SERVICE_ACCOUNT_AUTH` - Auth project service account JSON
- [ ] `VITE_MASTER_ACCOUNT_EMAIL` - Master account email (for client-side)
- [ ] `VITE_MASTER_ACCOUNT_UID` - Master account UID (for client-side)
- [ ] `MASTER_ACCOUNT_EMAIL` - Master account email (for API routes/server-side)
- [ ] `MASTER_ACCOUNT_UID` - Master account UID (for API routes/server-side)
- [ ] `VITE_BACKUP_ADMIN_UIDS` - Backup admin UIDs (client-side)
- [ ] `BACKUP_ADMIN_UIDS` - Backup admin UIDs (server-side)
- [ ] `VITE_FIREBASE_PROJECT_ID` - Should be 'seshnx-db' (optional, defaults to 'seshnx-db')

**Note:** For master account to work in both client AND API routes, you need BOTH `VITE_` and non-`VITE_` versions of the env vars.

### First-Time Setup: Create Admins Collection
The `admins` collection in `seshnx-admin-auth` doesn't exist yet. It will be created automatically, but you need to create the first admin record:

**Option 1: Use Register API** (after deployment)
- POST to `/api/admin/register` with your admin credentials
- This creates both the Firebase Auth user AND the admin record

**Option 2: Use Init Admin API** (if user already exists)
- POST to `/api/admin/init-admin` with email and role
- User must already exist in Firebase Auth

**Option 3: Set Master Account** (recommended backup)
- Set `VITE_MASTER_ACCOUNT_EMAIL` and `VITE_MASTER_ACCOUNT_UID` in Vercel
- This works even without the `admins` collection

See `ADMIN_COLLECTION_SETUP.md` for details.

### Code Verification
- [x] `firebase-admin` installed in package.json
- [x] API routes created in `/api/admin/`
- [x] Client code updated to use API routes
- [x] `.gitignore` includes `node_modules/`

## 🚀 Deployment Steps

1. **Commit and Push Code**
   ```bash
   git add .
   git commit -m "Add Firebase Admin SDK with API routes"
   git push
   ```

2. **Deploy to Vercel**
   - If connected to Git: Vercel will auto-deploy
   - Or use: `vercel --prod`

3. **Verify Deployment**
   - Check Vercel dashboard for successful build
   - API routes should be available at: `https://your-domain.vercel.app/api/admin/*`

## 🧪 Testing

### Test API Routes
1. **Login to the app** - Should work normally
2. **Check User Management** - Should load users via API
3. **Check School Management** - Should load schools via API
4. **Test Role Updates** - Try granting/revoking roles

### Check Logs
If errors occur, check:
- Vercel Function Logs (Dashboard → Functions)
- Browser Console for client-side errors
- Network tab for API request/response

## 🔍 Troubleshooting

### API Routes Return 404
- Ensure `vercel.json` is in root directory
- Check that files are in `/api/admin/` (not `/src/api/`)
- Verify build succeeded in Vercel dashboard

### "Admin SDK not initialized"
- Verify `FIREBASE_SERVICE_ACCOUNT_DB` is set in Vercel
- Check that JSON is valid (paste entire JSON object)
- Review Vercel Function Logs for initialization errors

### "Forbidden: Not an administrator"
- User must exist in `seshnx-admin-auth` Firestore `admins` collection
- Or user must be master account (set via env vars)
- Check `verifyAdmin()` function in API logs

### Still Getting Permission Errors
- Ensure client code is using API routes, not direct Firestore calls
- Check that `src/utils/api.js` is being used
- Verify auth token is being sent in Authorization header

## 📝 Post-Deployment

1. **Test All Features**
   - User management
   - School management
   - Registration (if enabled)
   - Role management

2. **Monitor Logs**
   - Check for any errors in first few hours
   - Monitor API route performance

3. **Security Review**
   - Verify service account keys are NOT in code
   - Ensure API routes require authentication
   - Test that non-admin users cannot access API

## 🎉 Success Criteria

- ✅ All API routes respond correctly
- ✅ Users can login and access admin features
- ✅ User/School management works via API
- ✅ No permission errors in console
- ✅ Admin SDK successfully bypasses Firestore rules

