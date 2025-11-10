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

    const { id: authorId } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const skip = (page - 1) * pageSize;

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");
    const books = db.collection("books");

    // Get author details - try by slug first, then by ObjectId
    let author;
    try {
      if (!authorId) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid author ID" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      
      // Try to find by slug first
      author = await authors.findOne({ slug: authorId });
      
      // If not found by slug and authorId is a valid ObjectId, try by ObjectId
      if (!author && ObjectId.isValid(authorId)) {
        author = await authors.findOne({ _id: new ObjectId(authorId) });
      }
    } catch (err) {
      console.error("Error finding author:", err);
      return new Response(JSON.stringify({ ok: false, error: "Invalid author ID" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    if (!author) {
      return new Response(JSON.stringify({ ok: false, error: "Author not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    // Get books by this author
    const query = { author: author.name };
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
      JSON.stringify({ ok: true, author, items, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List author books failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
