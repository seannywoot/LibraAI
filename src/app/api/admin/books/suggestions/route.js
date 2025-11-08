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
    const books = db.collection("books");

    // Search for matching titles, authors, and ISBNs
    const searchRegex = { $regex: query, $options: "i" };
    
    const [titles, authors, isbns] = await Promise.all([
      books
        .find({ title: searchRegex }, { projection: { title: 1 } })
        .limit(4)
        .toArray(),
      books
        .find({ author: searchRegex }, { projection: { author: 1 } })
        .limit(3)
        .toArray(),
      books
        .find({ isbn: searchRegex }, { projection: { isbn: 1, title: 1 } })
        .limit(2)
        .toArray(),
    ]);

    // Create unique suggestions
    const titleSuggestions = [...new Set(titles.map(b => b.title))].slice(0, 3);
    const authorSuggestions = [...new Set(authors.map(b => b.author))].slice(0, 2);
    const isbnSuggestions = [...new Set(isbns.map(b => b.isbn))].slice(0, 1);

    const suggestions = [
      ...titleSuggestions.map(text => ({ text, type: "title" })),
      ...authorSuggestions.map(text => ({ text, type: "author" })),
      ...isbnSuggestions.map(text => ({ text, type: "isbn" })),
    ].slice(0, 6);

    return new Response(
      JSON.stringify({ ok: true, suggestions }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Admin books suggestions failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
