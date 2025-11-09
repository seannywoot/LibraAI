import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function normalizeString(v) {
  return (v ?? "").toString().trim();
}

/**
 * Auto-categorize book for recommendations
 */
function autoCategorizeBook(book) {
  const searchText = `${book.title} ${book.author} ${book.category || ""}`.toLowerCase();
  
  const categoryMappings = {
    "Computer Science": ["programming", "code", "software", "algorithm", "data structure", "computer", "javascript", "python", "java", "web", "design patterns"],
    "Business": ["business", "management", "leadership", "entrepreneur", "marketing", "finance", "economics", "startup"],
    "Self-Help": ["habits", "atomic", "mindset", "success", "productivity", "motivation", "self-help", "personal development"],
    "Fiction": ["novel", "story", "fiction", "tale", "mockingbird", "gatsby", "potter", "hunger games"],
    "Science": ["science", "physics", "chemistry", "biology", "universe", "cosmos"],
    "Mathematics": ["math", "calculus", "algebra", "geometry", "statistics"],
    "History": ["history", "historical", "war", "ancient", "civilization"],
    "Philosophy": ["philosophy", "ethics", "logic", "thinking", "mind"],
    "Psychology": ["psychology", "mental", "behavior", "cognitive", "brain"],
    "Education": ["education", "teaching", "learning", "pedagogy", "school"],
  };

  const tagMappings = {
    "Programming": ["programming", "code", "coding", "software", "developer"],
    "Algorithms": ["algorithm", "data structure", "complexity"],
    "Web Development": ["web", "javascript", "html", "css", "react", "node"],
    "Software Engineering": ["software engineering", "design patterns", "architecture", "refactoring"],
    "Leadership": ["leadership", "management", "team", "leader"],
    "Productivity": ["productivity", "habits", "efficiency", "time management"],
    "Success": ["success", "achievement", "goals", "mindset"],
    "Fiction": ["fiction", "novel", "story"],
    "Non-Fiction": ["non-fiction", "biography", "memoir"],
    "Science": ["science", "scientific", "research"],
    "Business Strategy": ["strategy", "business", "competitive"],
  };

  const categories = [];
  const tags = [];

  // Find matching categories
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      categories.push(category);
    }
  }

  // Find matching tags
  for (const [tag, keywords] of Object.entries(tagMappings)) {
    if (keywords.some(keyword => searchText.includes(keyword))) {
      tags.push(tag);
    }
  }

  // Use provided category if no matches found
  if (categories.length === 0 && book.category) {
    categories.push(book.category);
  }

  // Default category if still none
  if (categories.length === 0) {
    categories.push("General");
  }

  // Default tags if none found
  if (tags.length === 0) {
    tags.push("General Interest");
  }

  return { categories, tags };
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
    const identifier = params?.id;
    if (!identifier) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book identifier is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Try to find by slug first, then by ObjectId for backward compatibility
    let book;
    if (ObjectId.isValid(identifier)) {
      book = await books.findOne({ _id: new ObjectId(identifier) });
    }
    if (!book) {
      book = await books.findOne({ slug: identifier });
    }

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
    const identifier = params?.id;
    if (!identifier) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book identifier is required" }),
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
    const authors = db.collection("authors");

    // Find book by slug or ID
    let existingBook;
    if (ObjectId.isValid(identifier)) {
      existingBook = await books.findOne({ _id: new ObjectId(identifier) });
    }
    if (!existingBook) {
      existingBook = await books.findOne({ slug: identifier });
    }
    if (!existingBook) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Check if author exists (if author is being changed), if not create it
    if (author && author !== existingBook.author) {
      try {
        const existingAuthor = await authors.findOne({ 
          name: { $regex: new RegExp(`^${author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        if (!existingAuthor) {
          // Create new author entry
          await authors.insertOne({
            name: author,
            bio: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: session.user?.email || null,
          });
          console.log(`Created new author: ${author}`);
        }
      } catch (err) {
        // If author creation fails (e.g., duplicate key), continue anyway
        console.log(`Author may already exist: ${author}`, err.message);
      }
    }

    // Check for duplicate ISBN if changed
    if (isbn && isbn !== existingBook.isbn) {
      const isbnCheck = await books.findOne({ isbn, _id: { $ne: existingBook._id } });
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
      const barcodeCheck = await books.findOne({ barcode, _id: { $ne: existingBook._id } });
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
    
    // Auto-generate categories and tags for recommendations
    const { categories, tags } = autoCategorizeBook({ title, author, category, publisher, format });
    
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
      categories, // For recommendations
      tags, // For recommendations
      status,
      loanPolicy: format === "eBook" ? null : loanPolicy,
      updatedAt: now,
      updatedBy: session.user?.email || null,
    };

    const result = await books.updateOne(
      { _id: existingBook._id },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    const updatedBook = await books.findOne({ _id: existingBook._id });

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
    const identifier = params?.id;
    if (!identifier) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book identifier is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Find book by slug or ID
    let book;
    if (ObjectId.isValid(identifier)) {
      book = await books.findOne({ _id: new ObjectId(identifier) });
    }
    if (!book) {
      book = await books.findOne({ slug: identifier });
    }
    
    if (!book) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    const result = await books.deleteOne({ _id: book._id });

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
