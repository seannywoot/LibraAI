import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(
        JSON.stringify({ ok: false, error: "Unauthorized" }),
        { status: 401, headers: { "content-type": "application/json" } }
      );
    }

    if (session.user?.role !== "admin") {
      return new Response(
        JSON.stringify({ ok: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const shelves = db.collection("shelves");

    // Delete any shelves with null or empty code
    const deleteResult = await shelves.deleteMany({
      $or: [
        { code: null },
        { code: "" },
        { codeLower: null },
        { codeLower: "" }
      ]
    });

    // Update any shelves missing codeLower field
    const updateResult = await shelves.updateMany(
      { codeLower: { $exists: false } },
      [{ $set: { codeLower: { $toLower: "$code" } } }]
    );

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Shelves cleaned up successfully",
        deleted: deleteResult.deletedCount,
        updated: updateResult.modifiedCount,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Cleanup shelves failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
