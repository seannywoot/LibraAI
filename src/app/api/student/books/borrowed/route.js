import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    // Build query
    const query = {
      userId: session.user?.email,
      status: { $in: ["pending-approval", "borrowed", "return-requested", "rejected"] },
    };

    // Add search filter if provided
    if (search) {
      query.$or = [
        { bookTitle: { $regex: search, $options: "i" } },
        { bookAuthor: { $regex: search, $options: "i" } },
      ];
    }

    const borrowed = await transactions
      .find(query)
      .sort({ requestedAt: -1, borrowedAt: -1 })
      .toArray();

    // Enrich transactions with book slugs
    const books = db.collection("books");
    const enrichedBorrowed = await Promise.all(
      borrowed.map(async (transaction) => {
        try {
          const book = await books.findOne(
            { _id: transaction.bookId },
            { projection: { slug: 1 } }
          );
          return {
            ...transaction,
            bookSlug: book?.slug || null,
          };
        } catch (err) {
          return transaction;
        }
      })
    );

    return new Response(
      JSON.stringify({ ok: true, items: enrichedBorrowed }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Get borrowed books failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
