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
            { $match: { code: { $exists: true, $ne: "" } } },
            { $group: { _id: null, codes: { $addToSet: "$code" } } }
        ]).toArray();

        const allCodes = result.length > 0 ? result[0].codes : [];

        // Extract unique first characters (prefixes)
        const prefixes = [...new Set(allCodes.map(code => code.charAt(0).toUpperCase()))].sort();

        return new Response(
            JSON.stringify({ ok: true, prefixes }),
            { status: 200, headers: { "content-type": "application/json" } }
        );
    } catch (err) {
        console.error("Get shelf prefixes failed:", err);
        return new Response(
            JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
            { status: 500, headers: { "content-type": "application/json" } }
        );
    }
}
