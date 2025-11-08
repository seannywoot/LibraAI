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
    const shelves = db.collection("shelves");

    const projection = { code: 1, name: 1, location: 1 };

    // Build search query with advanced syntax support
    let query = {};
    if (search) {
      const { filters, freeText } = parseSearchQuery(search);
      const orConditions = [];

      // Handle shelf-specific filter
      if (filters.shelf) {
        orConditions.push({ code: { $regex: filters.shelf, $options: "i" } });
      }

      // Add free text search
      if (freeText) {
        orConditions.push(
          { code: { $regex: freeText, $options: "i" } },
          { name: { $regex: freeText, $options: "i" } },
          { location: { $regex: freeText, $options: "i" } }
        );
      }

      // If no specific filters, search all fields
      if (orConditions.length === 0 && !freeText && !filters.shelf) {
        orConditions.push(
          { code: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } }
        );
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    const [rawItems, total] = await Promise.all([
      shelves.find(query, { projection }).sort({ code: 1 }).skip(skip).limit(pageSize).toArray(),
      shelves.countDocuments(query),
    ]);

    // Get book counts for each shelf
    const books = db.collection("books");
    const itemsWithCounts = await Promise.all(
      rawItems.map(async (shelf) => {
        const bookCount = await books.countDocuments({ shelf: shelf.code });
        return { ...shelf, bookCount };
      })
    );

    return new Response(
      JSON.stringify({ ok: true, items: itemsWithCounts, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List shelves failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
