import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

/**
 * GET /api/student/quizzes/[quizId]
 * Fetch a specific quiz with all questions
 */
export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "student") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        // Next.js 15: params is now a Promise
        const { quizId } = await params;

        if (!ObjectId.isValid(quizId)) {
            return NextResponse.json({ ok: false, error: "Invalid quiz ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const quizzes = db.collection("quizzes");

        const quiz = await quizzes.findOne({
            _id: new ObjectId(quizId),
            userId: new ObjectId(session.user.id)
        });

        if (!quiz) {
            return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, quiz });
    } catch (error) {
        console.error("Failed to fetch quiz:", error);
        return NextResponse.json(
            { ok: false, error: error?.message || "Unknown error" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/student/quizzes/[quizId]
 * Delete a quiz and all its associated results
 */
export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user?.role !== "student") {
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        // Next.js 15: params is now a Promise
        const { quizId } = await params;

        if (!ObjectId.isValid(quizId)) {
            return NextResponse.json({ ok: false, error: "Invalid quiz ID" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const quizzes = db.collection("quizzes");
        const quizResults = db.collection("quizResults");

        // Delete the quiz (verify it belongs to the user)
        const deleteResult = await quizzes.deleteOne({
            _id: new ObjectId(quizId),
            userId: new ObjectId(session.user.id)
        });

        if (deleteResult.deletedCount === 0) {
            return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
        }

        // Also delete all results associated with this quiz
        await quizResults.deleteMany({ quizId: new ObjectId(quizId) });

        return NextResponse.json({ ok: true, message: "Quiz deleted successfully" });
    } catch (error) {
        console.error("Failed to delete quiz:", error);
        return NextResponse.json(
            { ok: false, error: error?.message || "Unknown error" },
            { status: 500 }
        );
    }
}
