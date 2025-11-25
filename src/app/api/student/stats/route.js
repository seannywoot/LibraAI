import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");

    // Get user
    const user = await users.findOne({ email: session.user.email });
    if (!user) {
      // Return empty stats for new users
      return new Response(
        JSON.stringify({
          ok: true,
          stats: {
            totalBorrowed: 0,
            currentlyBorrowed: 0,
            totalReturned: 0,
            onTimeReturns: 0,
            overdueReturns: 0,
            pendingRequests: 0,
            favoriteCategories: [],
            favoriteAuthors: [],
            memberSince: new Date().toISOString()
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    // Get transaction statistics
    const transactionStats = await transactions.aggregate([
      { $match: { userId: session.user.email } },
      {
        $group: {
          _id: null,
          totalBorrowed: { $sum: 1 },
          currentlyBorrowed: {
            $sum: { $cond: [{ $eq: ["$status", "borrowed"] }, 1, 0] }
          },
          totalReturned: {
            $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] }
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "pending-approval"] }, 1, 0] }
          },
          onTimeReturns: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "returned"] },
                    { $lte: ["$returnedAt", "$dueDate"] }
                  ]
                },
                1,
                0
              ]
            }
          },
          overdueReturns: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "returned"] },
                    { $gt: ["$returnedAt", "$dueDate"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]).toArray();

    const stats = transactionStats[0] || {
      totalBorrowed: 0,
      currentlyBorrowed: 0,
      totalReturned: 0,
      onTimeReturns: 0,
      overdueReturns: 0,
      pendingRequests: 0
    };

    // Get favorite categories from interactions
    const favoriteCategories = await interactions.aggregate([
      { $match: { userId: user._id, eventType: "view" } },
      { $unwind: "$bookCategories" },
      { $group: { _id: "$bookCategories", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]).toArray();

    // Get favorite authors from interactions
    const favoriteAuthors = await interactions.aggregate([
      {
        $match: {
          userId: user._id,
          eventType: "view",
          bookAuthor: { $exists: true, $ne: null }
        }
      },
      { $group: { _id: "$bookAuthor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]).toArray();

    return new Response(
      JSON.stringify({
        ok: true,
        stats: {
          totalBorrowed: stats.totalBorrowed,
          currentlyBorrowed: stats.currentlyBorrowed,
          totalReturned: stats.totalReturned,
          onTimeReturns: stats.onTimeReturns,
          overdueReturns: stats.overdueReturns,
          pendingRequests: stats.pendingRequests,
          favoriteCategories: favoriteCategories.map(c => ({
            name: c._id,
            count: c.count
          })),
          favoriteAuthors: favoriteAuthors.map(a => ({
            name: a._id,
            count: a.count
          })),
          memberSince: user.createdAt || new Date().toISOString()
        }
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  } catch (error) {
    console.error("Get stats failed:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error?.message || "Failed to get statistics"
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
