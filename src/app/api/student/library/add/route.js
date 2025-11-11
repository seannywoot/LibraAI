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
    const { isbn, method } = body;

    if (!isbn) {
      return NextResponse.json(
        { ok: false, error: "ISBN is required" },
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

    // Try to find book in library catalog
    let bookInfo = await db.collection("books").findOne({ isbn });

    // If not found, fetch from external API (Google Books)
    if (!bookInfo) {
      try {
        const googleRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const googleData = await googleRes.json();

        if (googleData.items && googleData.items.length > 0) {
          const volumeInfo = googleData.items[0].volumeInfo;
          
          // Extract and process categories from Google Books
          let categories = [];
          if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
            // Google Books categories are often like "Computers / Programming / Java"
            // Split them and clean them up
            categories = volumeInfo.categories.flatMap(cat => 
              cat.split('/').map(c => c.trim())
            ).filter(c => c.length > 0);
            
            // Remove duplicates
            categories = [...new Set(categories)];
          }
          
          // Extract subjects as additional tags
          let tags = [];
          if (volumeInfo.subjects && Array.isArray(volumeInfo.subjects)) {
            tags = volumeInfo.subjects.map(s => s.trim()).filter(s => s.length > 0);
            tags = [...new Set(tags)];
          }
          
          bookInfo = {
            title: volumeInfo.title || "Unknown Title",
            author: volumeInfo.authors?.[0] || "Unknown Author",
            isbn: isbn,
            publisher: volumeInfo.publisher,
            year: volumeInfo.publishedDate?.substring(0, 4),
            description: volumeInfo.description,
            thumbnail: volumeInfo.imageLinks?.thumbnail,
            categories: categories.length > 0 ? categories : ["General"],
            tags: tags.length > 0 ? tags : [],
          };
        } else {
          bookInfo = {
            title: "Unknown Book",
            author: "Unknown Author",
            isbn: isbn,
            categories: ["General"],
            tags: [],
          };
        }
      } catch (apiError) {
        console.error("Error fetching book info:", apiError);
        bookInfo = {
          title: "Unknown Book",
          author: "Unknown Author",
          isbn: isbn,
          categories: ["General"],
          tags: [],
        };
      }
    }

    // Check if book already in user's library
    const existing = await db.collection("personal_libraries").findOne({
      userId: user._id,
      isbn: isbn,
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Book already in your library" },
        { status: 400 }
      );
    }

    // Log the book info for debugging
    console.log("Adding book to library:", {
      title: bookInfo.title,
      categories: bookInfo.categories,
      tags: bookInfo.tags
    });

    // Add to personal library
    const insertResult = await db.collection("personal_libraries").insertOne({
      userId: user._id,
      isbn: isbn,
      title: bookInfo.title,
      author: bookInfo.author,
      publisher: bookInfo.publisher,
      year: bookInfo.year,
      description: bookInfo.description,
      thumbnail: bookInfo.thumbnail,
      categories: bookInfo.categories || ["General"],
      tags: bookInfo.tags || [],
      addedAt: new Date(),
      addedMethod: method || "manual",
    });

    return NextResponse.json({
      ok: true,
      message: "Book added to library",
      book: bookInfo,
      bookId: insertResult.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error adding book:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to add book" },
      { status: 500 }
    );
  }
}
