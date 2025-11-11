/**
 * Manual Tracking Test
 * 
 * This script helps you test if tracking is working by showing you exactly what to do.
 */

console.log("🧪 Manual Tracking Test\n");
console.log("═".repeat(80));

console.log("\n📋 STEP-BY-STEP TEST:\n");

console.log("1. Make sure your dev server is running:");
console.log("   npm run dev\n");

console.log("2. Open your browser and login as: demo@student.com\n");

console.log("3. Open Browser DevTools:");
console.log("   - Press F12");
console.log("   - Go to 'Network' tab");
console.log("   - Keep it open\n");

console.log("4. Go to the catalog:");
console.log("   http://localhost:3000/student/books\n");

console.log("5. Click on ANY book to view its details\n");

console.log("6. In the Network tab, look for:");
console.log("   - Request: POST /api/student/books/track");
console.log("   - Status: Should be 200");
console.log("   - Payload: { eventType: 'view', bookId: '...' }\n");

console.log("7. If you DON'T see the request:");
console.log("   a. Hard refresh: Ctrl + Shift + R (or Cmd + Shift + R on Mac)");
console.log("   b. Check Console tab for JavaScript errors");
console.log("   c. Make sure you're logged in\n");

console.log("8. If you SEE the request but status is NOT 200:");
console.log("   - Click on the request");
console.log("   - Check 'Response' tab");
console.log("   - Look for error message\n");

console.log("9. After viewing a book, run:");
console.log("   node scripts/verify-interaction-tracking.js demo@student.com\n");

console.log("10. Expected output:");
console.log("    ✓ Collection 'user_interactions' exists");
console.log("    📊 Total Interactions: 1 (or more)");
console.log("    📈 Interactions by Type:");
console.log("      view: 1\n");

console.log("─".repeat(80));
console.log("\n🔍 DEBUGGING:\n");

console.log("If tracking still doesn't work:\n");

console.log("A. Check if behavior tracker is loaded:");
console.log("   - Open Console tab (F12)");
console.log("   - Type: typeof getBehaviorTracker");
console.log("   - Should output: 'function'\n");

console.log("B. Check if tracking is being called:");
console.log("   - Add this to Console:");
console.log("   ```");
console.log("   const tracker = getBehaviorTracker();");
console.log("   console.log('Tracker:', tracker);");
console.log("   ```");
console.log("   - Should show tracker object\n");

console.log("C. Manually test the API:");
console.log("   - Open Console tab");
console.log("   - Paste this code:");
console.log("   ```javascript");
console.log("   fetch('/api/student/books/track', {");
console.log("     method: 'POST',");
console.log("     headers: { 'content-type': 'application/json' },");
console.log("     body: JSON.stringify({");
console.log("       eventType: 'search',");
console.log("       searchQuery: 'test'");
console.log("     })");
console.log("   })");
console.log("   .then(r => r.json())");
console.log("   .then(data => console.log('Result:', data))");
console.log("   .catch(err => console.error('Error:', err));");
console.log("   ```");
console.log("   - Should output: { ok: true, interactionId: '...' }\n");

console.log("D. Check server logs:");
console.log("   - Look at terminal where dev server is running");
console.log("   - Look for errors when you view a book\n");

console.log("E. Verify database connection:");
console.log("   - Check .env.local has MONGODB_URI");
console.log("   - Check MONGODB_DB_NAME=test");
console.log("   - Restart dev server after changing env vars\n");

console.log("─".repeat(80));
console.log("\n💡 COMMON ISSUES:\n");

console.log("Issue 1: 'getBehaviorTracker is not defined'");
console.log("  Fix: Hard refresh browser (Ctrl + Shift + R)\n");

console.log("Issue 2: Network request shows 401 Unauthorized");
console.log("  Fix: Log out and log back in\n");

console.log("Issue 3: Network request shows 404 Not Found");
console.log("  Fix: Check if book ID is valid\n");

console.log("Issue 4: No network request at all");
console.log("  Fix: ");
console.log("    1. Hard refresh browser");
console.log("    2. Check Console for JavaScript errors");
console.log("    3. Restart dev server: rm -rf .next && npm run dev\n");

console.log("Issue 5: Request succeeds but no data in database");
console.log("  Fix: ");
console.log("    1. Check MongoDB connection");
console.log("    2. Check database name in .env.local");
console.log("    3. Check server logs for errors\n");

console.log("─".repeat(80));
console.log("\n✅ SUCCESS CRITERIA:\n");

console.log("You'll know it's working when:");
console.log("  ✓ Network tab shows POST to /api/student/books/track");
console.log("  ✓ Status is 200");
console.log("  ✓ Response is { ok: true, interactionId: '...' }");
console.log("  ✓ Verification script shows interactions in database");
console.log("  ✓ Recommendations start to personalize\n");

console.log("─".repeat(80));
console.log("\n🎯 QUICK TEST:\n");

console.log("1. Login: http://localhost:3000");
console.log("2. Catalog: http://localhost:3000/student/books");
console.log("3. Click any book");
console.log("4. F12 → Network tab → Look for 'track' request");
console.log("5. Run: node scripts/verify-interaction-tracking.js demo@student.com\n");

console.log("If you see interactions in the database, it's working! 🎉\n");
