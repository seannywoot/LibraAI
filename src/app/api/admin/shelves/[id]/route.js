import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function normalize(v) { return (v ?? "").toString().trim(); }
function safeObjectId(id) { try { return new ObjectId(id); } catch { return null; } }

export async function GET(request, { params }) {
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
    const shelves = db.collection("shelves");

    const shelf = await shelves.findOne({ _id }, { projection: { code: 1, name: 1, location: 1, capacity: 1, notes: 1, createdAt: 1, updatedAt: 1 } });
    if (!shelf) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });

    return new Response(JSON.stringify({ ok: true, shelf }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("Get shelf failed:", err);
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

    const _id = safeObjectId(id);
    if (!_id) return new Response(JSON.stringify({ ok: false, error: "Invalid id" }), { status: 400, headers: { "content-type": "application/json" } });

    const body = await request.json().catch(() => ({}));
    const code = normalize(body?.code);
    const name = normalize(body?.name);
    const location = normalize(body?.location);
    const capacityRaw = body?.capacity;
    const notes = normalize(body?.notes);

    if (!code) return new Response(JSON.stringify({ ok: false, error: "Code is required" }), { status: 400, headers: { "content-type": "application/json" } });

    let capacity = undefined;
    if (capacityRaw !== undefined && capacityRaw !== null && String(capacityRaw) !== "") {
      const n = parseInt(capacityRaw, 10);
      if (!Number.isFinite(n) || n < 0) return new Response(JSON.stringify({ ok: false, error: "Capacity must be a non-negative integer" }), { status: 400, headers: { "content-type": "application/json" } });
      capacity = n;
    }

    const client = await clientPromise;
    const db = client.db();
    const shelves = db.collection("shelves");

    // Ensure unique index exists (idempotent operation)
    try {
      const indexes = await shelves.indexes();
      const hasCodeLowerIndex = indexes.some(idx => idx.name === 'codeLower_1');
      if (!hasCodeLowerIndex) {
        await shelves.createIndex({ codeLower: 1 }, { unique: true });
      }
    } catch (indexErr) {
      // Index might already exist, continue
      console.log("Index creation note:", indexErr.message);
    }

    const now = new Date();
    const res = await shelves.updateOne(
      { _id },
      { $set: {
        code,
        codeLower: code.toLowerCase(),
        name: name || null,
        nameLower: name ? name.toLowerCase() : null,
        location: location || null,
        capacity: capacity ?? null,
        notes: notes || null,
        updatedAt: now,
      } }
    );

    if (res.matchedCount === 0) return new Response(JSON.stringify({ ok: false, error: "Not found" }), { status: 404, headers: { "content-type": "application/json" } });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    let msg = err?.message || "Unknown error";
    if (/E11000/i.test(msg)) msg = "A shelf with that code already exists";
    console.error("Update shelf failed:", err);
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
    const shelves = db.collection("shelves");

    const shelf = await shelves.findOne({ _id }, { projection: { code: 1 } });
    if (!shelf) {
      console.log("DELETE shelf: Shelf not found with id:", id);
      return new Response(JSON.stringify({ ok: false, error: "Shelf not found" }), { status: 404, headers: { "content-type": "application/json" } });
    }

    console.log("DELETE shelf: Checking if shelf code", shelf.code, "is in use");

    // Reference safety: unassign any books that reference this shelf code before deletion
    const books = db.collection("books");
    const shelfCodePattern = new RegExp(`^${shelf.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const now = new Date();
    const unassignResult = await books.updateMany(
      { shelf: shelfCodePattern },
      { $set: { shelf: null, updatedAt: now } }
    );

    if (unassignResult.modifiedCount > 0) {
      console.log(`DELETE shelf: Unassigned ${unassignResult.modifiedCount} book(s) previously on shelf`, shelf.code);
    } else {
      console.log("DELETE shelf: No books were referencing shelf", shelf.code);
    }

    console.log("DELETE shelf: Proceeding with deletion");
    const deleteResult = await shelves.deleteOne({ _id });
    console.log("DELETE shelf: Deletion result:", deleteResult);
    
    return new Response(JSON.stringify({ ok: true, unassignedBooks: unassignResult.modifiedCount, message: unassignResult.modifiedCount > 0 ? `Shelf deleted and ${unassignResult.modifiedCount} linked book${unassignResult.modifiedCount === 1 ? "" : "s"} unassigned.` : "Shelf deleted successfully." }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("Delete shelf failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
