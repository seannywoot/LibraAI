import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const body = await request.json().catch(() => ({}));
    const bookId = body?.bookId;

    if (!bookId || !ObjectId.isValid(bookId)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid book ID is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const books = db.collection("books");
    const transactions = db.collection("transactions");

    const book = await books.findOne({ _id: new ObjectId(bookId) });
    if (!book) {
      return new Response(
        JSON.stringify({ ok: false, error: "Book not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    if (book.status !== "available") {
      return new Response(
        JSON.stringify({ ok: false, error: `Book is currently ${book.status}` }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (book.loanPolicy === "reference-only") {
      return new Response(
        JSON.stringify({ ok: false, error: "This book is reference-only and cannot be borrowed" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (book.loanPolicy === "staff-only" && session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "This book is staff-only" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const existingTransaction = await transactions.findOne({
      bookId: new ObjectId(bookId),
      status: { $in: ["pending-approval", "borrowed", "return-requested"] },
    });

    if (existingTransaction) {
      const isOwnPendingRequest =
        existingTransaction.status === "pending-approval" && existingTransaction.userId === session.user?.email;

      const message = isOwnPendingRequest
        ? "You already have a pending borrow request for this book"
        : "Book already has an active transaction";

      return new Response(
        JSON.stringify({ ok: false, error: message }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const now = new Date();
    const requestedLoanDays = book.loanPolicy === "short-loan" ? 3 : 14;
    const requestedDueDate = new Date(now.getTime() + requestedLoanDays * 24 * 60 * 60 * 1000);

    const transaction = {
      bookId: new ObjectId(bookId),
      bookTitle: book.title,
      bookAuthor: book.author,
      userId: session.user?.email,
      userName: session.user?.name || session.user?.email,
      requestedAt: now,
      requestedLoanDays,
      requestedDueDate,
      borrowedAt: null,
      dueDate: null,
      returnedAt: null,
      status: "pending-approval",
      loanPolicy: book.loanPolicy,
      createdAt: now,
    };

    await Promise.all([
      books.updateOne(
        { _id: new ObjectId(bookId) },
        {
          $set: {
            status: "reserved",
            updatedAt: now,
            reservedFor: session.user?.email,
            reservedAt: now,
          },
        }
      ),
      transactions.insertOne(transaction),
    ]);

    return new Response(
      JSON.stringify({ ok: true, message: "Borrow request submitted for approval", requestedDueDate }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Borrow book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
