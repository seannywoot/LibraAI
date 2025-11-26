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

    const formData = await request.formData();
    const file = formData.get("file");
    const fileType = formData.get("fileType");

    console.log("Upload request received:", {
      hasFile: !!file,
      fileType: fileType,
      fileName: file?.name
    });

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
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

    // Handle PDF uploads
    if (fileType === "application/pdf") {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Extract title from filename (remove extension and timestamp)
      const extractedTitle = file.name.replace(/\.pdf$/i, "").replace(/_/g, " ");

      // Try to enrich metadata from Google Books API using title search
      let bookInfo = {
        title: extractedTitle,
        author: "Unknown Author",
        categories: ["General"],
        tags: [],
      };

      try {
        console.log(`Searching Google Books for: "${extractedTitle}"`);
        const googleRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(extractedTitle)}&maxResults=1`
        );
        const googleData = await googleRes.json();

        if (googleData.items && googleData.items.length > 0) {
          const volumeInfo = googleData.items[0].volumeInfo;

          // Extract and process categories
          let categories = [];
          if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
            categories = volumeInfo.categories.flatMap(cat =>
              cat.split('/').map(c => c.trim())
            ).filter(c => c.length > 0);
            categories = [...new Set(categories)];
          }

          // Extract subjects as tags
          let tags = [];
          if (volumeInfo.subjects && Array.isArray(volumeInfo.subjects)) {
            tags = volumeInfo.subjects.map(s => s.trim()).filter(s => s.length > 0);
            tags = [...new Set(tags)];
          }

          bookInfo = {
            title: volumeInfo.title || extractedTitle,
            author: volumeInfo.authors?.[0] || "Unknown Author",
            isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
            publisher: volumeInfo.publisher,
            year: volumeInfo.publishedDate?.substring(0, 4),
            description: volumeInfo.description,
            thumbnail: volumeInfo.imageLinks?.thumbnail,
            categories: categories.length > 0 ? categories : ["General"],
            tags: tags.length > 0 ? tags : [],
          };

          console.log(`Found book: "${bookInfo.title}" by ${bookInfo.author}`);
          console.log(`Categories: ${bookInfo.categories.join(", ")}`);
        } else {
          console.log(`No results found for: "${extractedTitle}"`);
        }
      } catch (apiError) {
        console.error("Error fetching book info from Google Books:", apiError);
        // Continue with extracted title if API fails
      }

      // Store PDF in MongoDB (student_ebooks collection)
      const pdfDoc = {
        userId: user._id,
        filename: file.name,
        contentType: file.type,
        size: buffer.length,
        data: buffer,
        uploadedAt: new Date(),
      };

      const pdfResult = await db.collection("student_ebooks").insertOne(pdfDoc);
      const pdfId = pdfResult.insertedId;

      // Add to personal library with reference to PDF
      const libraryResult = await db.collection("personal_libraries").insertOne({
        userId: user._id,
        title: bookInfo.title,
        author: bookInfo.author,
        isbn: bookInfo.isbn,
        publisher: bookInfo.publisher,
        year: bookInfo.year,
        description: bookInfo.description,
        thumbnail: bookInfo.thumbnail,
        categories: bookInfo.categories,
        tags: bookInfo.tags,
        fileType: "application/pdf",
        fileName: file.name,
        fileUrl: `/api/student/ebooks/${pdfId.toString()}`, // Point to new API endpoint
        fileSize: buffer.length,
        pdfId: pdfId, // Store reference to PDF document
        addedAt: new Date(),
        addedMethod: "pdf-upload",
      });

      return NextResponse.json({
        ok: true,
        message: "PDF uploaded successfully",
        book: {
          _id: libraryResult.insertedId.toString(),
          title: bookInfo.title,
          fileUrl: `/api/student/ebooks/${pdfId.toString()}`,
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported file type. Please upload a PDF file." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
