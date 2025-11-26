import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getDb } from "@/lib/mongodb";

/**
 * POST /api/chat/fix-timestamps
 * 
 * Fix conversation lastUpdated timestamps by using the last message timestamp
 * This is needed because the initial migration incorrectly set all timestamps to current time
 */
export async function POST() {
    try {
        // Authenticate - only allow this for logged-in users
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Unauthorized - Please sign in"
                },
                { status: 401 }
            );
        }

        const db = await getDb();
        const conversationsCollection = db.collection("conversations");

        // Get user ID from session
        const userId = session.user.id || session.user.email;

        // Get all conversations for this user
        const conversations = await conversationsCollection
            .find({ userId: userId })
            .toArray();

        let updatedCount = 0;
        let errorCount = 0;

        for (const conv of conversations) {
            try {
                if (!conv.messages || conv.messages.length === 0) {
                    continue;
                }

                // Get the timestamp of the last message
                const lastMessage = conv.messages[conv.messages.length - 1];

                if (!lastMessage.timestamp) {
                    console.warn(`Conversation ${conv.conversationId} has no timestamp in last message`);
                    errorCount++;
                    continue;
                }

                // Parse the timestamp (it might be a string or Date)
                const lastMessageTimestamp = new Date(lastMessage.timestamp);

                if (isNaN(lastMessageTimestamp.getTime())) {
                    console.warn(`Conversation ${conv.conversationId} has invalid timestamp: ${lastMessage.timestamp}`);
                    errorCount++;
                    continue;
                }

                // Update the conversation's lastUpdated to match the last message
                await conversationsCollection.updateOne(
                    {
                        userId: userId,
                        conversationId: conv.conversationId
                    },
                    {
                        $set: {
                            lastUpdated: lastMessageTimestamp
                        }
                    }
                );

                updatedCount++;
            } catch (error) {
                console.error(`Error fixing timestamp for conversation ${conv.conversationId}:`, error);
                errorCount++;
            }
        }

        return NextResponse.json(
            {
                success: true,
                message: `Fixed ${updatedCount} conversation timestamps`,
                updatedCount,
                errorCount,
                totalConversations: conversations.length
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fixing conversation timestamps:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fix timestamps. Please try again later."
            },
            { status: 500 }
        );
    }
}
