/**
 * Test script for brute force protection
 * Run with: node scripts/test-brute-force.js
 */

import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getAttemptCount,
  unlockAccount,
  getLockedAccounts,
} from '../src/lib/brute-force-protection.js';

console.log('🔒 Testing Brute Force Protection\n');

const testEmail = 'test@example.com';

// Test 1: Check initial state
console.log('Test 1: Initial State');
const initialStatus = isAccountLocked(testEmail);
console.log(`Account locked: ${initialStatus.locked}`);
const initialCount = getAttemptCount(testEmail);
console.log(`Attempt count: ${initialCount.count}/${initialCount.count + initialCount.remaining}\n`);

// Test 2: Record failed attempts
console.log('Test 2: Recording Failed Attempts');
for (let i = 1; i <= 5; i++) {
  const result = recordFailedAttempt(testEmail);
  console.log(`Attempt ${i}:`);
  console.log(`  - Locked: ${result.locked}`);
  console.log(`  - Total attempts: ${result.attempts}`);
  if (result.locked) {
    console.log(`  - Locked for: ${Math.ceil(result.remainingTime / 60)} minutes`);
  } else {
    console.log(`  - Remaining attempts: ${result.remainingAttempts}`);
    console.log(`  - Delay: ${result.delay}ms`);
  }
}
console.log();

// Test 3: Check lock status
console.log('Test 3: Lock Status After 5 Attempts');
const lockStatus = isAccountLocked(testEmail);
console.log(`Account locked: ${lockStatus.locked}`);
if (lockStatus.locked) {
  console.log(`Time remaining: ${Math.ceil(lockStatus.remainingTime / 60)} minutes`);
  console.log(`Total attempts: ${lockStatus.attempts}`);
}
console.log();

// Test 4: View all locked accounts
console.log('Test 4: All Locked Accounts');
const lockedAccounts = getLockedAccounts();
console.log(`Total locked accounts: ${lockedAccounts.length}`);
lockedAccounts.forEach(account => {
  console.log(`  - ${account.identifier}: ${account.attempts} attempts, ${Math.ceil(account.remainingTime / 60)} minutes remaining`);
});
console.log();

// Test 5: Manual unlock
console.log('Test 5: Manual Unlock');
const unlockResult = unlockAccount(testEmail);
console.log(`Unlock result: ${unlockResult.message}`);
const afterUnlock = isAccountLocked(testEmail);
console.log(`Account locked after unlock: ${afterUnlock.locked}\n`);

// Test 6: Clear attempts on successful login
console.log('Test 6: Successful Login (Clear Attempts)');
recordFailedAttempt(testEmail);
recordFailedAttempt(testEmail);
console.log(`Attempts before clear: ${getAttemptCount(testEmail).count}`);
clearFailedAttempts(testEmail);
console.log(`Attempts after clear: ${getAttemptCount(testEmail).count}\n`);

console.log('✅ All tests completed!');
