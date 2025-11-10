import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { slugify } from "@/lib/slug";

function normalizeName(v) {
  return (v ?? "").toString().trim();
}

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
    const s = (searchParams.get("s") || "").trim();
    const skip = (page - 1) * pageSize;

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");

    try {
      await authors.createIndex({ nameLower: 1 }, { unique: true });
    } catch {}

    const query = s ? { nameLower: { $regex: new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } } : {};

    const projection = { name: 1, bio: 1, slug: 1, createdAt: 1 };

    const [items, total] = await Promise.all([
      authors.find(query, { projection }).sort({ name: 1 }).skip(skip).limit(pageSize).toArray(),
      authors.countDocuments(query),
    ]);

    return new Response(
      JSON.stringify({ ok: true, items, page, pageSize, total }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("List authors failed:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const name = normalizeName(body?.name);
    const bio = (body?.bio ?? "").toString().trim();

    if (!name) {
      return new Response(JSON.stringify({ ok: false, error: "Name is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const client = await clientPromise;
    const db = client.db();
    const authors = db.collection("authors");

    await authors.createIndex({ nameLower: 1 }, { unique: true });

    const now = new Date();
    
    // Generate unique slug
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (await authors.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    const doc = {
      name,
      nameLower: name.toLowerCase(),
      slug,
      bio: bio || null,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user?.email || null,
    };

    const result = await authors.insertOne(doc);
    return new Response(
      JSON.stringify({ ok: true, authorId: result.insertedId, author: { _id: result.insertedId, ...doc } }),
      { status: 201, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    let msg = err?.message || "Unknown error";
    if (/E11000/i.test(msg)) msg = "An author with that name already exists";
    console.error("Create author failed:", err);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
