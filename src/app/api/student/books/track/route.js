import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit('tracking', session.user.email);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Rate limit exceeded",
          retryAfter: rateLimit.retryAfter
        }),
        { 
          status: 429,
          headers: { 
            "content-type": "application/json",
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
            "Retry-After": rateLimit.retryAfter.toString()
          }
        }
      );
    }

    const body = await request.json();
    const { eventType, bookId, searchQuery, searchFilters } = body;

    // Validate event type
    if (!eventType || !["view", "search", "bookmark"].includes(eventType)) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "Invalid event type. Must be 'view', 'search', or 'bookmark'" 
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Validate required fields based on event type
    if ((eventType === "view" || eventType === "bookmark") && !bookId) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "bookId is required for view and bookmark events" 
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (eventType === "search" && !searchQuery) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "searchQuery is required for search events" 
        }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";
    const db = client.db(dbName);
    const interactions = db.collection("user_interactions");
    const users = db.collection("users");
    const books = db.collection("books");

    // Get or create user
    let user = await users.findOne({ email: session.user.email });
    if (!user) {
      const result = await users.insertOne({
        email: session.user.email,
        name: session.user.name || "Student",
        role: "student",
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email: session.user.email };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    let interactionData = {
      userId: user._id,
      userEmail: session.user.email,
      eventType,
      timestamp: now,
      expiresAt,
    };

    // Handle view and bookmark events
    if (eventType === "view" || eventType === "bookmark") {
      // Fetch book details
      const book = await books.findOne({ _id: new ObjectId(bookId) });
      
      if (!book) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: "Book not found" 
          }),
          { status: 404, headers: { "content-type": "application/json" } }
        );
      }

      interactionData = {
        ...interactionData,
        bookId: book._id,
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories || [],
        bookTags: book.tags || [],
      };

      // Update book popularity score (only for views, not bookmarks)
      if (eventType === "view") {
        await books.updateOne(
          { _id: book._id },
          { $inc: { popularityScore: 1 } }
        );
      }
    }

    // Handle search events
    if (eventType === "search") {
      interactionData = {
        ...interactionData,
        searchQuery: searchQuery.trim(),
        searchFilters: searchFilters || {},
      };
    }

    // Insert interaction
    const result = await interactions.insertOne(interactionData);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        interactionId: result.insertedId.toString() 
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );

  } catch (error) {
    console.error("Track interaction failed:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: error?.message || "Failed to track interaction" 
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
