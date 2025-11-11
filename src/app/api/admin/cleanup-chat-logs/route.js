import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/admin/cleanup-chat-logs
 * 
 * Mark duplicate chat log entries as dismissed
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const chatLogsCollection = db.collection("chat_logs");
    
    // Find duplicate user messages (same user + same message within short time)
    const duplicates = await chatLogsCollection.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            userMessage: { $toLower: '$userMessage' }
          },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();
    
    let totalMarked = 0;
    const markedQueries = [];
    
    for (const group of duplicates) {
      const docs = group.docs;
      
      // Sort by timestamp
      docs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Keep first, mark rest as dismissed
      const keepDoc = docs[0];
      const dismissIds = docs.slice(1).map(d => d._id);
      
      if (dismissIds.length > 0) {
        await chatLogsCollection.updateMany(
          { _id: { $in: dismissIds } },
          { $set: { dismissed: true, dismissedAt: new Date() } }
        );
        
        totalMarked += dismissIds.length;
        markedQueries.push({
          query: keepDoc.userMessage,
          user: keepDoc.userName,
          duplicates: docs.length,
          marked: dismissIds.length
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Cleanup complete",
      summary: {
        groupsProcessed: duplicates.length,
        duplicatesMarked: totalMarked
      },
      markedQueries
    });
    
  } catch (error) {
    console.error("Error during cleanup:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup chat logs",
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
