#!/usr/bin/env node

/**
 * Script to push all VITE_ environment variables to Vercel
 * 
 * Usage:
 *   node scripts/push-env-to-vercel.js
 * 
 * Requirements:
 *   - Vercel CLI installed: npm i -g vercel
 *   - Logged in to Vercel: vercel login
 *   - .env file with VITE_ variables
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All VITE_ environment variables used in the project
const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const OPTIONAL_VARS = [
  'VITE_MASTER_ACCOUNT_EMAIL',
  'VITE_MASTER_ACCOUNT_UID'
];

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');
  const envLocalPath = join(__dirname, '..', '.env.local');
  
  let envContent = '';
  
  // Try .env.local first (takes precedence)
  if (existsSync(envLocalPath)) {
    console.log('📄 Reading .env.local...');
    envContent = readFileSync(envLocalPath, 'utf-8');
  } else if (existsSync(envPath)) {
    console.log('📄 Reading .env...');
    envContent = readFileSync(envPath, 'utf-8');
  } else {
    console.error('❌ No .env or .env.local file found!');
    process.exit(1);
  }
  
  const vars = {};
  const lines = envContent.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      vars[key.trim()] = value.trim();
    }
  }
  
  return vars;
}

function pushToVercel(key, value, environment = 'production') {
  try {
    console.log(`  ↳ Setting ${key} for ${environment}...`);
    const command = `vercel env add ${key} ${environment}`;
    execSync(command, {
      input: value + '\n',
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8'
    });
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to set ${key}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Pushing environment variables to Vercel...\n');
  
  // Check if vercel CLI is available
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Vercel CLI not found!');
    console.log('   Install it with: npm i -g vercel');
    console.log('   Then login with: vercel login');
    process.exit(1);
  }
  
  const envVars = loadEnvFile();
  const missing = [];
  const toPush = {};
  
  // Check required variables
  for (const key of REQUIRED_VARS) {
    if (envVars[key]) {
      toPush[key] = envVars[key];
    } else {
      missing.push(key);
    }
  }
  
  // Add optional variables if present
  for (const key of OPTIONAL_VARS) {
    if (envVars[key]) {
      toPush[key] = envVars[key];
    }
  }
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing required variables:');
    missing.forEach(key => console.warn(`   - ${key}`));
    console.log('\n   These will be skipped.\n');
  }
  
  if (Object.keys(toPush).length === 0) {
    console.error('❌ No environment variables to push!');
    process.exit(1);
  }
  
  console.log(`📦 Found ${Object.keys(toPush).length} variables to push:\n`);
  Object.keys(toPush).forEach(key => {
    console.log(`   ✓ ${key}`);
  });
  
  console.log('\n🌍 Pushing to environments: production, preview, development\n');
  
  const environments = ['production', 'preview', 'development'];
  let successCount = 0;
  let failCount = 0;
  
  for (const [key, value] of Object.entries(toPush)) {
    for (const env of environments) {
      if (pushToVercel(key, value, env)) {
        successCount++;
      } else {
        failCount++;
      }
    }
  }
  
  console.log('\n✨ Done!');
  console.log(`   ✓ Success: ${successCount}`);
  if (failCount > 0) {
    console.log(`   ✗ Failed: ${failCount}`);
  }
  console.log('\n💡 Note: You can also set these manually in the Vercel dashboard:');
  console.log('   https://vercel.com/[your-project]/settings/environment-variables');
}

main();

