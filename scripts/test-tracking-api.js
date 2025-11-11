/**
 * Test Tracking API
 * 
 * This script tests if the tracking API endpoint is working properly.
 * Run this while the dev server is running.
 * 
 * Usage: node scripts/test-tracking-api.js
 */

console.log("🧪 Testing Tracking API\n");
console.log("═".repeat(80));

console.log("\n⚠️  IMPORTANT:");
console.log("   This script tests the API endpoint directly.");
console.log("   Make sure your dev server is running (npm run dev)");
console.log("   You need to be logged in to test authenticated endpoints.\n");

console.log("📋 Manual Test Steps:");
console.log("─".repeat(80));

console.log("\n1. Open Browser DevTools (F12)");
console.log("   - Go to Console tab");

console.log("\n2. Navigate to a book detail page");
console.log("   - Example: http://localhost:3000/student/books/[bookId]");

console.log("\n3. Check Network tab for tracking calls");
console.log("   - Filter by 'track'");
console.log("   - Should see POST to /api/student/books/track");
console.log("   - Status should be 200");

console.log("\n4. Test in Console:");
console.log("   Copy and paste this code:\n");

console.log("```javascript");
console.log("// Test view tracking");
console.log("fetch('/api/student/books/track', {");
console.log("  method: 'POST',");
console.log("  headers: { 'content-type': 'application/json' },");
console.log("  body: JSON.stringify({");
console.log("    eventType: 'view',");
console.log("    bookId: 'REPLACE_WITH_REAL_BOOK_ID'");
console.log("  })");
console.log("})");
console.log(".then(r => r.json())");
console.log(".then(data => console.log('View tracked:', data))");
console.log(".catch(err => console.error('Error:', err));");
console.log("");
console.log("// Test search tracking");
console.log("fetch('/api/student/books/track', {");
console.log("  method: 'POST',");
console.log("  headers: { 'content-type': 'application/json' },");
console.log("  body: JSON.stringify({");
console.log("    eventType: 'search',");
console.log("    searchQuery: 'test search'");
console.log("  })");
console.log("})");
console.log(".then(r => r.json())");
console.log(".then(data => console.log('Search tracked:', data))");
console.log(".catch(err => console.error('Error:', err));");
console.log("```\n");

console.log("5. Expected Response:");
console.log("   ✓ Success: { ok: true, interactionId: '...' }");
console.log("   ❌ Error: { ok: false, error: '...' }\n");

console.log("6. Common Errors:");
console.log("   - 401 Unauthorized: Not logged in");
console.log("   - 400 Bad Request: Missing required fields");
console.log("   - 404 Not Found: Book doesn't exist");
console.log("   - 429 Rate Limit: Too many requests");
console.log("   - 500 Server Error: Database or server issue\n");

console.log("7. Verify in Database:");
console.log("   Run: node scripts/verify-interaction-tracking.js [your-email]\n");

console.log("─".repeat(80));
console.log("\n💡 Quick Test:");
console.log("   1. Login as student");
console.log("   2. View a book detail page");
console.log("   3. Open Network tab (F12)");
console.log("   4. Look for POST to /api/student/books/track");
console.log("   5. Check if status is 200");
console.log("   6. Run: node scripts/verify-interaction-tracking.js\n");

console.log("─".repeat(80));
console.log("\n🔍 Debugging Tips:");
console.log("   - Check browser console for errors");
console.log("   - Check Network tab for failed requests");
console.log("   - Check server logs for API errors");
console.log("   - Verify MongoDB connection");
console.log("   - Check if user is authenticated\n");

console.log("─".repeat(80));
console.log("\n📝 What to Check:");

console.log("\n  Frontend (Browser):");
console.log("    [ ] Behavior tracker is initialized");
console.log("    [ ] trackBookView() is called when viewing books");
console.log("    [ ] trackSearch() is called when searching");
console.log("    [ ] No JavaScript errors in console");
console.log("    [ ] Network requests show 200 status");

console.log("\n  Backend (API):");
console.log("    [ ] /api/student/books/track endpoint exists");
console.log("    [ ] Authentication is working");
console.log("    [ ] MongoDB connection is active");
console.log("    [ ] Interactions are being inserted");
console.log("    [ ] No server errors in logs");

console.log("\n  Database:");
console.log("    [ ] user_interactions collection exists");
console.log("    [ ] Documents are being inserted");
console.log("    [ ] Indexes are created");
console.log("    [ ] TTL index is working (90 days)");

console.log("\n─".repeat(80));
console.log("\n✅ Next Steps:");
console.log("   1. Test the API manually (steps above)");
console.log("   2. Verify database: node scripts/verify-interaction-tracking.js");
console.log("   3. Check recommendations: node scripts/check-user-recommendations.js");
console.log("   4. If issues, check: TROUBLESHOOTING_INTERACTION_TRACKING.md\n");
