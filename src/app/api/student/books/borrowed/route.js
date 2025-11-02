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

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    const borrowed = await transactions
      .find({
        userId: session.user?.email,
        status: { $in: ["pending-approval", "borrowed", "return-requested", "rejected"] },
      })
      .sort({ requestedAt: -1, borrowedAt: -1 })
      .toArray();

    return new Response(
      JSON.stringify({ ok: true, items: borrowed }),
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
