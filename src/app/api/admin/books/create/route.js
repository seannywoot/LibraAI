import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

function normalizeString(v) {
  return (v ?? "").toString().trim();
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const body = await request.json().catch(() => ({}));

  const titleRaw = body?.title;
  const authorRaw = body?.author;
  const yearRaw = body?.year;
  const shelfRaw = body?.shelf;
  const isbnRaw = body?.isbn ?? body?.identifier;
  const publisherRaw = body?.publisher;
  const formatRaw = body?.format ?? body?.type;
  const barcodeRaw = body?.barcode ?? body?.itemId ?? body?.itemID;
  const statusRaw = body?.status;
  const loanPolicyRaw = body?.loanPolicy;

  const title = normalizeString(titleRaw);
  const author = normalizeString(authorRaw);
  const shelf = normalizeString(shelfRaw);
  const isbn = normalizeString(isbnRaw);
  const publisher = normalizeString(publisherRaw);
  const format = normalizeString(formatRaw);
  const barcode = normalizeString(barcodeRaw);

    const yearNum = typeof yearRaw === "number" ? yearRaw : parseInt(yearRaw, 10);
    const year = Number.isFinite(yearNum) ? yearNum : NaN;

    if (!title) {
      return new Response(
        JSON.stringify({ ok: false, error: "Title is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!author) {
      return new Response(
        JSON.stringify({ ok: false, error: "Author is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!shelf) {
      return new Response(
        JSON.stringify({ ok: false, error: "Shelf is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    const currentYear = new Date().getFullYear();
    if (!Number.isFinite(year) || year < 0 || year > currentYear + 1) {
      return new Response(
        JSON.stringify({ ok: false, error: "Year must be a valid number" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Status and loan policy with allowed values and defaults
    const allowedStatuses = new Set(["available", "checked-out", "reserved", "maintenance", "lost"]);
    let status = normalizeString(statusRaw) || "available";
    if (!allowedStatuses.has(status)) status = "available";

    const allowedPolicies = new Set(["standard", "short-loan", "reference-only", "staff-only"]);
    let loanPolicy = normalizeString(loanPolicyRaw) || "standard";
    if (!allowedPolicies.has(loanPolicy)) loanPolicy = "standard";

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Helpful indexes for future queries (no-ops if already exist)
    try {
      await Promise.all([
        books.createIndex({ title: 1, author: 1 }),
        books.createIndex({ shelf: 1 }),
        books.createIndex({ year: -1 }),
        books.createIndex({ isbn: 1 }),
        books.createIndex({ barcode: 1 }),
      ]);
    } catch (_) {}

    const now = new Date();
    const doc = {
      title,
      author,
      year,
      shelf,
      isbn: isbn || null,
      publisher: publisher || null,
      format: format || null,
      barcode: barcode || null,
      status,
      loanPolicy,
      createdAt: now,
      updatedAt: now,
      createdBy: session.user?.email || null,
    };

    const result = await books.insertOne(doc);

    return new Response(
      JSON.stringify({ ok: true, bookId: result.insertedId, book: { _id: result.insertedId, ...doc } }),
      { status: 201, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Add book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
