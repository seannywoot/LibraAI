import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST /api/student/books/bookmarks/bulk - Get bookmark status for multiple books
export async function POST(request) {
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

    const body = await request.json();
    const { bookIds } = body;

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid book IDs" },
        { status: 400 }
      );
    }

    // Validate all book IDs
    const validBookIds = bookIds.filter(id => ObjectId.isValid(id));
    if (validBookIds.length === 0) {
      return NextResponse.json({
        ok: true,
        bookmarks: {},
      });
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || "test";
    const db = client.db(dbName);

    // Get user
    const user = await db.collection("users").findOne({
      email: session.user.email,
      role: "student",
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Get all bookmarks for this user and the requested books in one query
    const bookmarks = await db.collection("bookmarks").find({
      userId: user._id,
      bookId: { $in: validBookIds.map(id => new ObjectId(id)) },
    }).toArray();

    // Create a map of bookId -> true for bookmarked books
    const bookmarkMap = {};
    bookmarks.forEach(bookmark => {
      bookmarkMap[bookmark.bookId.toString()] = true;
    });

    return NextResponse.json({
      ok: true,
      bookmarks: bookmarkMap,
    });
  } catch (error) {
    console.error("Error checking bulk bookmarks:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to check bookmarks" },
      { status: 500 }
    );
  }
}
