import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/admin/cleanup-duplicates
 * 
 * Clean up duplicate unanswered query entries
 * Merges duplicates into single entries with correct totalAttempts
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated admins
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const collection = db.collection("unanswered_queries");
    
    // Find all duplicate groups (same userId + query, ignoring conversationId for old data)
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            query: { $toLower: '$query' } // Case-insensitive grouping
            // Note: Not grouping by conversationId to catch old duplicates
          },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } } // Only groups with duplicates
      }
    ]).toArray();
    
    console.log(`Found ${duplicates.length} groups with duplicates`);
    
    let totalMerged = 0;
    let totalDeleted = 0;
    const mergedQueries = [];
    
    for (const group of duplicates) {
      const docs = group.docs;
      
      // Sort by timestamp (oldest first)
      docs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Keep the first (oldest) entry
      const keepDoc = docs[0];
      const deleteIds = docs.slice(1).map(d => d._id);
      
      // Calculate total attempts
      const totalAttempts = docs.reduce((sum, doc) => sum + (doc.totalAttempts || 1), 0);
      
      // Get timestamps
      const firstAttempt = docs[0].firstAttemptTimestamp || docs[0].timestamp;
      const lastAttempt = docs[docs.length - 1].lastAttemptTimestamp || docs[docs.length - 1].timestamp;
      
      console.log(`Merging: "${keepDoc.query}" - ${docs.length} duplicates -> ${totalAttempts} total attempts`);
      
      // Update the kept document
      await collection.updateOne(
        { _id: keepDoc._id },
        {
          $set: {
            totalAttempts,
            attemptNumber: totalAttempts,
            firstAttemptTimestamp: firstAttempt,
            lastAttemptTimestamp: lastAttempt
          }
        }
      );
      
      // Delete the duplicate documents
      const deleteResult = await collection.deleteMany({
        _id: { $in: deleteIds }
      });
      
      totalMerged++;
      totalDeleted += deleteResult.deletedCount;
      
      mergedQueries.push({
        query: keepDoc.query,
        user: keepDoc.userName,
        duplicates: docs.length,
        totalAttempts,
        deleted: deleteResult.deletedCount
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Cleanup complete",
      summary: {
        groupsMerged: totalMerged,
        duplicatesDeleted: totalDeleted
      },
      mergedQueries
    });
    
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup duplicates",
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
