import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), "public", "uploads", "ebooks");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${sanitizedName}`;
      const filepath = join(uploadsDir, filename);

      // Save file
      await writeFile(filepath, buffer);

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

      // Add to personal library
      const result = await db.collection("personal_libraries").insertOne({
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
        fileUrl: `/uploads/ebooks/${filename}`,
        fileSize: buffer.length,
        addedAt: new Date(),
        addedMethod: "pdf-upload",
      });

      return NextResponse.json({
        ok: true,
        message: "PDF uploaded successfully",
        book: {
          _id: result.insertedId.toString(),
          title: bookInfo.title,
          fileUrl: `/uploads/ebooks/${filename}`,
        },
      });
    }

    // Handle image uploads for OCR/barcode scanning
    if (fileType?.startsWith("image/")) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString("base64");

      // Try to extract ISBN from image
      // In production, integrate with OCR service (Google Cloud Vision, Tesseract.js, etc.)
      const extractedText = await performOCR(base64Image);
      const isbn = extractISBN(extractedText);

      if (!isbn) {
        return NextResponse.json(
          { ok: false, error: "No ISBN found in image. Please try scanning a barcode or upload a PDF instead." },
          { status: 400 }
        );
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
            bookInfo = {
              title: volumeInfo.title || "Unknown Title",
              author: volumeInfo.authors?.[0] || "Unknown Author",
              isbn: isbn,
              publisher: volumeInfo.publisher,
              year: volumeInfo.publishedDate?.substring(0, 4),
              description: volumeInfo.description,
              thumbnail: volumeInfo.imageLinks?.thumbnail,
            };
          } else {
            bookInfo = {
              title: "Unknown Book",
              author: "Unknown Author",
              isbn: isbn,
            };
          }
        } catch (apiError) {
          console.error("Error fetching book info:", apiError);
          bookInfo = {
            title: "Unknown Book",
            author: "Unknown Author",
            isbn: isbn,
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

      // Add to personal library
      await db.collection("personal_libraries").insertOne({
        userId: user._id,
        isbn: isbn,
        title: bookInfo.title,
        author: bookInfo.author,
        publisher: bookInfo.publisher,
        year: bookInfo.year,
        description: bookInfo.description,
        thumbnail: bookInfo.thumbnail,
        addedAt: new Date(),
        addedMethod: "image-ocr",
      });

      return NextResponse.json({
        ok: true,
        message: "Book added to library",
        book: bookInfo,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Unsupported file type. Please upload a PDF or image file." },
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

async function performOCR(base64Image) {
  // Placeholder for OCR implementation
  // In production, integrate with:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Tesseract.js (client-side)
  // - Azure Computer Vision
  return "";
}

function extractISBN(text) {
  // Extract ISBN-10 or ISBN-13 from text
  const isbn13Pattern = /(?:ISBN(?:-13)?:?\s*)?(\d{3}[-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d)/gi;
  const isbn10Pattern = /(?:ISBN(?:-10)?:?\s*)?(\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d)/gi;

  let match = text.match(isbn13Pattern);
  if (match) {
    return match[0].replace(/[^\d]/g, "");
  }

  match = text.match(isbn10Pattern);
  if (match) {
    return match[0].replace(/[^\d]/g, "");
  }

  return null;
}
