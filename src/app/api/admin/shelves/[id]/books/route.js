import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const resolvedParams = await params;
    const shelfId = resolvedParams?.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const skip = (page - 1) * pageSize;

    const client = await clientPromise;
    const db = client.db();
    const shelves = db.collection("shelves");
    const books = db.collection("books");

    // Get shelf details - try by slug first, then by code, then by ObjectId
    let shelf;
    try {
      // Try to find by slug first
      shelf = await shelves.findOne({ slug: shelfId });
      
      // If not found by slug, try by code (in case shelfId is actually a shelf code like "B1")
      if (!shelf) {
        shelf = await shelves.findOne({ code: shelfId });
      }
      
      // If not found by code and shelfId is a valid ObjectId, try by ObjectId
      if (!shelf && ObjectId.isValid(shelfId)) {
        shelf = await shelves.findOne({ _id: new ObjectId(shelfId) });
      }
    } catch (err) {
      console.error("Error finding shelf:", err);
      return new Response(JSON.stringify({ ok: false, error: "Invalid shelf ID" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!shelf) {
      return new Response(JSON.stringify({ ok: false, error: "Shelf not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Get books on this shelf
    const query = { shelf: shelf.code };
    const projection = {
      title: 1,
      author: 1,
      year: 1,
      shelf: 1,
      status: 1,
      isbn: 1,
      barcode: 1,
      publisher: 1,
      format: 1,
      loanPolicy: 1,
      slug: 1,
      createdAt: 1,
    };

    const [items, total] = await Promise.all([
      books.find(query, { projection }).sort({ title: 1 }).skip(skip).limit(pageSize).toArray(),
      books.countDocuments(query),
    ]);

    return new Response(
      JSON.stringify({ ok: true, shelf, items, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List shelf books failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
