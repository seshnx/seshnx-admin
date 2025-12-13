# Master Account Troubleshooting

If sign-in with master account "doesn't load", check the following:

## 1. Check Environment Variables

### Client-Side (React App)
Master account variables must be prefixed with `VITE_`:
- `VITE_MASTER_ACCOUNT_EMAIL`
- `VITE_MASTER_ACCOUNT_UID`
- `VITE_BACKUP_ADMIN_UIDS`

### Server-Side (API Routes)
API routes need BOTH versions (Vite injects `VITE_` but server uses non-prefixed):
- `MASTER_ACCOUNT_EMAIL` (or `VITE_MASTER_ACCOUNT_EMAIL`)
- `MASTER_ACCOUNT_UID` (or `VITE_MASTER_ACCOUNT_UID`)
- `BACKUP_ADMIN_UIDS` (or `VITE_BACKUP_ADMIN_UIDS`)

### In Vercel
Add these environment variables:
```
VITE_MASTER_ACCOUNT_EMAIL=your-email@example.com
VITE_MASTER_ACCOUNT_UID=your-user-uid-here
MASTER_ACCOUNT_EMAIL=your-email@example.com
MASTER_ACCOUNT_UID=your-user-uid-here
```

**Important:** Vercel automatically exposes `VITE_` variables to the client, but server-side API routes need the non-prefixed versions.

## 2. Check Browser Console

Open browser DevTools (F12) and check the Console tab. You should see:

**If master account is detected:**
```
✅ Master/Backup account detected: { email: "...", uid: "...", ... }
```

**If master account is NOT detected:**
```
Master account check - no match: { userEmail: "...", masterEmail: "...", ... }
```

## 3. Get Your User UID

To find your Firebase Auth user UID:
1. Go to Firebase Console: https://console.firebase.google.com/project/seshnx-admin-auth/authentication/users
2. Find your user email
3. Copy the User UID

Or check the browser console after login - it should show the UID in the logs.

## 4. Verify Email/UID Match

The master account check is case-sensitive and must match exactly:
- Email: Must match exactly (case-sensitive)
- UID: Must match exactly

## 5. Check Loading State

If the page is stuck on "Loading...", it means:
- Either `loading` state is still `true`
- Or there's an error preventing `setLoading(false)` from being called

Check the browser console for errors.

## 6. Quick Test

Add these to your `.env.local` (for local development) or Vercel env vars:

```
VITE_MASTER_ACCOUNT_EMAIL=your-actual-email@example.com
VITE_MASTER_ACCOUNT_UID=your-actual-uid-from-firebase-auth
MASTER_ACCOUNT_EMAIL=your-actual-email@example.com
MASTER_ACCOUNT_UID=your-actual-uid-from-firebase-auth
```

Then:
1. Restart dev server (if local) or redeploy (if Vercel)
2. Clear browser cache
3. Try logging in again
4. Check browser console for the log messages

## Common Issues

### Issue: "Loading..." forever
**Cause:** Environment variables not set or incorrect
**Fix:** Verify env vars are set correctly in Vercel, redeploy

### Issue: "Access Denied: Not an Administrator"
**Cause:** Master account check failed
**Fix:** Verify email/UID matches exactly, check console logs

### Issue: Master account works in client but API routes fail
**Cause:** Server-side env vars not set (missing non-VITE_ versions)
**Fix:** Add non-prefixed versions to Vercel env vars

### Issue: Works locally but not in production
**Cause:** Env vars not set in Vercel production environment
**Fix:** Go to Vercel dashboard → Settings → Environment Variables → Add for Production

## Debug Steps

1. **Check console logs** - Look for master account detection messages
2. **Verify env vars** - Make sure they're set in the correct environment
3. **Check Firebase Auth** - Ensure user exists and can login
4. **Test with console.log** - Add temporary logs to see what values are being checked

