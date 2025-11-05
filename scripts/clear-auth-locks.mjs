/**
 * Clear authentication locks
 * This script clears any brute force protection locks
 * Run with: node scripts/clear-auth-locks.mjs
 */

console.log('🔓 Clearing Authentication Locks\n');

console.log('ℹ️  Note: Brute force protection uses in-memory storage.');
console.log('   Locks are automatically cleared when you restart the dev server.\n');

console.log('To clear locks:');
console.log('   1. Stop the dev server (Ctrl+C)');
console.log('   2. Start it again: npm run dev');
console.log('   3. Try logging in again\n');

console.log('Alternative: Wait 15 minutes for locks to expire automatically.\n');

console.log('✅ Instructions provided!');
