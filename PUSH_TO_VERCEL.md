# Quick Guide: Push Environment Variables to Vercel

## All VITE_ Variables Needed

### Required Firebase Variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### Optional Master Account Variables:
- `VITE_MASTER_ACCOUNT_EMAIL`
- `VITE_MASTER_ACCOUNT_UID`

## Quick Method: Use PowerShell Script (Windows)

1. **Open PowerShell in the project directory**

2. **Run the script:**
   ```powershell
   .\scripts\push-env-to-vercel.ps1
   ```

## Alternative: Manual Vercel CLI Commands

### Step 1: Install Vercel CLI (if needed)
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Push Each Variable

For each variable, run these commands (replace `YOUR_VALUE` with actual value):

```bash
# Firebase API Key
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_API_KEY production
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_API_KEY preview
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_API_KEY development

# Firebase Auth Domain
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_AUTH_DOMAIN production
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_AUTH_DOMAIN preview
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_AUTH_DOMAIN development

# Firebase Project ID
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_PROJECT_ID production
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_PROJECT_ID preview
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_PROJECT_ID development

# Firebase Storage Bucket
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_STORAGE_BUCKET preview
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_STORAGE_BUCKET development

# Firebase Messaging Sender ID
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID preview
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID development

# Firebase App ID
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_APP_ID production
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_APP_ID preview
echo "YOUR_VALUE" | vercel env add VITE_FIREBASE_APP_ID development

# Master Account Email (optional)
echo "YOUR_VALUE" | vercel env add VITE_MASTER_ACCOUNT_EMAIL production
echo "YOUR_VALUE" | vercel env add VITE_MASTER_ACCOUNT_EMAIL preview
echo "YOUR_VALUE" | vercel env add VITE_MASTER_ACCOUNT_EMAIL development

# Master Account UID (optional)
echo "YOUR_VALUE" | vercel env add VITE_MASTER_ACCOUNT_UID production
echo "YOUR_VALUE" | vercel env add VITE_MASTER_ACCOUNT_UID preview
echo "YOUR_VALUE" | vercel env add VITE_MASTER_ACCOUNT_UID development
```

### Step 4: Verify
```bash
vercel env ls
```

## Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New** for each variable:
   - Name: `VITE_FIREBASE_API_KEY` (etc.)
   - Value: Your actual value
   - Select environments: Production, Preview, Development
   - Click **Save**

## One-Liner PowerShell Script (Reads from .env)

If you have a `.env` file, you can use this PowerShell one-liner:

```powershell
$vars = @("VITE_FIREBASE_API_KEY","VITE_FIREBASE_AUTH_DOMAIN","VITE_FIREBASE_PROJECT_ID","VITE_FIREBASE_STORAGE_BUCKET","VITE_FIREBASE_MESSAGING_SENDER_ID","VITE_FIREBASE_APP_ID","VITE_MASTER_ACCOUNT_EMAIL","VITE_MASTER_ACCOUNT_UID"); $envs = @("production","preview","development"); Get-Content .env | ForEach-Object { if($_ -match "^([^=]+)=(.*)$") { $key = $matches[1].Trim(); $val = $matches[2].Trim().Trim('"',"'"); if($vars -contains $key -and $val) { foreach($e in $envs) { Write-Host "Pushing $key to $e"; $val | vercel env add $key $e --yes } } } }
```

## Troubleshooting

- **Not logged in**: Run `vercel login`
- **CLI not found**: Run `npm i -g vercel`
- **Variable already exists**: Remove it first with `vercel env rm VARIABLE_NAME production`
- **Need to update**: Remove and re-add, or update via dashboard

