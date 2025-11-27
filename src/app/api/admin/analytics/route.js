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

    const { searchParams } = new URL(request.url);
    const queriesPage = parseInt(searchParams.get("queriesPage") || "1", 10);
    const feedbackPage = parseInt(searchParams.get("feedbackPage") || "1", 10);
    const pageSize = 5;

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

    // Improved filtering for unanswered questions
    // Patterns indicating the AI couldn't answer properly
    const uncertaintyPatterns = [
      /I don't have|I'm not sure|I cannot|I can't|I apologize|I'm sorry/i,
      /don't know|unable to|not able to|no information|not available/i,
      /try again|please rephrase|could you clarify|need more context/i,
      /having trouble|can't help with that|outside my knowledge/i,
      /I'm having trouble generating|failed to get response/i
    ];

    // Patterns indicating user is asking a question
    const questionPatterns = [
      /^(how|what|when|where|why|who|which|can|could|would|should|is|are|do|does)/i,
      /\?$/,  // Ends with question mark
      /tell me|show me|explain|help me|I need|I want to know/i,
      /looking for|searching for|find out|wondering/i
    ];

    // Build query for unanswered questions
    const unansweredQuery = {
      $and: [
        {
          $or: [
            // AI response indicates uncertainty or inability to answer
            ...uncertaintyPatterns.map(pattern => ({ aiResponse: pattern })),
            // User message looks like a question
            ...questionPatterns.map(pattern => ({ userMessage: pattern }))
          ]
        },
        // Exclude already converted questions
        { convertedToFAQ: { $ne: true } },
        // Exclude dismissed questions
        { dismissed: { $ne: true } },
        // Exclude very short messages (likely not real questions)
        { $expr: { $gte: [{ $strLenCP: "$userMessage" }, 10] } }
      ]
    };

    // Get deduplicated unanswered questions using aggregation
    const unansweredQuestionsAggregation = await chatLogsCollection.aggregate([
      { $match: unansweredQuery },
      {
        $group: {
          _id: {
            userId: '$userId',
            userMessage: { $toLower: '$userMessage' } // Case-insensitive grouping
          },
          count: { $sum: 1 }, // Count duplicates
          firstAsked: { $min: '$timestamp' },
          lastAsked: { $max: '$timestamp' },
          // Keep first occurrence data
          userMessage: { $first: '$userMessage' },
          aiResponse: { $first: '$aiResponse' },
          userId: { $first: '$userId' },
          userName: { $first: '$userName' },
          conversationId: { $first: '$conversationId' },
          _idOriginal: { $first: '$_id' }
        }
      },
      { $sort: { lastAsked: -1 } }, // Sort by most recent
      { $skip: (queriesPage - 1) * pageSize },
      { $limit: pageSize }
    ]).toArray();

    // Get total count of unique unanswered questions
    const uniqueUnansweredCount = await chatLogsCollection.aggregate([
      { $match: unansweredQuery },
      {
        $group: {
          _id: {
            userId: '$userId',
            userMessage: { $toLower: '$userMessage' }
          }
        }
      },
      { $count: 'total' }
    ]).toArray();

    const totalUnansweredCount = uniqueUnansweredCount[0]?.total || 0;

    // Format the results
    const unansweredQuestions = unansweredQuestionsAggregation.map(item => ({
      _id: item._idOriginal,
      userMessage: item.userMessage,
      aiResponse: item.aiResponse,
      userId: item.userId,
      userName: item.userName,
      conversationId: item.conversationId,
      timestamp: item.lastAsked, // Use last asked time
      askedCount: item.count, // How many times asked
      firstAsked: item.firstAsked,
      lastAsked: item.lastAsked
    }));

    // Get FAQ feedback from the feedback collection
    const feedbackCollection = db.collection("faq_feedback");

    // Get total count of FAQ feedback
    const totalFeedbackCount = await feedbackCollection.countDocuments();

    // Get FAQ feedback with pagination (5 per page)
    const faqFeedback = await feedbackCollection
      .find({})
      .sort({ createdAt: -1 })
      .skip((feedbackPage - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    // Get transaction statistics
    const transactionsCollection = db.collection("transactions");

    // Pending borrow requests
    const pendingBorrowRequests = await transactionsCollection.countDocuments({
      status: "pending-approval"
    });

    // Recent pending requests (last 24 hours)
    const recentPendingRequests = await transactionsCollection.countDocuments({
      status: "pending-approval",
      requestedAt: { $gte: oneDayAgo }
    });

    // Return requests
    const returnRequests = await transactionsCollection.countDocuments({
      status: "return-requested"
    });

    // Recent return requests (last 24 hours)
    const recentReturnRequests = await transactionsCollection.countDocuments({
      status: "return-requested",
      returnRequestedAt: { $gte: oneDayAgo }
    });

    // Total active transactions (borrowed books)
    const activeTransactions = await transactionsCollection.countDocuments({
      status: "borrowed"
    });

    // Recent transactions (last 24 hours)
    const recentTransactions = await transactionsCollection.countDocuments({
      status: "borrowed",
      borrowedAt: { $gte: oneDayAgo }
    });

    // Get top books, searches, and users
    const interactionsCollection = db.collection("user_interactions");
    const booksCollection = db.collection("books");
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Top 10 Books by Views (last 30 days)
    const topBooksByViews = await interactionsCollection.aggregate([
      {
        $match: {
          eventType: "view",
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$bookId",
          title: { $first: "$bookTitle" },
          author: { $first: "$bookAuthor" },
          viewCount: { $sum: 1 }
        }
      },
      { $sort: { viewCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Top 10 Books by Borrows (all time)
    const topBooksByBorrows = await transactionsCollection.aggregate([
      {
        $match: {
          status: { $in: ["borrowed", "returned"] }
        }
      },
      {
        $group: {
          _id: "$bookId",
          title: { $first: "$bookTitle" },
          author: { $first: "$bookAuthor" },
          borrowCount: { $sum: 1 }
        }
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Top 10 Search Terms (last 30 days)
    const topSearches = await interactionsCollection.aggregate([
      {
        $match: {
          eventType: "search",
          timestamp: { $gte: thirtyDaysAgo },
          searchQuery: { $exists: true, $ne: "", $nin: ["filtered search", "Filtered Search"] }
        }
      },
      {
        $group: {
          _id: { $toLower: "$searchQuery" },
          searchCount: { $sum: 1 },
          lastSearched: { $max: "$timestamp" }
        }
      },
      { $sort: { searchCount: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Top 10 Active Users (last 30 days)
    const topUsers = await interactionsCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: "$userEmail",
          totalInteractions: { $sum: 1 },
          views: {
            $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] }
          },
          searches: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$eventType", "search"] },
                    { $not: { $in: [{ $toLower: "$searchQuery" }, ["filtered search"]] } }
                  ]
                },
                1,
                0
              ]
            }
          },
          bookmarks: {
            $sum: { $cond: [{ $eq: ["$eventType", "bookmark_add"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "email",
          as: "userDetails"
        }
      },
      {
        $match: {
          "userDetails.0": { $exists: true },
          "userDetails.role": { $ne: "admin" }
        }
      },
      { $sort: { totalInteractions: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Get transaction trends for the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Calculate timezone offset for MongoDB to match server/client local time
    const now = new Date();
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetMins = Math.abs(offsetMinutes % 60);
    const sign = offsetMinutes > 0 ? "-" : "+"; // Invert sign because getTimezoneOffset returns positive for behind UTC
    const timezone = `${sign}${String(offsetHours).padStart(2, "0")}:${String(offsetMins).padStart(2, "0")}`;

    const transactionTrends = await transactionsCollection.aggregate([
      {
        $match: {
          $or: [
            { borrowedAt: { $gte: ninetyDaysAgo } },
            { returnedAt: { $gte: ninetyDaysAgo } },
            { requestedAt: { $gte: ninetyDaysAgo } }
          ]
        }
      },
      {
        $facet: {
          borrowed: [
            { $match: { borrowedAt: { $exists: true } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$borrowedAt", timezone: timezone }
                },
                count: { $sum: 1 }
              }
            }
          ],
          returned: [
            { $match: { status: "returned", returnedAt: { $exists: true } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$returnedAt", timezone: timezone }
                },
                count: { $sum: 1 }
              }
            }
          ],
          requests: [
            { $match: { status: "pending-approval", requestedAt: { $exists: true } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$requestedAt", timezone: timezone }
                },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]).toArray();

    // Process trends data into a unified format
    const trendsMap = new Map();

    // Initialize all dates in the last 90 days (including today)
    for (let i = 0; i <= 90; i++) {
      const date = new Date(ninetyDaysAgo);
      date.setDate(date.getDate() + i);
      // Use local date string construction to match the timezone used in aggregation
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      trendsMap.set(dateStr, { date: dateStr, borrowed: 0, returned: 0, requests: 0, active: 0, totalBorrowed: 0 });
    }

    // Populate with actual data
    if (transactionTrends[0]) {
      transactionTrends[0].borrowed?.forEach(item => {
        if (trendsMap.has(item._id)) {
          trendsMap.get(item._id).borrowed = item.count;
        }
      });
      transactionTrends[0].returned?.forEach(item => {
        if (trendsMap.has(item._id)) {
          trendsMap.get(item._id).returned = item.count;
        }
      });
      transactionTrends[0].requests?.forEach(item => {
        if (trendsMap.has(item._id)) {
          trendsMap.get(item._id).requests = item.count;
        }
      });
    }

    // Sort the data first
    const transactionTrendsData = Array.from(trendsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Calculate cumulative active (currently borrowed books)
    let cumulativeActive = 0;
    transactionTrendsData.forEach(dayData => {
      cumulativeActive += dayData.borrowed - dayData.returned;
      dayData.active = Math.max(0, cumulativeActive); // Currently borrowed books
      dayData.totalBorrowed = dayData.borrowed; // Daily borrow count
    });

    return NextResponse.json({
      success: true,
      data: {
        totalSearches,
        recentSearches,
        totalFAQs,
        recentFAQs,
        unansweredCount: totalUnansweredCount,
        unansweredQuestions: unansweredQuestions.map(q => ({
          id: q._id,
          question: q.userMessage,
          timestamp: q.timestamp,
          user: q.userName || "Anonymous",
          askedCount: q.askedCount, // How many times asked
          firstAsked: q.firstAsked, // First time asked
          lastAsked: q.lastAsked // Last time asked
        })),
        unansweredPagination: {
          currentPage: queriesPage,
          pageSize,
          totalItems: totalUnansweredCount,
          totalPages: Math.ceil(totalUnansweredCount / pageSize)
        },
        faqFeedback: faqFeedback.map(f => ({
          id: f._id,
          question: f.question,
          category: f.category,
          feedback: f.feedback,
          userName: f.userName,
          createdAt: f.createdAt,
          reason: f.reason
        })),
        feedbackPagination: {
          currentPage: feedbackPage,
          pageSize,
          totalItems: totalFeedbackCount,
          totalPages: Math.ceil(totalFeedbackCount / pageSize)
        },
        // Transaction statistics
        pendingBorrowRequests,
        recentPendingRequests,
        returnRequests,
        recentReturnRequests,
        activeTransactions,
        recentTransactions,
        // Transaction trends (time-series data)
        transactionTrends: transactionTrendsData,
        // Top items
        topBooksByViews: topBooksByViews.map(b => ({
          bookId: b._id,
          title: b.title || "Unknown",
          author: b.author || "Unknown",
          viewCount: b.viewCount
        })),
        topBooksByBorrows: topBooksByBorrows.map(b => ({
          bookId: b._id,
          title: b.title || "Unknown",
          author: b.author || "Unknown",
          borrowCount: b.borrowCount
        })),
        topSearches: topSearches.map(s => ({
          query: s._id,
          searchCount: s.searchCount,
          lastSearched: s.lastSearched
        })),
        topUsers: topUsers.map(u => ({
          email: u._id,
          totalInteractions: u.totalInteractions,
          views: u.views,
          searches: u.searches,
          bookmarks: u.bookmarks
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
