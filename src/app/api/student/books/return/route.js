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

    const activeTransaction = await transactions.findOne({
      bookId: new ObjectId(bookId),
      userId: session.user?.email,
      status: { $in: ["borrowed", "return-requested"] },
    });

    if (!activeTransaction) {
      return new Response(
        JSON.stringify({ ok: false, error: "No active borrow record found for this book" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    if (activeTransaction.status === "return-requested") {
      return new Response(
        JSON.stringify({ ok: false, error: "Return is already awaiting admin confirmation" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const now = new Date();

    await transactions.updateOne(
      { _id: activeTransaction._id },
      {
        $set: {
          status: "return-requested",
          returnRequestedAt: now,
        },
      }
    );

    return new Response(
      JSON.stringify({ ok: true, message: "Return request submitted" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Return book failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
