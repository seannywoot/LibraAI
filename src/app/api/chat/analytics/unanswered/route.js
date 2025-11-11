import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * POST /api/chat/analytics/unanswered
 * 
 * Log unanswered/repeated queries for analytics
 * Tracks when users ask the same question multiple times (indicating dissatisfaction)
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    
    const {
      query,
      conversationId,
      attemptNumber,
      timeSinceLastAttempt,
      previousResponseIndex
    } = body;

    const db = await getDb();
    const unansweredQueriesCollection = db.collection("unanswered_queries");

    // Create or update unanswered query log
    const logEntry = {
      userId: session?.user?.email || "anonymous",
      userName: session?.user?.name || "Anonymous User",
      query,
      conversationId: conversationId || null,
      attemptNumber,
      timeSinceLastAttempt, // seconds
      previousResponseIndex,
      timestamp: new Date(),
      resolved: false, // Will be marked true if user doesn't ask again
    };

    // Check if this query already exists in the log
    // Escape special regex characters in the query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Build query to find existing entry
    // Match by userId + query + conversationId (or both null)
    const findQuery = {
      userId: logEntry.userId,
      query: { $regex: new RegExp(`^${escapedQuery}$`, 'i') },
      resolved: false
    };
    
    // If conversationId exists, match it; otherwise match null conversationId
    if (conversationId) {
      findQuery.conversationId = conversationId;
    } else {
      findQuery.conversationId = null;
    }
    
    const existingLog = await unansweredQueriesCollection.findOne(findQuery);

    if (existingLog) {
      // Update existing log with new attempt
      await unansweredQueriesCollection.updateOne(
        { _id: existingLog._id },
        {
          $set: {
            attemptNumber,
            lastAttemptTimestamp: new Date(),
            timeSinceLastAttempt
          },
          $inc: { totalAttempts: 1 }
        }
      );
    } else {
      // Create new log entry
      await unansweredQueriesCollection.insertOne({
        ...logEntry,
        totalAttempts: attemptNumber,
        firstAttemptTimestamp: new Date(),
        lastAttemptTimestamp: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: "Unanswered query logged"
    });
  } catch (error) {
    console.error("Error logging unanswered query:", error);
    return NextResponse.json(
      {
        error: "Failed to log unanswered query",
        success: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat/analytics/unanswered
 * 
 * Get analytics about unanswered queries
 * Useful for admin dashboard to see which queries users struggle with
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users (could add admin check)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const unansweredQueriesCollection = db.collection("unanswered_queries");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const resolved = searchParams.get('resolved') === 'true';

    // Aggregate statistics
    const topUnanswered = await unansweredQueriesCollection
      .aggregate([
        { $match: { resolved: resolved } },
        {
          $group: {
            _id: "$query",
            count: { $sum: 1 },
            totalAttempts: { $sum: "$totalAttempts" },
            avgTimeBetweenAttempts: { $avg: "$timeSinceLastAttempt" },
            users: { $addToSet: "$userId" },
            lastSeen: { $max: "$lastAttemptTimestamp" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ])
      .toArray();

    // Get recent unanswered queries
    const recentUnanswered = await unansweredQueriesCollection
      .find({ resolved: false })
      .sort({ lastAttemptTimestamp: -1 })
      .limit(20)
      .toArray();

    // Get overall statistics
    const stats = await unansweredQueriesCollection.aggregate([
      {
        $group: {
          _id: null,
          totalUnanswered: { $sum: 1 },
          totalAttempts: { $sum: "$totalAttempts" },
          avgAttemptsPerQuery: { $avg: "$totalAttempts" },
          uniqueUsers: { $addToSet: "$userId" }
        }
      }
    ]).toArray();

    return NextResponse.json({
      success: true,
      topUnanswered: topUnanswered.map(item => ({
        query: item._id,
        occurrences: item.count,
        totalAttempts: item.totalAttempts,
        avgTimeBetweenAttempts: Math.round(item.avgTimeBetweenAttempts || 0),
        affectedUsers: item.users.length,
        lastSeen: item.lastSeen
      })),
      recentUnanswered: recentUnanswered.map(item => ({
        query: item.query,
        user: item.userName,
        attempts: item.totalAttempts,
        lastAttempt: item.lastAttemptTimestamp,
        conversationId: item.conversationId
      })),
      statistics: stats[0] ? {
        totalUnansweredQueries: stats[0].totalUnanswered,
        totalAttempts: stats[0].totalAttempts,
        avgAttemptsPerQuery: Math.round(stats[0].avgAttemptsPerQuery * 10) / 10,
        uniqueUsersAffected: stats[0].uniqueUsers.length
      } : null
    });
  } catch (error) {
    console.error("Error fetching unanswered query analytics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch analytics",
        success: false,
      },
      { status: 500 }
    );
  }
}
