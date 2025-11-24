import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { parseSearchQuery, escapeRegex } from "@/utils/searchParser";

// GET /api/student/books/bookmarked - Get all bookmarked books for the current student
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
    const search = searchParams.get("search")?.trim() || "";

    const client = await clientPromise;
    const db = client.db();

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

    // Get all bookmarks for this user
    const bookmarks = await db
      .collection("bookmarks")
      .find({ userId: user._id })
      .sort({ createdAt: -1 })
      .toArray();

    if (bookmarks.length === 0) {
      return NextResponse.json({
        ok: true,
        books: [],
      });
    }

    // Get book IDs
    const bookIds = bookmarks.map((b) => b.bookId);

    // Build query for books with advanced syntax support (e.g., "author: Rowling", "title: Harry Potter")
    const bookQuery = { _id: { $in: bookIds } };

    // Add search filter if provided
    if (search) {
      const { filters, freeText } = parseSearchQuery(search);
      const orConditions = [];

      if (filters.title) {
        orConditions.push({ title: { $regex: escapeRegex(filters.title), $options: "i" } });
      }
      if (filters.author) {
        orConditions.push({ author: { $regex: escapeRegex(filters.author), $options: "i" } });
      }
      if (filters.isbn) {
        orConditions.push({ isbn: { $regex: escapeRegex(filters.isbn), $options: "i" } });
      }

      if (freeText) {
        const escapedText = escapeRegex(freeText);
        orConditions.push(
          { title: { $regex: escapedText, $options: "i" } },
          { author: { $regex: escapedText, $options: "i" } },
          { isbn: { $regex: escapedText, $options: "i" } }
        );
      }

      if (orConditions.length === 0) {
        const escapedSearch = escapeRegex(search);
        orConditions.push(
          { title: { $regex: escapedSearch, $options: "i" } },
          { author: { $regex: escapedSearch, $options: "i" } },
          { isbn: { $regex: escapedSearch, $options: "i" } }
        );
      }

      if (orConditions.length > 0) {
        bookQuery.$or = orConditions;
      }
    }

    // Get the actual books
    const books = await db
      .collection("books")
      .find(bookQuery)
      .toArray();

    // Add bookmark date to each book
    const booksWithBookmarkDate = books.map((book) => {
      const bookmark = bookmarks.find(
        (b) => b.bookId.toString() === book._id.toString()
      );
      return {
        ...book,
        _id: book._id.toString(),
        bookmarkedAt: bookmark?.createdAt,
      };
    });

    // Sort by bookmark date (most recent first)
    booksWithBookmarkDate.sort(
      (a, b) => new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt)
    );

    return NextResponse.json({
      ok: true,
      books: booksWithBookmarkDate,
    });
  } catch (error) {
    console.error("Error fetching bookmarked books:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch bookmarked books" },
      { status: 500 }
    );
  }
}
