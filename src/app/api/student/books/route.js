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
    const resourceTypes = searchParams.get("resourceTypes")?.split(",").filter(Boolean) || [];
    const formats = searchParams.get("formats")?.split(",").filter(Boolean) || [];
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
    const yearMinParam = searchParams.get("yearMin");
    const yearMaxParam = searchParams.get("yearMax");
    const yearMin = yearMinParam ? parseInt(yearMinParam, 10) : null;
    const yearMax = yearMaxParam ? parseInt(yearMaxParam, 10) : null;
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

    // Apply resource type filter
    if (resourceTypes.length > 0) {
      // Map frontend labels to database field values
      const resourceTypeMap = {
        "Books": "book",
        "Articles": "article",
        "Journals": "journal",
        "Theses": "thesis"
      };
      const mappedTypes = resourceTypes.map(rt => resourceTypeMap[rt] || rt.toLowerCase());
      
      // If "Books" is included, also match documents without resourceType field
      // (most books in DB don't have this field)
      if (mappedTypes.includes("book")) {
        // If query already has $or (from search), wrap it in $and
        if (query.$or) {
          const existingOr = query.$or;
          delete query.$or;
          query.$and = [
            { $or: existingOr },
            {
              $or: [
                { resourceType: { $in: mappedTypes } },
                { resourceType: { $exists: false } },
                { resourceType: null }
              ]
            }
          ];
        } else {
          query.$or = [
            { resourceType: { $in: mappedTypes } },
            { resourceType: { $exists: false } },
            { resourceType: null }
          ];
        }
      } else {
        query.resourceType = { $in: mappedTypes };
      }
    }

    // Apply format filter (case-insensitive, partial match)
    if (formats.length > 0) {
      // Create regex patterns for case-insensitive partial matching
      // This matches "Physical" in "Physical Book" and "eBook" in "eBook" or "E-Book"
      query.format = { $in: formats.map(f => new RegExp(f, 'i')) };
    }

    // Apply category filter (check both category and categories fields)
    if (categories.length > 0) {
      // Use categories array field (from Google Books enrichment)
      query.categories = { $in: categories };
    }

    // Apply year range filter (only if explicitly provided)
    if (yearMin !== null || yearMax !== null) {
      query.year = {};
      if (yearMin !== null) query.year.$gte = yearMin;
      if (yearMax !== null) query.year.$lte = yearMax;
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
