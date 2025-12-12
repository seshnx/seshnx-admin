# PowerShell script to push all VITE_ environment variables to Vercel
# 
# Usage:
#   .\scripts\push-env-to-vercel.ps1
# 
# Requirements:
#   - Vercel CLI installed: npm i -g vercel
#   - Logged in to Vercel: vercel login
#   - .env file with VITE_ variables

$ErrorActionPreference = "Stop"

Write-Host "🚀 Pushing environment variables to Vercel..." -ForegroundColor Cyan
Write-Host ""

# Check if vercel CLI is available
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found!" -ForegroundColor Red
    Write-Host "   Install it with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host "   Then login with: vercel login" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
$envFile = if (Test-Path ".env.local") { ".env.local" } elseif (Test-Path ".env") { ".env" } else { $null }

if (-not $envFile) {
    Write-Host "❌ No .env or .env.local file found!" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading $envFile..." -ForegroundColor Cyan

# Load .env file
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line.Split("=", 2)
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"', "'")
            if ($key.StartsWith("VITE_")) {
                $envVars[$key] = $value
            }
        }
    }
}

# Required variables
$requiredVars = @(
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID"
)

# Optional variables
$optionalVars = @(
    "VITE_MASTER_ACCOUNT_EMAIL",
    "VITE_MASTER_ACCOUNT_UID"
)

# Environments
$environments = @("production", "preview", "development")

Write-Host "📦 Found $($envVars.Count) VITE_ variables to push" -ForegroundColor Cyan
Write-Host ""

# Check for missing required variables
$missing = @()
foreach ($var in $requiredVars) {
    if (-not $envVars.ContainsKey($var)) {
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host "⚠️  Missing required variables:" -ForegroundColor Yellow
    foreach ($var in $missing) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Push variables
$successCount = 0
$failCount = 0

foreach ($var in $envVars.Keys) {
    if ($envVars[$var]) {
        Write-Host "  ✓ Pushing $var..." -ForegroundColor Green
        
        foreach ($env in $environments) {
            try {
                $value = $envVars[$var]
                $value | vercel env add $var $env --yes 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    $successCount++
                } else {
                    # Try removing and re-adding
                    vercel env rm $var $env --yes 2>&1 | Out-Null
                    $value | vercel env add $var $env --yes 2>&1 | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        $successCount++
                    } else {
                        $failCount++
                        Write-Host "    ❌ Failed to set $var for $env" -ForegroundColor Red
                    }
                }
            } catch {
                $failCount++
                Write-Host "    ❌ Error setting $var for $env : $_" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
Write-Host "   ✓ Success: $successCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "   ✗ Failed: $failCount" -ForegroundColor Red
}
Write-Host ""
Write-Host "💡 You can verify in the Vercel dashboard:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/[your-project]/settings/environment-variables" -ForegroundColor Cyan

