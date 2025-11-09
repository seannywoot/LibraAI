import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.user?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const bookId = formData.get("bookId");

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { ok: false, error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    // Read the PDF file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store in MongoDB GridFS or as binary data
    const client = await clientPromise;
    const db = client.db();
    const pdfs = db.collection("ebook_pdfs");

    // Create PDF document
    const pdfDoc = {
      filename: file.name,
      contentType: file.type,
      size: buffer.length,
      data: buffer,
      bookId: bookId ? new ObjectId(bookId) : null,
      uploadedBy: session.user?.email,
      uploadedAt: new Date(),
    };

    const result = await pdfs.insertOne(pdfDoc);

    return NextResponse.json({
      ok: true,
      pdfId: result.insertedId.toString(),
      filename: file.name,
    });
  } catch (err) {
    console.error("PDF upload failed:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
