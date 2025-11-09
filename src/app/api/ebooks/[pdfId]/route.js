import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized - Please sign in to access eBooks" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const { pdfId } = await params;
    
    if (!pdfId) {
      return new NextResponse(
        JSON.stringify({ error: "PDF ID is required" }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    if (!ObjectId.isValid(pdfId)) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid PDF ID format",
          hint: "This eBook may have been added before the PDF storage feature was implemented. Please contact the librarian to re-upload this eBook."
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const pdfs = db.collection("ebook_pdfs");

    const pdf = await pdfs.findOne({ _id: new ObjectId(pdfId) });

    if (!pdf) {
      return new NextResponse(
        JSON.stringify({ 
          error: "PDF not found in database",
          hint: "This eBook may need to be re-uploaded by the librarian."
        }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Return the PDF file
    return new NextResponse(pdf.data.buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${pdf.filename}"`,
        "Content-Length": pdf.size.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("PDF retrieval failed:", err);
    return new NextResponse(
      JSON.stringify({ 
        error: "Failed to retrieve PDF",
        details: err.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
