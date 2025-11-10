import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Valid transaction ID is required" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const transactions = db.collection("transactions");

    const result = await transactions.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Transaction not found" }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Transaction deleted successfully" }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Delete transaction failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
