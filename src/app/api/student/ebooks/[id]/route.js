import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json(
                { ok: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = params;

        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { ok: false, error: "Invalid PDF ID" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get user
        const user = await db
            .collection("users")
            .findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { ok: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Fetch PDF from database
        const pdf = await db.collection("student_ebooks").findOne({
            _id: new ObjectId(id),
            userId: user._id, // Ensure user owns this PDF
        });

        if (!pdf) {
            return NextResponse.json(
                { ok: false, error: "PDF not found or access denied" },
                { status: 404 }
            );
        }

        // Return PDF as blob
        return new NextResponse(pdf.data.buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${pdf.filename}"`,
                "Content-Length": pdf.size.toString(),
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Error serving PDF:", error);
        return NextResponse.json(
            { ok: false, error: error.message || "Failed to serve PDF" },
            { status: 500 }
        );
    }
}
