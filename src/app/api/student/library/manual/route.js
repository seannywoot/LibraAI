import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, author, isbn, publisher, year } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Title is required" },
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

    // Get or create user in database
    let user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    // If user doesn't exist in DB (e.g., demo user), create a minimal record
    if (!user) {
      const result = await db.collection("users").insertOne({
        email: session.user.email,
        name: session.user.name || "Student",
        role: "student",
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email: session.user.email, role: "student" };
    }

    // Check if book with same ISBN already in user's library
    if (isbn?.trim()) {
      const existing = await db.collection("personal_libraries").findOne({
        userId: user._id,
        isbn: isbn.trim(),
      });

      if (existing) {
        return NextResponse.json(
          { ok: false, error: "Book with this ISBN already in your library" },
          { status: 400 }
        );
      }
    }

    // Add to personal library
    const result = await db.collection("personal_libraries").insertOne({
      userId: user._id,
      title: title.trim(),
      author: author?.trim() || "Unknown Author",
      isbn: isbn?.trim() || null,
      publisher: publisher?.trim() || null,
      year: year?.trim() || null,
      addedAt: new Date(),
      addedMethod: "manual",
    });

    return NextResponse.json({
      ok: true,
      message: "Book added to library",
      book: {
        _id: result.insertedId,
        title: title.trim(),
        author: author?.trim() || "Unknown Author",
      },
    });
  } catch (error) {
    console.error("Error adding book manually:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to add book" },
      { status: 500 }
    );
  }
}
