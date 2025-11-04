import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

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
    const yearMin = parseInt(searchParams.get("yearMin") || "0", 10);
    const yearMax = parseInt(searchParams.get("yearMax") || "9999", 10);
    const availability = searchParams.get("availability")?.split(",").filter(Boolean) || [];

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Build query
    const query = {};
    if (statusFilter) {
      query.status = statusFilter;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
        { publisher: { $regex: search, $options: "i" } },
      ];
    }

    // Apply format filter
    if (formats.length > 0) {
      query.format = { $in: formats };
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
      loanPolicy: 1,
      reservedFor: 1,
      ebookUrl: 1,
    };

    // Determine sort order
    let sortOrder = { title: 1 };
    if (sortBy === "year") {
      sortOrder = { year: -1, title: 1 };
    } else if (sortBy === "author") {
      sortOrder = { author: 1, title: 1 };
    } else if (sortBy === "title") {
      sortOrder = { title: 1 };
    }

    const [rawItems, total] = await Promise.all([
      books.find(query, { projection }).sort(sortOrder).skip(skip).limit(pageSize).toArray(),
      books.countDocuments(query),
    ]);

    const items = rawItems.map(({ reservedFor, ...rest }) => ({
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
