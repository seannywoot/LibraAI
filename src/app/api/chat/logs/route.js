import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getDb();
    const chatLogsCollection = db.collection("chat_logs");

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    let query = {};

    // Admin can see all logs, users can only see their own
    if (session.user.role !== "admin") {
      query.userId = session.user.email;
    } else if (userId) {
      query.userId = userId;
    }

    if (conversationId) {
      query.conversationId = conversationId;
    }

    const logs = await chatLogsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await chatLogsCollection.countDocuments(query);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Chat logs fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch chat logs" },
      { status: 500 }
    );
  }
}
