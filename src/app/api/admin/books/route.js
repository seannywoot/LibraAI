import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { buildSearchQuery } from "@/utils/searchParser";

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
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");
    const shelves = db.collection("shelves");

    const projection = {
      title: 1,
      author: 1,
      year: 1,
      shelf: 1,
      status: 1,
      isbn: 1,
      barcode: 1,
      slug: 1,
      createdAt: 1,
      coverImage: 1,
      thumbnail: 1,
    };

    // Build search query with advanced syntax support (e.g., "author: Rowling", "year: 2023")
    const query = search ? buildSearchQuery(search) : {};

    const [rawItems, total] = await Promise.all([
      books.find(query, { projection }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
      books.countDocuments(query),
    ]);

    // Enrich books with shelf IDs
    const items = await Promise.all(
      rawItems.map(async (book) => {
        if (book.shelf) {
          const shelf = await shelves.findOne({ code: book.shelf }, { projection: { _id: 1 } });
          return { ...book, shelfId: shelf?._id?.toString() || null };
        }
        return { ...book, shelfId: null };
      })
    );

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
