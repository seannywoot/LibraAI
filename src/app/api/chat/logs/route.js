import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { logId, convertedToFAQ, dismissed } = await request.json();

    if (!logId) {
      return NextResponse.json(
        { success: false, error: "Log ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const chatLogsCollection = db.collection("chat_logs");

    // Build update object based on action
    const updateFields = {};
    
    if (convertedToFAQ !== undefined) {
      updateFields.convertedToFAQ = convertedToFAQ;
      updateFields.convertedAt = new Date();
      updateFields.convertedBy = session.user.email;
    }
    
    if (dismissed !== undefined) {
      updateFields.dismissed = dismissed;
      updateFields.dismissedAt = new Date();
      updateFields.dismissedBy = session.user.email;
    }

    const result = await chatLogsCollection.updateOne(
      { _id: new ObjectId(logId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Chat log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Chat log updated successfully"
    });
  } catch (error) {
    console.error("Error updating chat log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update chat log" },
      { status: 500 }
    );
  }
}
