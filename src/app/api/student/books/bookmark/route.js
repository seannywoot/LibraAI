import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// POST /api/student/books/bookmark - Toggle bookmark for a book
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
    const { bookId } = body;

    if (!bookId || !ObjectId.isValid(bookId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid book ID" },
        { status: 400 }
      );
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

    // Check if book exists
    const book = await db.collection("books").findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      console.error(`Book not found: ${bookId}`);
      return NextResponse.json(
        { ok: false, error: "Book not found" },
        { status: 404 }
      );
    }

    // Check if bookmark already exists
    const existingBookmark = await db.collection("bookmarks").findOne({
      userId: user._id,
      bookId: new ObjectId(bookId),
    });

    if (existingBookmark) {
      // Remove bookmark
      await db.collection("bookmarks").deleteOne({
        _id: existingBookmark._id,
      });

      return NextResponse.json({
        ok: true,
        bookmarked: false,
        message: "Bookmark removed",
      });
    } else {
      // Add bookmark
      await db.collection("bookmarks").insertOne({
        userId: user._id,
        bookId: new ObjectId(bookId),
        bookTitle: book.title,
        bookAuthor: book.author,
        createdAt: new Date(),
      });

      // Track bookmark as an interaction
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
      
      await db.collection("user_interactions").insertOne({
        userId: user._id,
        userEmail: session.user.email,
        eventType: "bookmark",
        bookId: new ObjectId(bookId),
        bookTitle: book.title,
        bookAuthor: book.author,
        bookCategories: book.categories || [],
        bookTags: book.tags || [],
        timestamp: now,
        expiresAt,
      });

      return NextResponse.json({
        ok: true,
        bookmarked: true,
        message: "Book bookmarked",
      });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}

// GET /api/student/books/bookmark - Check if a book is bookmarked
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
    const bookId = searchParams.get("bookId");

    if (!bookId || !ObjectId.isValid(bookId)) {
      return NextResponse.json(
        { ok: false, error: "Invalid book ID" },
        { status: 400 }
      );
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

    // Check if bookmark exists
    const bookmark = await db.collection("bookmarks").findOne({
      userId: user._id,
      bookId: new ObjectId(bookId),
    });

    return NextResponse.json({
      ok: true,
      bookmarked: !!bookmark,
    });
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to check bookmark" },
      { status: 500 }
    );
  }
}
