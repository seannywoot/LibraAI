import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        console.log("========== GET /api/student/quizzes ==========");
        const session = await getServerSession(authOptions);
        console.log("Session user:", session?.user?.email, "Role:", session?.user?.role);

        if (!session || session.user?.role !== "student") {
            console.log("❌ Unauthorized - no session or wrong role");
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        console.log("User ID:", session.user.id);
        const client = await clientPromise;
        const db = client.db();
        const quizzes = db.collection("quizzes");
        const quizResults = db.collection("quizResults");

        console.log("Fetching quizzes for user:", session.user.id);
        const userQuizzes = await quizzes
            .find({ userId: new ObjectId(session.user.id) })
            .sort({ createdAt: -1 })
            .toArray();

        console.log("Found quizzes:", userQuizzes.length);
        console.log("Quiz IDs:", userQuizzes.map(q => q._id.toString()));

        const quizzesWithResults = await Promise.all(
            userQuizzes.map(async (quiz) => {
                const latestResult = await quizResults
                    .findOne({ userId: new ObjectId(session.user.id), quizId: quiz._id }, { sort: { completedAt: -1 } });

                const attemptCount = await quizResults.countDocuments({
                    userId: new ObjectId(session.user.id),
                    quizId: quiz._id
                });

                return {
                    _id: quiz._id,
                    title: quiz.title,
                    pdfFileName: quiz.pdfFileName,
                    questionCount: quiz.questionCount,
                    createdAt: quiz.createdAt,
                    latestScore: latestResult ? latestResult.score : null,
                    latestPercentage: latestResult ? latestResult.percentage : null,
                    attemptCount: attemptCount
                };
            })
        );

        console.log("✅ Returning", quizzesWithResults.length, "quizzes");
        console.log("=============================================");
        return NextResponse.json({ ok: true, quizzes: quizzesWithResults });
    } catch (error) {
        console.error("❌ Failed to fetch quizzes:", error);
        return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        console.log("========== POST /api/student/quizzes ==========");
        const session = await getServerSession(authOptions);
        console.log("Session user:", session?.user?.email);
        
        if (!session || session.user?.role !== "student") {
            console.log("❌ Unauthorized");
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }
        
        console.log("✅ User authorized:", session.user.id);

        const formData = await request.formData();
        const pdfFile = formData.get("pdf");
        const questionCount = parseInt(formData.get("questionCount") || "10", 10);

        if (!pdfFile) {
            return NextResponse.json({ ok: false, error: "PDF file is required" }, { status: 400 });
        }

        if (![5, 10, 15].includes(questionCount)) {
            return NextResponse.json({ ok: false, error: "Question count must be 5, 10, or 15" }, { status: 400 });
        }

        const MAX_SIZE = 10 * 1024 * 1024;
        if (pdfFile.size > MAX_SIZE) {
            return NextResponse.json({ ok: false, error: "PDF file must be less than 10MB" }, { status: 400 });
        }

        if (pdfFile.type !== "application/pdf") {
            return NextResponse.json({ ok: false, error: "File must be a PDF" }, { status: 400 });
        }

        const arrayBuffer = await pdfFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let pdfText = "";
        try {
            console.log("📄 Starting PDF text extraction...");
            const pdfjs = await import("pdfjs-dist/legacy/build/pdf.js");

            // Disable worker for serverless environment
            if (pdfjs.GlobalWorkerOptions) {
                pdfjs.GlobalWorkerOptions.workerSrc = null;
            }

            console.log("✅ PDF.js loaded, worker disabled");

            const pdfBytes = new Uint8Array(buffer);
            console.log("📦 PDF bytes prepared, size:", pdfBytes.length);
            
            const loadingTask = pdfjs.getDocument({ 
                data: pdfBytes,
                useWorkerFetch: false,
                isEvalSupported: false,
                useSystemFonts: true
            });
            
            const doc = await loadingTask.promise;
            console.log("✅ PDF loaded, pages:", doc.numPages);

            const numPages = doc.numPages || 1;
            const maxPages = Math.min(numPages, 20);

            let fullText = "";
            for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
                const page = await doc.getPage(pageNum);
                const content = await page.getTextContent();
                const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
                fullText += `\n\n${pageText}`;
                console.log(`✅ Extracted page ${pageNum}/${maxPages}`);
            }

            pdfText = fullText.trim();
            console.log("✅ Total text extracted:", pdfText.length, "characters");
        } catch (pdfError) {
            console.error("❌ PDF text extraction error:", pdfError);
            console.error("Error stack:", pdfError.stack);
            return NextResponse.json({ 
                ok: false, 
                error: `Failed to extract text from PDF: ${pdfError.message}` 
            }, { status: 500 });
        }

        if (!pdfText || pdfText.trim().length < 100) {
            return NextResponse.json({ ok: false, error: "PDF does not contain enough text content" }, { status: 400 });
        }

        const bytezApiKey = process.env.BYTEZ_API_KEY;
        if (!bytezApiKey) {
            console.error("❌ BYTEZ_API_KEY environment variable is not set");
            return NextResponse.json({ ok: false, error: "AI API key not configured" }, { status: 500 });
        }
        console.log("✅ Bytez API key found, length:", bytezApiKey.length);

        const Bytez = (await import("bytez.js")).default;
        const bytezSDK = new Bytez(bytezApiKey);
        const bytezModel = bytezSDK.model("openai/gpt-4o");

        const systemPrompt = `You are a quiz generator. Generate exactly ${questionCount} multiple-choice questions based on the provided document text. Each question should have 4 options and one correct answer. Return ONLY a valid JSON array with this structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]
The correctAnswer field should be the index (0-3) of the correct option. Make sure questions are relevant to the content and test comprehension.`;

        const userPrompt = `Generate ${questionCount} multiple-choice questions from this document:\n\n${pdfText.substring(0, 10000)}`;

        let aiContent = "";
        try {
            console.log("🤖 Calling Bytez AI...");
            const messages = [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ];

            const { error, output } = await bytezModel.run(messages, {
                temperature: 0.7,
                max_tokens: 2000
            });

            if (error) {
                console.error("❌ Bytez AI generation error:", error);
                console.error("Error details:", JSON.stringify(error, null, 2));
                return NextResponse.json({ 
                    ok: false, 
                    error: `AI generation failed: ${error.message || JSON.stringify(error)}` 
                }, { status: 500 });
            }

            aiContent = output || "";

            if (typeof aiContent === 'object' && aiContent.content) {
                aiContent = aiContent.content;
            }

            console.log("✅ AI Content extracted, length:", aiContent.length);
            console.log("📝 First 200 chars:", aiContent.substring(0, 200));
        } catch (aiError) {
            console.error("❌ Bytez AI call failed:", aiError);
            console.error("Error stack:", aiError.stack);
            return NextResponse.json({ 
                ok: false, 
                error: `AI call failed: ${aiError.message}` 
            }, { status: 500 });
        }

        let questions;
        try {
            let jsonString = aiContent.trim();

            if (jsonString.includes("```json")) {
                const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
                if (match) {
                    jsonString = match[1].trim();
                }
            } else if (jsonString.includes("```")) {
                const match = jsonString.match(/```\s*([\s\S]*?)\s*```/);
                if (match) {
                    jsonString = match[1].trim();
                }
            }

            const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                questions = JSON.parse(arrayMatch[0]);
            } else {
                questions = JSON.parse(jsonString);
            }

            console.log("Successfully parsed questions:", questions.length);
        } catch (parseError) {
            console.error("Failed to parse AI response:", aiContent);
            console.error("Parse error:", parseError.message);
            return NextResponse.json({ ok: false, error: "Failed to parse quiz questions from AI" }, { status: 500 });
        }

        if (!Array.isArray(questions) || questions.length !== questionCount) {
            return NextResponse.json({ ok: false, error: "AI generated invalid quiz format" }, { status: 500 });
        }

        const pdfFileName = pdfFile.name;
        const title = pdfFileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');

        const client = await clientPromise;
        const db = client.db();
        const quizzes = db.collection("quizzes");

        const newQuiz = {
            userId: new ObjectId(session.user.id),
            pdfFileName: pdfFileName,
            title: title,
            questionCount: questionCount,
            questions: questions,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log("📝 Saving quiz to database:", title);
        const result = await quizzes.insertOne(newQuiz);
        console.log("✅ Quiz saved with ID:", result.insertedId.toString());

        return NextResponse.json({
            ok: true,
            quizId: result.insertedId,
            message: "Quiz generated successfully"
        });
    } catch (error) {
        console.error("Failed to create quiz:", error);
        return NextResponse.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
    }
}
