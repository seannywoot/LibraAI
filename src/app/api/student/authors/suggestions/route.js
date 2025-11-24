import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { escapeRegex } from "@/utils/searchParser";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "student") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ ok: true, suggestions: [] });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // Search for authors matching the query
    const authors = await db
      .collection("authors")
      .find({
        name: { $regex: escapeRegex(query), $options: "i" },
      })
      .limit(6)
      .toArray();

    // Create unique suggestions
    const suggestions = authors.map(author => ({
      text: author.name,
      type: "author",
    }));

    return NextResponse.json({ ok: true, suggestions });
  } catch (error) {
    console.error("Error fetching author suggestions:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
