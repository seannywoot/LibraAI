import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";

/**
 * DELETE /api/chat/conversations/[conversationId]
 * 
 * Delete a specific conversation for the authenticated user
 * Verifies conversation ownership before deletion
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export async function DELETE(request, { params }) {
  try {
    // Requirement 4.2: Authenticate the user session
    const session = await getServerSession(authOptions);
    
    // Requirement 4.6: Return 401 if user is not authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in to delete conversations"
        },
        { status: 401 }
      );
    }

    // Extract conversationId from URL parameters
    const { conversationId } = params;
    
    // Validate conversationId
    const conversationIdNum = Number(conversationId);
    if (isNaN(conversationIdNum)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid conversation ID"
        },
        { status: 400 }
      );
    }

    // Get database connection
    const db = await getDb();
    const conversationsCollection = db.collection("conversations");

    // Get user ID from session
    const userId = session.user.id || session.user.email;

    // Requirement 4.3: Verify that the conversation belongs to the authenticated user
    const conversation = await conversationsCollection.findOne({
      userId: userId,
      conversationId: conversationIdNum
    });

    // Requirement 4.8: Return 404 if conversation does not exist
    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: "Conversation not found"
        },
        { status: 404 }
      );
    }

    // Requirement 4.7: Return 403 if conversation doesn't belong to user
    // (This is already handled by the findOne query above, but we add explicit check)
    if (conversation.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - You do not have permission to delete this conversation"
        },
        { status: 403 }
      );
    }

    // Requirement 4.4: Permanently remove the conversation from the database
    const deleteResult = await conversationsCollection.deleteOne({
      userId: userId,
      conversationId: conversationIdNum
    });

    // Verify deletion was successful
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete conversation"
        },
        { status: 500 }
      );
    }

    // Requirement 4.5: Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Conversation deleted successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete conversation. Please try again later."
      },
      { status: 500 }
    );
  }
}
