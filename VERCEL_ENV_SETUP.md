# Vercel Environment Variables Setup

This document explains how to push all `VITE_` environment variables to Vercel.

## Required Environment Variables

The following environment variables are required for the SeshNx Admin App:

### Firebase Configuration (Required)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Master Account Configuration (Optional)
- `VITE_MASTER_ACCOUNT_EMAIL` - Email for App Master Account
- `VITE_MASTER_ACCOUNT_UID` - Firebase UID for App Master Account

## Method 1: Automated Script (Recommended)

### Using Node.js Script

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Ensure your `.env` or `.env.local` file exists** with all variables

4. **Run the script**:
   ```bash
   node scripts/push-env-to-vercel.js
   ```

### Using Bash Script

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Make the script executable**:
   ```bash
   chmod +x scripts/push-env-to-vercel.sh
   ```

4. **Run the script**:
   ```bash
   bash scripts/push-env-to-vercel.sh
   ```

## Method 2: Manual via Vercel CLI

### Push Individual Variables

For each environment variable, run:

```bash
# For production environment
echo "your-value-here" | vercel env add VITE_FIREBASE_API_KEY production

# For preview environment
echo "your-value-here" | vercel env add VITE_FIREBASE_API_KEY preview

# For development environment
echo "your-value-here" | vercel env add VITE_FIREBASE_API_KEY development
```

### Example: Push All Firebase Variables

```bash
# Set your values
export API_KEY="your-api-key"
export AUTH_DOMAIN="your-auth-domain"
export PROJECT_ID="your-project-id"
export STORAGE_BUCKET="your-storage-bucket"
export MESSAGING_SENDER_ID="your-messaging-sender-id"
export APP_ID="your-app-id"

# Push to all environments
for env in production preview development; do
  echo "$API_KEY" | vercel env add VITE_FIREBASE_API_KEY $env
  echo "$AUTH_DOMAIN" | vercel env add VITE_FIREBASE_AUTH_DOMAIN $env
  echo "$PROJECT_ID" | vercel env add VITE_FIREBASE_PROJECT_ID $env
  echo "$STORAGE_BUCKET" | vercel env add VITE_FIREBASE_STORAGE_BUCKET $env
  echo "$MESSAGING_SENDER_ID" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID $env
  echo "$APP_ID" | vercel env add VITE_FIREBASE_APP_ID $env
done
```

## Method 3: Via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable manually:
   - Click **Add New**
   - Enter the variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - Enter the value
   - Select environments (Production, Preview, Development)
   - Click **Save**

## Verify Variables

After pushing, verify the variables are set:

```bash
vercel env ls
```

Or check in the Vercel dashboard:
- Go to your project
- Settings → Environment Variables

## Important Notes

1. **Environment Scope**: Variables are pushed to all three environments:
   - `production` - Production deployments
   - `preview` - Preview deployments (PR previews)
   - `development` - Development deployments

2. **Security**: Never commit `.env` files to git. Use `.env.local` for local development and keep it in `.gitignore`.

3. **Updates**: If you need to update a variable, you can:
   - Remove it first: `vercel env rm VARIABLE_NAME production`
   - Add it again: `vercel env add VARIABLE_NAME production`
   - Or update via the dashboard

4. **Master Account**: The `VITE_MASTER_ACCOUNT_EMAIL` and `VITE_MASTER_ACCOUNT_UID` are optional but recommended for the App Master Account feature.

## Troubleshooting

### "Vercel CLI not found"
Install it: `npm i -g vercel`

### "Not logged in"
Login: `vercel login`

### "Variable already exists"
Remove it first: `vercel env rm VARIABLE_NAME production` then add it again.

### Variables not appearing in builds
- Make sure variable names start with `VITE_`
- Check that variables are set for the correct environment
- Redeploy after adding variables: `vercel --prod`

## Quick Reference

```bash
# List all environment variables
vercel env ls

# Add a variable
echo "value" | vercel env add VARIABLE_NAME production

# Remove a variable
vercel env rm VARIABLE_NAME production

# Pull variables (for local .env file)
vercel env pull .env.local
```

