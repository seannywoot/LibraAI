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
    const shelves = db.collection("shelves");

    // Use aggregation instead of distinct to avoid apiStrict issues
    const result = await shelves.aggregate([
      { $match: { location: { $exists: true, $ne: "" } } },
      { $group: { _id: null, locations: { $addToSet: "$location" } } }
    ]).toArray();

    const locations = result.length > 0 ? result[0].locations : [];

    // Sort alphabetically
    locations.sort();

    return new Response(
      JSON.stringify({ ok: true, locations }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Get locations failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
