import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const { shelfId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const skip = (page - 1) * pageSize;
    const search = searchParams.get("search")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();
    const shelves = db.collection("shelves");
    const books = db.collection("books");

    // Get shelf details - try by ObjectId first, then by code
    let shelf;
    try {
      // Try to find by ObjectId first
      if (ObjectId.isValid(shelfId)) {
        shelf = await shelves.findOne({ _id: new ObjectId(shelfId) }, { projection: { code: 1, name: 1, location: 1 } });
      }
      
      // If not found by ObjectId, try by code (in case shelfId is actually a shelf code like "B1")
      if (!shelf) {
        shelf = await shelves.findOne({ code: shelfId }, { projection: { code: 1, name: 1, location: 1 } });
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
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
        { publisher: { $regex: search, $options: "i" } },
      ];
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
    };

    const [rawItems, total] = await Promise.all([
      books.find(query, { projection }).sort({ title: 1 }).skip(skip).limit(pageSize).toArray(),
      books.countDocuments(query),
    ]);

    const items = rawItems.map(({ reservedFor, ...rest }) => ({
      ...rest,
      reservedForCurrentUser: reservedFor === session.user?.email,
    }));

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
