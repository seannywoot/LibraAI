import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { faqId, feedback, reason } = await request.json();

    if (!faqId || !feedback) {
      return NextResponse.json(
        { success: false, error: "FAQ ID and feedback are required" },
        { status: 400 }
      );
    }

    if (!["helpful", "not-helpful"].includes(feedback)) {
      return NextResponse.json(
        { success: false, error: "Invalid feedback value" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const feedbackCollection = db.collection("faq_feedback");
    const faqCollection = db.collection("faqs");

    // Check if FAQ exists
    const faq = await faqCollection.findOne({ _id: new ObjectId(faqId) });
    if (!faq) {
      return NextResponse.json(
        { success: false, error: "FAQ not found" },
        { status: 404 }
      );
    }

    // Check if user already gave feedback for this FAQ
    const existingFeedback = await feedbackCollection.findOne({
      faqId: new ObjectId(faqId),
      userId: session.user.email
    });

    if (existingFeedback) {
      // Update existing feedback
      await feedbackCollection.updateOne(
        { _id: existingFeedback._id },
        {
          $set: {
            feedback,
            ...(reason && { reason }),
            updatedAt: new Date()
          }
        }
      );
    } else {
      // Create new feedback entry
      await feedbackCollection.insertOne({
        faqId: new ObjectId(faqId),
        userId: session.user.email,
        userName: session.user.name || "Anonymous",
        feedback,
        ...(reason && { reason }),
        question: faq.question,
        category: faq.category,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully"
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can delete feedback
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { feedbackId } = await request.json();

    if (!feedbackId) {
      return NextResponse.json(
        { success: false, error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const feedbackCollection = db.collection("faq_feedback");

    // Delete the feedback entry
    const result = await feedbackCollection.deleteOne({
      _id: new ObjectId(feedbackId)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Feedback not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
