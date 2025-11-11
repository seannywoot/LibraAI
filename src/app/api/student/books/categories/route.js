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
    const books = db.collection("books");

    // Get all unique categories from books
    const categories = await books
      .aggregate([
        {
          $match: {
            categories: { $exists: true, $not: { $size: 0 } },
          },
        },
        {
          $unwind: "$categories",
        },
        {
          $group: {
            _id: "$categories",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1,
          },
        },
      ])
      .toArray();

    // Extract just the category names
    const categoryNames = categories.map((c) => c.category);

    return new Response(
      JSON.stringify({
        ok: true,
        categories: categoryNames,
        categoriesWithCounts: categories,
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  } catch (err) {
    console.error("Get categories failed:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || "Unknown error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
