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

    // First, delete any shelves with null or empty code/codeLower/nameLower
    const deleteResult = await shelves.deleteMany({
      $or: [
        { code: null },
        { code: "" },
        { codeLower: null },
        { codeLower: "" },
        { nameLower: null },
        { nameLower: "" }
      ]
    });

    // Get all existing indexes
    const indexes = await shelves.indexes();
    const droppedIndexes = [];

    // Drop all problematic indexes
    const problematicIndexes = ["codeLower_1", "nameLower_1", "locationLower_1"];
    
    for (const indexName of problematicIndexes) {
      try {
        const indexExists = indexes.some(idx => idx.name === indexName);
        if (indexExists) {
          await shelves.dropIndex(indexName);
          droppedIndexes.push(indexName);
        }
      } catch (err) {
        console.log(`Index ${indexName} not found or already dropped:`, err.message);
      }
    }

    // Recreate indexes properly with sparse option to allow nulls
    await shelves.createIndex(
      { codeLower: 1 },
      { unique: true, sparse: true, name: "codeLower_1" }
    );

    await shelves.createIndex(
      { nameLower: 1 },
      { sparse: true, name: "nameLower_1" }
    );

    return new Response(
      JSON.stringify({
        ok: true,
        message: "All indexes fixed successfully",
        deleted: deleteResult.deletedCount,
        droppedIndexes,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Fix index failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
