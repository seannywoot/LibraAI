import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ ok: true, suggestions: [] }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    // Search for matching book titles, authors, and user emails
    const searchRegex = { $regex: query, $options: "i" };
    
    const results = await transactions
      .find({
        $or: [
          { bookTitle: searchRegex },
          { bookAuthor: searchRegex },
          { userName: searchRegex },
          { userId: searchRegex },
        ],
      })
      .limit(20)
      .toArray();

    // Extract unique suggestions
    const bookTitles = [...new Set(results.map(t => t.bookTitle).filter(Boolean))].slice(0, 3);
    const userNames = [...new Set(results.map(t => t.userName).filter(Boolean))].slice(0, 2);
    const userEmails = [...new Set(results.map(t => t.userId).filter(Boolean))].slice(0, 2);

    const suggestions = [
      ...bookTitles.map(text => ({ text, type: "book" })),
      ...userNames.map(text => ({ text, type: "user" })),
      ...userEmails.map(text => ({ text, type: "email" })),
    ].slice(0, 6);

    return new Response(
      JSON.stringify({ ok: true, suggestions }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Admin transactions suggestions failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
