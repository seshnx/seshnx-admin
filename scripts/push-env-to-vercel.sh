#!/bin/bash

# Script to push all VITE_ environment variables to Vercel
# 
# Usage:
#   bash scripts/push-env-to-vercel.sh
# 
# Requirements:
#   - Vercel CLI installed: npm i -g vercel
#   - Logged in to Vercel: vercel login
#   - .env file with VITE_ variables

set -e

echo "🚀 Pushing environment variables to Vercel..."
echo ""

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "   Install it with: npm i -g vercel"
    echo "   Then login with: vercel login"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ] && [ ! -f .env.local ]; then
    echo "❌ No .env or .env.local file found!"
    exit 1
fi

# Source the .env file (prefer .env.local)
if [ -f .env.local ]; then
    echo "📄 Reading .env.local..."
    source .env.local
elif [ -f .env ]; then
    echo "📄 Reading .env..."
    source .env
fi

# Required variables
REQUIRED_VARS=(
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_AUTH_DOMAIN"
    "VITE_FIREBASE_PROJECT_ID"
    "VITE_FIREBASE_STORAGE_BUCKET"
    "VITE_FIREBASE_MESSAGING_SENDER_ID"
    "VITE_FIREBASE_APP_ID"
)

# Optional variables
OPTIONAL_VARS=(
    "VITE_MASTER_ACCOUNT_EMAIL"
    "VITE_MASTER_ACCOUNT_UID"
)

# Environments
ENVIRONMENTS=("production" "preview" "development")

echo "📦 Pushing variables to Vercel..."
echo ""

# Push required variables
for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "  ✓ Pushing $var..."
        for env in "${ENVIRONMENTS[@]}"; do
            echo "${!var}" | vercel env add "$var" "$env" --yes 2>/dev/null || \
            vercel env rm "$var" "$env" --yes 2>/dev/null; \
            echo "${!var}" | vercel env add "$var" "$env" --yes
        done
    else
        echo "  ⚠️  Missing: $var"
    fi
done

# Push optional variables if present
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        echo "  ✓ Pushing $var..."
        for env in "${ENVIRONMENTS[@]}"; do
            echo "${!var}" | vercel env add "$var" "$env" --yes 2>/dev/null || \
            vercel env rm "$var" "$env" --yes 2>/dev/null; \
            echo "${!var}" | vercel env add "$var" "$env" --yes
        done
    fi
done

echo ""
echo "✨ Done! All environment variables have been pushed to Vercel."
echo ""
echo "💡 You can verify in the Vercel dashboard:"
echo "   https://vercel.com/[your-project]/settings/environment-variables"

