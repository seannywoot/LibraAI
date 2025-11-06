import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function normalizeString(v) {
  return (v ?? "").toString().trim();
}

// GET single book
export async function GET(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized - Please sign in" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
    if (session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const params = await context.params;
    const bookId = params?.id;
    if (!bookId || !ObjectId.isValid(bookId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid book ID" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    const book = await books.findOne({ _id: new ObjectId(bookId) });

    if (!book) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, book }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Get book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

// PUT update book
export async function PUT(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized - Please sign in" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
    if (session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const params = await context.params;
    const bookId = params?.id;
    if (!bookId || !ObjectId.isValid(bookId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid book ID" }),
        { status: 400, headers: { "content-type": "application/json" } }
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
    const ebookUrlRaw = body?.ebookUrl;
    const barcodeRaw = body?.barcode ?? body?.itemId ?? body?.itemID;
    const categoryRaw = body?.category;
    const statusRaw = body?.status;
    const loanPolicyRaw = body?.loanPolicy;

    const title = normalizeString(titleRaw);
    const author = normalizeString(authorRaw);
    const shelf = normalizeString(shelfRaw);
    const isbn = normalizeString(isbnRaw);
    const publisher = normalizeString(publisherRaw);
    const format = normalizeString(formatRaw);
    const ebookUrl = normalizeString(ebookUrlRaw);
    const barcode = normalizeString(barcodeRaw);
    const category = normalizeString(categoryRaw);

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
    if (!format) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book format/type is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (!category) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book category is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (format !== "eBook" && !shelf) {
      return new Response(
        JSON.stringify({ ok: false, error: "Shelf is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    const currentYear = new Date().getFullYear();
    const OLDEST_YEAR = 1450;
    if (!Number.isFinite(year) || year < OLDEST_YEAR || year > currentYear) {
      return new Response(
        JSON.stringify({ ok: false, error: `Year must be between ${OLDEST_YEAR} and ${currentYear}` }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }
    if (isbn && !/^\d{13}$/.test(isbn)) {
      return new Response(
        JSON.stringify({ ok: false, error: "ISBN must be exactly 13 digits if provided" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const allowedStatuses = new Set(["available", "checked-out", "reserved", "maintenance", "lost"]);
    let status = normalizeString(statusRaw) || "available";
    if (!allowedStatuses.has(status)) status = "available";

    const allowedPolicies = new Set(["standard", "short-loan", "reference-only", "staff-only"]);
    let loanPolicy = normalizeString(loanPolicyRaw) || "standard";
    if (!allowedPolicies.has(loanPolicy)) loanPolicy = "standard";

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Check if book exists
    const existingBook = await books.findOne({ _id: new ObjectId(bookId) });
    if (!existingBook) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Check for duplicate ISBN if changed
    if (isbn && isbn !== existingBook.isbn) {
      const isbnCheck = await books.findOne({ isbn, _id: { $ne: new ObjectId(bookId) } });
      if (isbnCheck) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: "A book with this ISBN already exists in the system." 
          }),
          { status: 409, headers: { "content-type": "application/json" } }
        );
      }
    }

    // Check for duplicate barcode if changed
    if (barcode && barcode !== existingBook.barcode) {
      const barcodeCheck = await books.findOne({ barcode, _id: { $ne: new ObjectId(bookId) } });
      if (barcodeCheck) {
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: "A book with this barcode/item ID already exists in the system." 
          }),
          { status: 409, headers: { "content-type": "application/json" } }
        );
      }
    }

    const now = new Date();
    const updateDoc = {
      title,
      author,
      year,
      shelf: shelf || null,
      isbn: isbn || null,
      publisher: publisher || null,
      format: format || null,
      ebookUrl: ebookUrl || null,
      barcode: barcode || null,
      category: category || null,
      status,
      loanPolicy: format === "eBook" ? null : loanPolicy,
      updatedAt: now,
      updatedBy: session.user?.email || null,
    };

    const result = await books.updateOne(
      { _id: new ObjectId(bookId) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    const updatedBook = await books.findOne({ _id: new ObjectId(bookId) });

    return new Response(
      JSON.stringify({ ok: true, book: updatedBook }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Update book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

// DELETE book
export async function DELETE(request, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized - Please sign in" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }
    if (session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const params = await context.params;
    const bookId = params?.id;
    if (!bookId || !ObjectId.isValid(bookId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid book ID" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    const result = await books.deleteOne({ _id: new ObjectId(bookId) });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Book deleted successfully" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
