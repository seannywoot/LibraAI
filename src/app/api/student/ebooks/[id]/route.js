import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse(
                JSON.stringify({ error: "Unauthorized - Please sign in" }),
                {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Next.js 15+ requires params to be awaited
        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid PDF ID format" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get user to verify ownership
        const user = await db
            .collection("users")
            .findOne({ email: session.user.email });

        if (!user) {
            return new NextResponse(
                JSON.stringify({ error: "User not found" }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Fetch PDF - ensure user owns it
        const pdf = await db.collection("student_ebooks").findOne({
            _id: new ObjectId(id),
            userId: user._id
        });

        if (!pdf) {
            return new NextResponse(
                JSON.stringify({
                    error: "PDF not found or access denied",
                    hint: "You can only access PDFs you uploaded."
                }),
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Return the PDF file - using pdf.data.buffer like admin route
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
