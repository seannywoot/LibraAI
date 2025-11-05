import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    
    // Get total searches (chat logs)
    const chatLogsCollection = db.collection("chat_logs");
    const totalSearches = await chatLogsCollection.countDocuments();
    
    // Get recent searches (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSearches = await chatLogsCollection.countDocuments({
      timestamp: { $gte: oneDayAgo }
    });
    
    // Get total FAQs
    const faqCollection = db.collection("faqs");
    const totalFAQs = await faqCollection.countDocuments();
    
    // Get recent FAQs (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFAQs = await faqCollection.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });
    
    // Get unanswered questions (from chat logs with specific patterns)
    const unansweredQuestions = await chatLogsCollection.find({
      $or: [
        { aiResponse: /I don't have|I'm not sure|I cannot/i },
        { userMessage: /how to|what is|where can/i }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();
    
    // Get FAQ feedback (simulated - you can add a feedback collection later)
    const faqFeedback = await faqCollection.aggregate([
      {
        $project: {
          question: 1,
          category: 1,
          createdAt: 1,
          feedback: { $ifNull: ["$feedback", "helpful"] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    // Get most searched keywords
    const topKeywords = await chatLogsCollection.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $project: {
          words: {
            $split: [
              { $toLower: "$userMessage" },
              " "
            ]
          }
        }
      },
      { $unwind: "$words" },
      {
        $match: {
          words: {
            $nin: ["the", "a", "an", "is", "are", "how", "what", "where", "when", "why", "can", "i", "you", "to", "in", "on", "at", "for", "of", "with"]
          },
          $expr: { $gte: [{ $strLenCP: "$words" }, 4] }
        }
      },
      {
        $group: {
          _id: "$words",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();

    return NextResponse.json({
      success: true,
      data: {
        totalSearches,
        recentSearches,
        totalFAQs,
        recentFAQs,
        unansweredCount: unansweredQuestions.length,
        unansweredQuestions: unansweredQuestions.map(q => ({
          id: q._id,
          question: q.userMessage,
          timestamp: q.timestamp,
          user: q.userName || "Anonymous"
        })),
        faqFeedback: faqFeedback.map(f => ({
          id: f._id,
          question: f.question,
          category: f.category,
          feedback: f.feedback,
          date: f.createdAt
        })),
        topKeywords: topKeywords.map(k => ({
          keyword: k._id,
          count: k.count
        }))
      }
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
