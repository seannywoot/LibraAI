import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { parseSearchQuery, escapeRegex } from "@/utils/searchParser";

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
    const sortBy = searchParams.get("sortBy") || "code";
    const locationFilter = searchParams.get("location")?.trim() || "";
    const codePrefixFilter = searchParams.get("codePrefix")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();
    const shelves = db.collection("shelves");

    const projection = { code: 1, name: 1, location: 1, slug: 1 };

    // Build search query with advanced syntax support
    let query = {};
    if (search) {
      const { filters, freeText } = parseSearchQuery(search);
      const orConditions = [];

      // Handle shelf-specific filter
      if (filters.shelf) {
        orConditions.push({ code: { $regex: escapeRegex(filters.shelf), $options: "i" } });
      }

      // Add free text search for code and location
      if (freeText) {
        orConditions.push(
          { code: { $regex: escapeRegex(freeText), $options: "i" } },
          { location: { $regex: escapeRegex(freeText), $options: "i" } }
        );
      }

      // If no specific filters, search code and location fields
      if (orConditions.length === 0 && !freeText && !filters.shelf) {
        orConditions.push(
          { code: { $regex: escapeRegex(search), $options: "i" } },
          { location: { $regex: escapeRegex(search), $options: "i" } }
        );
      }

      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
    }

    // Add location filter
    if (locationFilter) {
      query.location = { $regex: escapeRegex(locationFilter), $options: "i" };
    }

    // Add code prefix filter
    if (codePrefixFilter) {
      query.code = { $regex: `^${escapeRegex(codePrefixFilter)}`, $options: "i" };
    }

    // Determine sort order
    let sortOrder = { code: 1 };
    if (sortBy === "location") {
      sortOrder = { location: 1, code: 1 };
    }
    // Note: bookCount sorting will be done after fetching since it's computed

    const [rawItems, total] = await Promise.all([
      shelves.find(query, { projection }).sort(sortOrder).skip(skip).limit(pageSize).toArray(),
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

    // Sort by book count if requested (after computing counts)
    if (sortBy === "bookCount") {
      itemsWithCounts.sort((a, b) => b.bookCount - a.bookCount);
    }

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
