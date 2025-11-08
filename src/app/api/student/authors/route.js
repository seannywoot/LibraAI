import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { parseSearchQuery } from "@/utils/searchParser";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");
    const books = db.collection("books");
    const projection = { name: 1, bio: 1 };

    // Build search query with advanced syntax support
    let query = {};
    if (search) {
      const { filters, freeText } = parseSearchQuery(search);
      const orConditions = [];

      // Handle author-specific filter
      if (filters.author) {
        orConditions.push({ name: { $regex: filters.author, $options: "i" } });
      }

      // Add free text search
      if (freeText) {
        orConditions.push(
          { name: { $regex: freeText, $options: "i" } },
          { bio: { $regex: freeText, $options: "i" } }
        );
      }

      // If no specific filters, search all fields
      if (orConditions.length === 0 && !freeText && !filters.author) {
        orConditions.push(
          { name: { $regex: search, $options: "i" } },
          { bio: { $regex: search, $options: "i" } }
        );
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    const [rawItems, total] = await Promise.all([
      authors.find(query, { projection }).sort({ name: 1 }).skip(skip).limit(pageSize).toArray(),
      authors.countDocuments(query),
    ]);

    // Get book counts for each author
    const items = await Promise.all(
      rawItems.map(async (author) => {
        const bookCount = await books.countDocuments({ author: author.name });
        return { ...author, bookCount };
      })
    );

    return new Response(
      JSON.stringify({ ok: true, items, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List authors failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
