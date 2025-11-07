import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request, { params }) {
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid book ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    const book = await db.collection("personal_libraries").findOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    if (!book) {
      return NextResponse.json(
        { ok: false, error: "Book not found in your library" },
        { status: 404 }
      );
    }

    const safeBook = {
      ...book,
      _id: book._id.toString(),
      userId: book.userId?.toString?.() ?? book.userId,
    };

    return NextResponse.json({ ok: true, book: safeBook });
  } catch (error) {
    console.error("Error retrieving personal book:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load book" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, error: "Invalid book ID" },
        { status: 400 }
      );
    }

    // Check role from session (middleware already ensures only students can access this route)
    if (session.user.role !== "student") {
      return NextResponse.json(
        { ok: false, error: "Access denied" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user from database
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get book info before deleting
    const book = await db.collection("personal_libraries").findOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    if (!book) {
      return NextResponse.json(
        { ok: false, error: "Book not found in your library" },
        { status: 404 }
      );
    }

    // Delete PDF file if it exists
    if (book.fileType === "application/pdf" && book.fileUrl) {
      try {
        const filepath = join(process.cwd(), "public", book.fileUrl);
        if (existsSync(filepath)) {
          await unlink(filepath);
        }
      } catch (fileError) {
        console.error("Error deleting PDF file:", fileError);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete book from personal library
    const result = await db.collection("personal_libraries").deleteOne({
      _id: new ObjectId(id),
      userId: user._id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { ok: false, error: "Book not found in your library" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Book removed from library",
    });
  } catch (error) {
    console.error("Error removing book:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to remove book" },
      { status: 500 }
    );
  }
}
