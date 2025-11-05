import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function normalizeName(v) {
  return (v ?? "").toString().trim();
}

function safeObjectId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { "content-type": "application/json" } });
    }

    const { id } = await params;
    const _id = safeObjectId(id);
    if (!_id) return new Response(JSON.stringify({ ok: false, error: "Invalid id" }), { status: 400, headers: { "content-type": "application/json" } });

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");

    const author = await authors.findOne({ _id }, { projection: { name: 1, bio: 1, createdAt: 1, updatedAt: 1 } });
    if (!author) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });

    return new Response(JSON.stringify({ ok: true, author }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("Get author failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { "content-type": "application/json" } });
    }

    const _id = safeObjectId(params.id);
    if (!_id) return new Response(JSON.stringify({ ok: false, error: "Invalid id" }), { status: 400, headers: { "content-type": "application/json" } });

    const body = await request.json().catch(() => ({}));
    const name = normalizeName(body?.name);
    const bio = (body?.bio ?? "").toString().trim();

    if (!name) return new Response(JSON.stringify({ ok: false, error: "Name is required" }), { status: 400, headers: { "content-type": "application/json" } });

    const _id = safeObjectId(id);
    if (!_id) return new Response(JSON.stringify({ ok: false, error: "Invalid id" }), { status: 400, headers: { "content-type": "application/json" } });

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");

    await authors.createIndex({ nameLower: 1 }, { unique: true });

    const now = new Date();
    const res = await authors.updateOne(
      { _id },
      { $set: { name, nameLower: name.toLowerCase(), bio: bio || null, updatedAt: now } }
    );

    if (res.matchedCount === 0) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    let msg = err?.message || "Unknown error";
    if (/E11000/i.test(msg)) msg = "An author with that name already exists";
    console.error("Update author failed:", err);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { "content-type": "application/json" } });
    }

    const _id = safeObjectId(id);
    if (!_id) return new Response(JSON.stringify({ ok: false, error: "Invalid id" }), { status: 400, headers: { "content-type": "application/json" } });

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");

    const author = await authors.findOne({ _id }, { projection: { name: 1 } });
    if (!author) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });

    // Reference safety: any book with author name equal (case-insensitive)?
    const books = db.collection("books");
    const nameRegex = new RegExp(`^${author.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const inUse = await books.findOne({ author: { $regex: nameRegex } }, { projection: { _id: 1 } });
    if (inUse) {
      return new Response(JSON.stringify({ ok: false, error: "Cannot delete: author is referenced by books" }), { status: 409, headers: { "content-type": "application/json" } });
    }

    await authors.deleteOne({ _id });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("Delete author failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
