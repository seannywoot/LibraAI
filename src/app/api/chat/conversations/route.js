import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";

/**
 * GET /api/chat/conversations
 * 
 * Load all conversations for the authenticated user
 * Returns the 20 most recent conversations sorted by lastUpdated
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 */
export async function GET() {
  try {
    // Requirement 3.2: Authenticate the user session
    const session = await getServerSession(authOptions);
    
    // Requirement 3.7: Return 401 if user is not authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in to access your conversations"
        },
        { status: 401 }
      );
    }

    // Get database connection
    const db = await getDb();
    const conversationsCollection = db.collection("conversations");

    // Get user ID from session
    const userId = session.user.id || session.user.email;

    // Requirement 3.3: Return all conversations belonging to the authenticated user
    // Requirement 3.4: Sort conversations by lastUpdated timestamp in descending order
    // Requirement 3.5: Limit the response to the 20 most recent conversations
    const conversations = await conversationsCollection
      .find({ userId: userId })
      .sort({ lastUpdated: -1 })
      .limit(20)
      .toArray();

    // Requirement 3.6: Return success response with conversation objects
    // Format conversations for client consumption
    const formattedConversations = conversations.map((conv) => ({
      id: conv.conversationId,
      title: conv.title,
      messages: conv.messages,
      lastUpdated: conv.lastUpdated.toISOString(),
    }));

    return NextResponse.json(
      {
        success: true,
        conversations: formattedConversations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error loading conversations:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load conversations. Please try again later.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * 
 * Save or update a conversation for the authenticated user
 * Implements upsert logic: updates existing conversation or creates new one
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8
 */
export async function POST(request) {
  try {
    // Requirement 2.2: Authenticate the user session
    const session = await getServerSession(authOptions);
    
    // Requirement 2.7: Return 401 if user is not authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please sign in to save conversations"
        },
        { status: 401 }
      );
    }

    // Requirement 2.3: Accept conversationId, title, and messages in the request body
    const body = await request.json();
    const { conversationId, title, messages } = body;

    // Requirement 2.8: Validate request data
    if (!conversationId || typeof conversationId !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: conversationId must be a number"
        },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: title must be a non-empty string"
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: title must not exceed 200 characters"
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: messages must be a non-empty array"
        },
        { status: 400 }
      );
    }

    // Validate message structure
    for (const message of messages) {
      if (!message.role || !['user', 'assistant'].includes(message.role)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request: each message must have a valid role (user or assistant)"
          },
          { status: 400 }
        );
      }

      if (!message.content || typeof message.content !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request: each message must have content"
          },
          { status: 400 }
        );
      }

      if (!message.timestamp || typeof message.timestamp !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request: each message must have a timestamp"
          },
          { status: 400 }
        );
      }
    }

    // Get database connection
    const db = await getDb();
    const conversationsCollection = db.collection("conversations");

    // Get user ID from session
    const userId = session.user.id || session.user.email;

    // Prepare conversation document
    const now = new Date();
    const conversationDoc = {
      userId: userId,
      conversationId: conversationId,
      title: title.trim(),
      messages: messages,
      lastUpdated: now
    };

    // Requirement 2.4 & 2.5: Implement upsert logic
    // Check if conversation already exists for this user
    const existingConversation = await conversationsCollection.findOne({
      userId: userId,
      conversationId: conversationId
    });

    if (existingConversation) {
      // Requirement 2.4: Update existing conversation
      await conversationsCollection.updateOne(
        {
          userId: userId,
          conversationId: conversationId
        },
        {
          $set: {
            title: conversationDoc.title,
            messages: conversationDoc.messages,
            lastUpdated: conversationDoc.lastUpdated
          }
        }
      );
    } else {
      // Requirement 2.5: Create new conversation
      conversationDoc.createdAt = now;
      await conversationsCollection.insertOne(conversationDoc);
    }

    // Requirement 2.6: Return success response
    return NextResponse.json(
      {
        success: true,
        conversationId: conversationId,
        message: "Conversation saved successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving conversation:", error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request: malformed JSON"
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save conversation. Please try again later."
      },
      { status: 500 }
    );
  }
}
