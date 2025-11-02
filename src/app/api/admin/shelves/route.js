import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

function normalize(v) { return (v ?? "").toString().trim(); }

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { "content-type": "application/json" } });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const pageSize = Math.max(Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 100), 1);
    const s = (searchParams.get("s") || "").trim();
    const skip = (page - 1) * pageSize;

    const client = await clientPromise;
    const db = client.db();
    const shelves = db.collection("shelves");

    try {
      await shelves.createIndex({ codeLower: 1 }, { unique: true });
    } catch {}

    const query = s ? { $or: [
      { codeLower: { $regex: new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
      { nameLower: { $regex: new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } },
    ] } : {};

    const projection = { code: 1, name: 1, location: 1, capacity: 1, notes: 1, createdAt: 1 };

    const [items, total] = await Promise.all([
      shelves.find(query, { projection }).sort({ code: 1 }).skip(skip).limit(pageSize).toArray(),
      shelves.countDocuments(query),
    ]);

    return new Response(JSON.stringify({ ok: true, items, page, pageSize, total }), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("List shelves failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), { status: 500, headers: { "content-type": "application/json" } });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { "content-type": "application/json" } });
    }

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

    await shelves.createIndex({ codeLower: 1 }, { unique: true });

    const now = new Date();
    const doc = {
      code,
      codeLower: code.toLowerCase(),
      name: name || null,
      nameLower: name ? name.toLowerCase() : null,
      location: location || null,
      capacity: capacity ?? null,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user?.email || null,
    };

    const result = await shelves.insertOne(doc);
    return new Response(JSON.stringify({ ok: true, shelfId: result.insertedId, shelf: { _id: result.insertedId, ...doc } }), { status: 201, headers: { "content-type": "application/json" } });
  } catch (err) {
    let msg = err?.message || "Unknown error";
    if (/E11000/i.test(msg)) msg = "A shelf with that code already exists";
    console.error("Create shelf failed:", err);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
