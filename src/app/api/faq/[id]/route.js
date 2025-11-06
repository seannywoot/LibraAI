import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(request, { params }) {
  try {
    const db = await getDb();
    const faqCollection = db.collection("faqs");
    
    // Await params in Next.js 15
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const updates = await request.json();

    console.log("Updating FAQ with ID:", id);

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid FAQ ID format" },
        { status: 400 }
      );
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    const result = await faqCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "FAQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, faq: result });
  } catch (error) {
    console.error("FAQ update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = await getDb();
    const faqCollection = db.collection("faqs");
    
    // Await params in Next.js 15
    const resolvedParams = await params;
    const { id } = resolvedParams;

    console.log("Deleting FAQ with ID:", id);

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid FAQ ID format" },
        { status: 400 }
      );
    }

    const result = await faqCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "FAQ not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "FAQ deleted" });
  } catch (error) {
    console.error("FAQ deletion error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
