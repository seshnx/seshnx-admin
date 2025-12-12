# Super Global Admin / App Master Account Setup

## Overview

The Super Global Admin (also called the App Master Account) is a special administrative account with the highest level of access to the SeshNx Admin App. This account can access the admin panel even without a user profile in Firestore, making it ideal for initial setup and recovery scenarios.

## Configuration

The Master Account can be configured via environment variables:

```env
# Option 1: By Email (recommended)
VITE_MASTER_ACCOUNT_EMAIL=master@seshnx.com

# Option 2: By User ID (alternative)
VITE_MASTER_ACCOUNT_UID=firebase-user-id-here
```

**Note**: You can use either email or UID, but email is recommended for easier management.

## Features

### Master Account Capabilities

1. **Always Has Access**: The Master Account can access the admin panel even if no user profile exists in Firestore
2. **All GAdmin Permissions**: Has all the same permissions as Global Admins (GAdmin)
3. **SuperAdmin Role Management**: Can grant and revoke SuperAdmin role from other users
4. **Bypass Profile Checks**: Can access the system during initial setup before profiles are created

### SuperAdmin Role

Users with the `SuperAdmin` role in their `accountTypes` array have:

- All GAdmin permissions
- Ability to grant/revoke SuperAdmin role
- Visual distinction in the UI (golden crown icon)
- Protected from accidental role removal (requires confirmation)

## Setting Up the Master Account

### Method 1: Environment Variable Only

1. Set `VITE_MASTER_ACCOUNT_EMAIL` or `VITE_MASTER_ACCOUNT_UID` in your `.env` file
2. Create a Firebase Auth user with the matching email/UID
3. The user can now log in without needing a Firestore profile

### Method 2: With Firestore Profile (Recommended)

1. Create the Firebase Auth user
2. Create a user profile at: `artifacts/{appId}/users/{userId}/profiles/main`
3. Set `accountTypes: ['SuperAdmin']` in the profile
4. Optionally set environment variable as a backup

### Example Profile Structure

```javascript
{
  accountTypes: ['SuperAdmin'],
  firstName: 'Master',
  lastName: 'Admin',
  email: 'master@seshnx.com',
  // ... other profile fields
}
```

## Security Considerations

1. **Keep Master Account Credentials Secure**: Store environment variables securely and limit access
2. **Use MFA**: Enable multi-factor authentication for the Master Account
3. **Monitor Access**: Review logs for Master Account access regularly
4. **Backup Configuration**: Document Master Account email/UID in secure location
5. **Limit SuperAdmin Grants**: Only grant SuperAdmin role to trusted administrators

## Visual Indicators

- **Crown Icon**: SuperAdmin users display a golden crown icon (👑) next to their role
- **Golden Badge**: SuperAdmin role badge has a yellow/gold color scheme
- **Sidebar Indicator**: Crown icon appears in the sidebar when logged in as SuperAdmin

## Role Hierarchy

```
SuperAdmin (App Master Account)
  └── Full platform access
      └── Can manage SuperAdmin role
          └── Can manage GAdmin role
              └── Can manage EDUAdmin role

GAdmin (Global Admin)
  └── Platform administration
      └── Can manage GAdmin role (with restrictions)
          └── Can manage EDUAdmin role

EDUAdmin (School Admin)
  └── School-specific administration
      └── Cannot manage admin roles
```

## Troubleshooting

### Master Account Cannot Login

1. Verify environment variable is set correctly
2. Check that email/UID matches Firebase Auth user exactly
3. Verify Firebase Auth user exists
4. Check browser console for errors

### SuperAdmin Role Not Showing

1. Verify `accountTypes` array includes `'SuperAdmin'`
2. Check profile path: `artifacts/{appId}/users/{userId}/profiles/main`
3. Refresh the page after role change
4. Clear browser cache if needed

## Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_MASTER_ACCOUNT_EMAIL` | Master account email | No* | `master@seshnx.com` |
| `VITE_MASTER_ACCOUNT_UID` | Master account Firebase UID | No* | `abc123xyz...` |

*At least one should be set for Master Account functionality

