import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { trackBookView } from "@/lib/interaction-tracker";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    // Await params in Next.js 15
    const { bookId } = await params;

    if (!bookId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing book identifier" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Get book details
    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");

    // Try to find book by ObjectId first, then by slug
    let book;
    if (ObjectId.isValid(bookId)) {
      book = await books.findOne({ _id: new ObjectId(bookId) });
    }

    // If not found by ObjectId or bookId is not a valid ObjectId, try slug
    if (!book) {
      book = await books.findOne({ slug: bookId });
    }

    if (!book) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Track the view - normalize categories to array
    const bookCategories = book.categories && book.categories.length > 0
      ? book.categories
      : book.category
        ? [book.category]
        : [];

    await trackBookView({
      userId: session.user.email,
      bookId: book._id.toString(),
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCategories: bookCategories,
      bookTags: book.tags || [],
      bookFormat: book.format,
      bookPublisher: book.publisher,
      bookYear: book.year,
    });

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (error) {
    console.error("Track view failed:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error?.message || "Failed to track view" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
