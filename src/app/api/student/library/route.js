import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { parseSearchQuery, escapeRegex } from "@/utils/searchParser";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check role from session (middleware already ensures only students can access this route)
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

    // Build query for user's personal library
    const query = { userId: user._id };
    
    // Add search filter with advanced syntax support (e.g., "author: Rowling", "title: Harry Potter")
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
        query.$or = orConditions;
      }
    }

    // Get user's personal library
    const library = await db
      .collection("personal_libraries")
      .find(query)
      .sort({ addedAt: -1 })
      .toArray();

    return NextResponse.json({
      ok: true,
      books: library,
    });
  } catch (error) {
    console.error("Error loading library:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load library" },
      { status: 500 }
    );
  }
}
