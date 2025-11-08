import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const tab = searchParams.get("tab") || "personal"; // 'personal' or 'borrowed'

    if (!query || query.length < 2) {
      return NextResponse.json({ ok: true, suggestions: [] });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user
    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ ok: true, suggestions: [] });
    }

    const searchRegex = { $regex: query, $options: "i" };
    let suggestions = [];

    if (tab === "personal") {
      // Search personal library
      const library = db.collection("personal_libraries");
      const results = await library
        .find({
          userId: user._id,
          $or: [
            { title: searchRegex },
            { author: searchRegex },
            { isbn: searchRegex },
          ],
        })
        .limit(10)
        .toArray();

      const titles = [...new Set(results.map(b => b.title).filter(Boolean))].slice(0, 3);
      const authors = [...new Set(results.map(b => b.author).filter(Boolean))].slice(0, 2);

      suggestions = [
        ...titles.map(text => ({ text, type: "title" })),
        ...authors.map(text => ({ text, type: "author" })),
      ].slice(0, 5);
    } else {
      // Search borrowed books
      const transactions = db.collection("transactions");
      const results = await transactions
        .find({
          userId: session.user.email,
          status: { $in: ["pending-approval", "borrowed", "return-requested", "rejected"] },
          $or: [
            { bookTitle: searchRegex },
            { bookAuthor: searchRegex },
          ],
        })
        .limit(10)
        .toArray();

      const titles = [...new Set(results.map(t => t.bookTitle).filter(Boolean))].slice(0, 3);
      const authors = [...new Set(results.map(t => t.bookAuthor).filter(Boolean))].slice(0, 2);

      suggestions = [
        ...titles.map(text => ({ text, type: "title" })),
        ...authors.map(text => ({ text, type: "author" })),
      ].slice(0, 5);
    }

    return NextResponse.json({ ok: true, suggestions });
  } catch (error) {
    console.error("Library suggestions failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load suggestions" },
      { status: 500 }
    );
  }
}
