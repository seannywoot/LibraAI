import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const statusFilter = searchParams.get("status")?.trim() || "";

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ ok: true, suggestions: [] }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    // Build the base query to match current page context
    const baseQuery = { archived: { $ne: true } };
    if (statusFilter) {
      baseQuery.status = statusFilter;
    }

    // Search within the current context (non-archived transactions with optional status filter)
    const searchRegex = { $regex: query, $options: "i" };
    const contextQuery = {
      ...baseQuery,
      $or: [
        { bookTitle: searchRegex },
        { bookAuthor: searchRegex },
        { userName: searchRegex },
        { userEmail: searchRegex },
      ],
    };

    // Get unique suggestions from current transactions only
    const [bookTitles, userNames, userEmails] = await Promise.all([
      transactions.distinct("bookTitle", { ...baseQuery, bookTitle: searchRegex }),
      transactions.distinct("userName", { ...baseQuery, userName: searchRegex }),
      transactions.distinct("userEmail", { ...baseQuery, userEmail: searchRegex }),
    ]);

    const suggestions = [];

    // Add book suggestions (limit 3)
    bookTitles.slice(0, 3).forEach((title) => {
      suggestions.push({ text: title, type: "book" });
    });

    // Add user name suggestions (limit 2)
    userNames.slice(0, 2).forEach((name) => {
      suggestions.push({ text: name, type: "user" });
    });

    // Add user email suggestions (limit 2)
    userEmails.slice(0, 2).forEach((email) => {
      suggestions.push({ text: email, type: "email" });
    });

    // Limit total suggestions to 5
    const limitedSuggestions = suggestions.slice(0, 5);

    return new Response(
      JSON.stringify({ ok: true, suggestions: limitedSuggestions }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Get transaction suggestions failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
