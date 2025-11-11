import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { buildSearchQuery } from "@/utils/searchParser";

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
    const statusFilter = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "relevance";
    
    // Parse filter parameters
    const formats = searchParams.get("formats")?.split(",").filter(Boolean) || [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const yearMin = parseInt(searchParams.get("yearMin") || "0", 10);
    const yearMax = parseInt(searchParams.get("yearMax") || "9999", 10);
    const availability = searchParams.get("availability")?.split(",").filter(Boolean) || [];

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Build base query with status filter
    const baseQuery = {};
    if (statusFilter) {
      baseQuery.status = statusFilter;
    }

    // Use advanced search parser for search query
    const query = search ? buildSearchQuery(search, baseQuery) : baseQuery;

    // Apply format filter
    if (formats.length > 0) {
      query.format = { $in: formats };
    }

    // Apply category filter
    if (categories.length > 0) {
      query.category = { $in: categories };
    }

    // Apply year range filter
    if (yearMin > 0 || yearMax < 9999) {
      query.year = { $gte: yearMin, $lte: yearMax };
    }

    // Apply availability filter
    if (availability.length > 0) {
      const statusMap = {
        "Available": "available",
        "Checked Out": "checked-out",
        "Reserved": "reserved"
      };
      const mappedStatuses = availability.map(a => statusMap[a] || a.toLowerCase());
      query.status = { $in: mappedStatuses };
    }

    const projection = {
      title: 1,
      author: 1,
      year: 1,
      shelf: 1,
      status: 1,
      isbn: 1,
      publisher: 1,
      format: 1,
      category: 1,
      loanPolicy: 1,
      reservedFor: 1,
      ebookUrl: 1,
      slug: 1,
      coverImage: 1,
      thumbnail: 1,
      description: 1,
    };

    // Fetch all items first (without pagination) to sort by availability
    const [allRawItems, total] = await Promise.all([
      books.find(query, { projection }).toArray(),
      books.countDocuments(query),
    ]);

    // Sort by availability first (available books first), then by user's selected sort
    const sortedItems = allRawItems.sort((a, b) => {
      const aStatus = (a?.status || "").toLowerCase();
      const bStatus = (b?.status || "").toLowerCase();
      
      // Available books come first
      const aIsAvailable = aStatus === "available";
      const bIsAvailable = bStatus === "available";
      
      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;
      
      // If both have same availability, apply secondary sort
      if (sortBy === "year") {
        const yearDiff = (b.year || 0) - (a.year || 0);
        if (yearDiff !== 0) return yearDiff;
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "author") {
        const authorDiff = (a.author || "").localeCompare(b.author || "");
        if (authorDiff !== 0) return authorDiff;
        return (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      
      // Default: sort by title
      return (a.title || "").localeCompare(b.title || "");
    });

    // Apply pagination after sorting
    const paginatedItems = sortedItems.slice(skip, skip + pageSize);

    const items = paginatedItems.map(({ reservedFor, ...rest }) => ({
      ...rest,
      reservedForCurrentUser: reservedFor === session.user?.email,
    }));

    return new Response(
      JSON.stringify({ ok: true, items, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List books failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
