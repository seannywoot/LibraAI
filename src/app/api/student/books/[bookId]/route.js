import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { bookId } = await params;

    if (!bookId) {
      return NextResponse.json(
        { ok: false, error: "Invalid book ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Fetch the book - try by slug first, then by ObjectId
    let book = await db.collection("books").findOne({ slug: bookId });
    
    // If not found by slug and bookId is a valid ObjectId, try by ObjectId
    if (!book && ObjectId.isValid(bookId)) {
      book = await db.collection("books").findOne({
        _id: new ObjectId(bookId),
      });
    }

    if (!book) {
      return NextResponse.json(
        { ok: false, error: "Book not found" },
        { status: 404 }
      );
    }

    // Check if the book is reserved for the current user
    if (book.status === "reserved" && book.reservedBy) {
      const user = await db.collection("users").findOne({
        email: session.user.email,
      });

      if (user && book.reservedBy.toString() === user._id.toString()) {
        book.reservedForCurrentUser = true;
      }
    }

    // Convert ObjectId to string for JSON serialization
    book._id = book._id.toString();
    if (book.reservedBy) {
      book.reservedBy = book.reservedBy.toString();
    }

    return NextResponse.json({
      ok: true,
      book,
    });
  } catch (error) {
    console.error("Error fetching book details:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
