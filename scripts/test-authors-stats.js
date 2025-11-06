/**
 * Test script for authors stats endpoint
 * 
 * This script tests the new /api/admin/authors/stats endpoint
 * to ensure it returns accurate total counts.
 */

async function testAuthorsStats() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  
  console.log("Testing Authors Stats Endpoint...\n");
  
  try {
    // Test stats endpoint
    console.log("1. Fetching author stats...");
    const statsRes = await fetch(`${baseUrl}/api/admin/authors/stats`, {
      headers: {
        "Cookie": process.env.TEST_ADMIN_COOKIE || ""
      }
    });
    
    const statsData = await statsRes.json();
    console.log("Stats Response:", JSON.stringify(statsData, null, 2));
    
    if (statsData.ok) {
      console.log(`✓ Total Authors: ${statsData.totalAuthors}`);
      console.log(`✓ Total Books: ${statsData.totalBooks}`);
    } else {
      console.log(`✗ Error: ${statsData.error}`);
    }
    
    // Test authors list
    console.log("\n2. Fetching authors list...");
    const authorsRes = await fetch(`${baseUrl}/api/admin/authors?page=1&pageSize=5`, {
      headers: {
        "Cookie": process.env.TEST_ADMIN_COOKIE || ""
      }
    });
    
    const authorsData = await authorsRes.json();
    console.log(`✓ Found ${authorsData.total} authors (showing ${authorsData.items?.length || 0})`);
    
    // Verify consistency
    console.log("\n3. Verifying consistency...");
    if (statsData.totalAuthors === authorsData.total) {
      console.log("✓ Author counts match!");
    } else {
      console.log(`✗ Mismatch: Stats shows ${statsData.totalAuthors}, List shows ${authorsData.total}`);
    }
    
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testAuthorsStats();
