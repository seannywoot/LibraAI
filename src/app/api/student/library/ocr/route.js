import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    const image = formData.get("image");

    if (!image) {
      return NextResponse.json(
        { ok: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Use Google Cloud Vision API or similar for OCR
    // For now, we'll use a simple regex pattern matching approach
    // In production, integrate with Google Cloud Vision, AWS Textract, or Tesseract.js

    // Simple ISBN extraction from text (this is a placeholder)
    // You would typically send this to an OCR service
    const extractedText = await performOCR(base64Image);
    const isbn = extractISBN(extractedText);

    if (!isbn) {
      return NextResponse.json(
        { ok: false, error: "No ISBN found in image" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      isbn: isbn,
      extractedText: extractedText,
    });
  } catch (error) {
    console.error("Error processing OCR:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to process image" },
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

  // For demo purposes, return empty string
  // Real implementation would call OCR service here
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
