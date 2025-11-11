import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/admin/inspect-duplicates
 * 
 * Inspect the actual structure of unanswered queries to debug cleanup
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const collection = db.collection("unanswered_queries");
    
    // Get all documents
    const allDocs = await collection.find({}).limit(20).toArray();
    
    // Get count
    const totalCount = await collection.countDocuments({});
    
    // Group by query to see duplicates
    const groupedByQuery = {};
    allDocs.forEach(doc => {
      const key = doc.query.toLowerCase();
      if (!groupedByQuery[key]) {
        groupedByQuery[key] = [];
      }
      groupedByQuery[key].push({
        _id: doc._id.toString(),
        query: doc.query,
        userId: doc.userId,
        userName: doc.userName,
        conversationId: doc.conversationId,
        resolved: doc.resolved,
        timestamp: doc.timestamp,
        totalAttempts: doc.totalAttempts,
        attemptNumber: doc.attemptNumber
      });
    });
    
    // Find duplicates
    const duplicates = Object.entries(groupedByQuery)
      .filter(([_, docs]) => docs.length > 1)
      .map(([query, docs]) => ({
        query,
        count: docs.length,
        docs
      }));
    
    return NextResponse.json({
      success: true,
      totalDocuments: totalCount,
      sampleDocuments: allDocs.map(doc => ({
        _id: doc._id.toString(),
        query: doc.query,
        userId: doc.userId,
        userName: doc.userName,
        conversationId: doc.conversationId,
        resolved: doc.resolved,
        timestamp: doc.timestamp,
        totalAttempts: doc.totalAttempts,
        attemptNumber: doc.attemptNumber,
        hasFirstAttempt: !!doc.firstAttemptTimestamp,
        hasLastAttempt: !!doc.lastAttemptTimestamp
      })),
      duplicateGroups: duplicates
    });
    
  } catch (error) {
    console.error("Error inspecting duplicates:", error);
    return NextResponse.json(
      {
        error: "Failed to inspect duplicates",
        details: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
