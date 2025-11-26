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
    const { transactionId } = body;

    if (!transactionId) {
      return new Response(
        JSON.stringify({ ok: false, error: "Transaction ID is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    // Find the transaction
    const transaction = await transactions.findOne({
      _id: new ObjectId(transactionId),
      userId: session.user?.email,
    });

    if (!transaction) {
      return new Response(
        JSON.stringify({ ok: false, error: "Transaction not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    // Only allow archiving returned or rejected transactions
    if (!["returned", "rejected"].includes(transaction.status)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Only returned or rejected transactions can be archived" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Check if already archived
    if (transaction.archived === true) {
      return new Response(
        JSON.stringify({ ok: false, error: "Transaction is already archived" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    // Archive the transaction
    await transactions.updateOne(
      { _id: new ObjectId(transactionId) },
      {
        $set: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: session.user?.email,
        },
      }
    );

    return new Response(
      JSON.stringify({ ok: true, message: "Transaction archived successfully" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Archive transaction failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
