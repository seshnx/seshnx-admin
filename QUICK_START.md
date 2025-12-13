# Quick Start - Admin SDK Production Setup

## ✅ Status: Ready to Deploy

Your Firebase Admin SDK setup is complete! Both service account JSONs are configured in Vercel.

## 🚀 Next Steps

### 1. Deploy to Vercel

The code is ready. Just deploy:

```bash
# If using Git (recommended)
git add .
git commit -m "Add Firebase Admin SDK with API routes"
git push

# Vercel will auto-deploy if connected to your repo
# OR manually:
vercel --prod
```

### 2. Test the Deployment

Once deployed, test these features:

1. **Login** - Should work as before
2. **User Management** - Should load users from API (`/api/admin/users`)
3. **School Management** - Should load schools from API (`/api/admin/schools`)
4. **Role Management** - Try granting/revoking roles

### 3. Verify API Routes

Check that API routes are working:
- `https://your-domain.vercel.app/api/admin/users` (requires auth)
- `https://your-domain.vercel.app/api/admin/schools` (requires auth)

## 🔍 What Changed

1. **Client Code** - Now uses API routes instead of direct Firestore calls
   - `UserManager.jsx` → Uses `usersAPI.fetchUsers()`
   - `SchoolManager.jsx` → Uses `schoolsAPI.*`
   - `Register.jsx` → Uses `registerAPI.register()`

2. **New API Routes** (Server-side, bypasses Firestore rules)
   - `/api/admin/users.js` - User management
   - `/api/admin/schools.js` - School management
   - `/api/admin/register.js` - Admin registration
   - `/api/admin/initAdmin.js` - Admin SDK initialization

3. **Environment Variables** (Already set in Vercel ✅)
   - `FIREBASE_SERVICE_ACCOUNT_DB` - For database access
   - `FIREBASE_SERVICE_ACCOUNT_AUTH` - For auth project access

## 🎯 Expected Behavior

### Before (Client-Side Firestore)
- ❌ Permission errors from Firestore rules
- ❌ Cross-project auth issues
- ❌ Direct database access from client

### After (Admin SDK API Routes)
- ✅ No permission errors (Admin SDK bypasses rules)
- ✅ Proper cross-project authentication
- ✅ Secure server-side database access

## 🐛 If Something Goes Wrong

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Select your project
3. Click "Functions" tab
4. Check logs for errors

### Common Issues

**"Admin SDK not initialized"**
- Verify `FIREBASE_SERVICE_ACCOUNT_DB` exists in Vercel env vars
- Check that JSON is valid (no extra formatting)

**"Forbidden: Not an administrator"**
- User must exist in `seshnx-admin-auth` Firestore `admins` collection
- Or set master account via env vars

**API routes return 404**
- Verify `vercel.json` is in root directory
- Check that API files are in `/api/admin/` (not `/src/api/`)

## 📚 Documentation

- `ADMIN_SDK_SETUP.md` - Full setup guide
- `DEPLOYMENT_CHECKLIST.md` - Detailed deployment steps

---

**You're all set!** 🎉 Deploy and test. The Admin SDK will handle all the permission issues automatically.

