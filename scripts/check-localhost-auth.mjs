/**
 * Check localhost authentication setup
 * Run with: node scripts/check-localhost-auth.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Checking Localhost Authentication Setup\n');

// Load and check .env.local
console.log('1️⃣  Environment Variables');
try {
  const envPath = resolve(__dirname, '../.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  
  const vars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key) vars[key] = value;
    }
  });
  
  console.log('   MONGODB_URI:', vars.MONGODB_URI ? '✅ Set' : '❌ Missing');
  console.log('   MONGODB_DB_NAME:', vars.MONGODB_DB_NAME || 'test');
  console.log('   NEXTAUTH_URL:', vars.NEXTAUTH_URL || '❌ Missing');
  console.log('   NEXTAUTH_SECRET:', vars.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing');
  
  // Check if MongoDB URI has database name
  if (vars.MONGODB_URI) {
    const hasDbName = vars.MONGODB_URI.split('/').pop().length > 0;
    console.log('   Database in URI:', hasDbName ? '✅ Yes' : '⚠️  No (using MONGODB_DB_NAME)');
  }
  
  console.log('');
} catch (error) {
  console.log('   ❌ Could not read .env.local:', error.message);
  console.log('');
}

// Check auth files
console.log('2️⃣  Authentication Files');
try {
  const authRoute = resolve(__dirname, '../src/app/api/auth/[...nextauth]/route.js');
  const authPage = resolve(__dirname, '../src/app/auth/page.js');
  const middleware = resolve(__dirname, '../middleware.js');
  
  readFileSync(authRoute, 'utf-8');
  console.log('   ✅ NextAuth route exists');
  
  readFileSync(authPage, 'utf-8');
  console.log('   ✅ Auth page exists');
  
  readFileSync(middleware, 'utf-8');
  console.log('   ✅ Middleware exists');
  
  console.log('');
} catch (error) {
  console.log('   ❌ Missing file:', error.message);
  console.log('');
}

// Instructions
console.log('3️⃣  Testing Instructions');
console.log('   1. Make sure dev server is running: npm run dev');
console.log('   2. Open http://localhost:3000/auth');
console.log('   3. Open Browser DevTools (F12) → Console tab');
console.log('   4. Try logging in with demo credentials:');
console.log('      • Student: student@demo.edu / ReadSmart123');
console.log('      • Admin: admin@libra.ai / ManageStacks!');
console.log('   5. Watch for [AUTH] logs in the terminal');
console.log('   6. Check Network tab for API calls');
console.log('');

console.log('4️⃣  Common Issues & Solutions');
console.log('   ❌ "Invalid credentials" error:');
console.log('      → Check terminal for [AUTH] logs');
console.log('      → Verify password is correct (case-sensitive)');
console.log('      → Check if account is locked (too many attempts)');
console.log('');
console.log('   ❌ No redirect after login:');
console.log('      → Clear browser cookies for localhost:3000');
console.log('      → Check browser console for errors');
console.log('      → Try incognito/private mode');
console.log('');
console.log('   ❌ "Session expired" message:');
console.log('      → Clear sessionStorage in DevTools');
console.log('      → Restart dev server');
console.log('');
console.log('   ❌ Stuck on auth page:');
console.log('      → Check Network tab for failed API calls');
console.log('      → Look for CORS or cookie errors');
console.log('      → Verify NEXTAUTH_URL matches localhost:3000');
console.log('');

console.log('5️⃣  Debug Commands');
console.log('   • Test MongoDB: node scripts/diagnose-auth.js');
console.log('   • Test auth flow: node scripts/test-auth-flow.js');
console.log('   • Clear browser data: DevTools → Application → Clear storage');
console.log('');

console.log('✅ Setup check complete!');
console.log('   If issues persist, check the terminal logs when attempting login.');
