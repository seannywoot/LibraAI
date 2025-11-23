import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

/**
 * GET /api/student/quizzes/[quizId]/results
 * Fetch all results/attempts for a specific quiz
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
        const quizResults = db.collection("quizResults");

        const results = await quizResults
            .find({
                userId: new ObjectId(session.user.id),
                quizId: new ObjectId(quizId)
            })
            .sort({ completedAt: -1 })
            .toArray();

        return NextResponse.json({ ok: true, results });
    } catch (error) {
        console.error("Failed to fetch quiz results:", error);
        return NextResponse.json(
            { ok: false, error: error?.message || "Unknown error" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/student/quizzes/[quizId]/results
 * Submit quiz answers and save the result
 */
export async function POST(request, { params }) {
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

        const body = await request.json();
        const { answers, timeSpent } = body;

        if (!Array.isArray(answers)) {
            return NextResponse.json(
                { ok: false, error: "Answers must be an array" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const quizzes = db.collection("quizzes");
        const quizResults = db.collection("quizResults");

        // Fetch the quiz to validate and calculate score
        const quiz = await quizzes.findOne({
            _id: new ObjectId(quizId),
            userId: new ObjectId(session.user.id)
        });

        if (!quiz) {
            return NextResponse.json({ ok: false, error: "Quiz not found" }, { status: 404 });
        }

        // Validate answers length
        if (answers.length !== quiz.questions.length) {
            return NextResponse.json(
                { ok: false, error: "Invalid number of answers" },
                { status: 400 }
            );
        }

        // Calculate score
        let correctCount = 0;
        quiz.questions.forEach((question, index) => {
            if (answers[index] === question.correctAnswer) {
                correctCount++;
            }
        });

        const totalQuestions = quiz.questions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);

        // Save the result
        const newResult = {
            userId: new ObjectId(session.user.id),
            quizId: new ObjectId(quizId),
            quizTitle: quiz.title,
            answers: answers,
            score: correctCount,
            totalQuestions: totalQuestions,
            percentage: percentage,
            completedAt: new Date(),
            timeSpent: timeSpent || 0
        };

        const result = await quizResults.insertOne(newResult);

        return NextResponse.json({
            ok: true,
            resultId: result.insertedId,
            score: correctCount,
            totalQuestions: totalQuestions,
            percentage: percentage,
            message: "Quiz submitted successfully"
        });
    } catch (error) {
        console.error("Failed to submit quiz:", error);
        return NextResponse.json(
            { ok: false, error: error?.message || "Unknown error" },
            { status: 500 }
        );
    }
}
