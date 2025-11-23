"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Clock, FileText } from "@/components/icons";

export default function QuizTakingPage({ params }) {
    const router = useRouter();
    const navigationLinks = getStudentLinks();
    // Next.js 15: params is a Promise in client components, use React.use() to unwrap
    const { quizId } = use(params);

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime] = useState(Date.now());
    const [previousResults, setPreviousResults] = useState([]);
    const [showPreviousResults, setShowPreviousResults] = useState(false);

    useEffect(() => {
        loadQuiz();
        loadPreviousResults();
    }, [quizId]);

    async function loadQuiz() {
        setLoading(true);
        try {
            const res = await fetch(`/api/student/quizzes/${quizId}`);
            const data = await res.json();
            if (data.ok) {
                setQuiz(data.quiz);
                setSelectedAnswers(new Array(data.quiz.questions.length).fill(null));
            } else {
                router.push("/student/quizzes");
            }
        } catch (err) {
            console.error("Failed to load quiz:", err);
            router.push("/student/quizzes");
        } finally {
            setLoading(false);
        }
    }

    async function loadPreviousResults() {
        try {
            const res = await fetch(`/api/student/quizzes/${quizId}/results`);
            const data = await res.json();
            if (data.ok) {
                setPreviousResults(data.results || []);
            }
        } catch (err) {
            console.error("Failed to load previous results:", err);
        }
    }

    function handleAnswerSelect(answerIndex) {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestion] = answerIndex;
        setSelectedAnswers(newAnswers);
    }

    function handleNext() {
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    }

    function handlePrevious() {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    }

    async function handleSubmit() {
        // Check if all questions are answered
        const unanswered = selectedAnswers.filter(a => a === null).length;
        if (unanswered > 0) {
            if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            const res = await fetch(`/api/student/quizzes/${quizId}/results`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: selectedAnswers,
                    timeSpent: timeSpent
                })
            });

            const data = await res.json();
            if (data.ok) {
                setResult(data);
                setShowResults(true);
                await loadPreviousResults();
            } else {
                alert(data.error || "Failed to submit quiz");
            }
        } catch (err) {
            console.error("Failed to submit quiz:", err);
            alert("Failed to submit quiz");
        } finally {
            setSubmitting(false);
        }
    }

    function handleRetake() {
        setCurrentQuestion(0);
        setSelectedAnswers(new Array(quiz.questions.length).fill(null));
        setShowResults(false);
        setResult(null);
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pr-4 pl-4 lg:pr-6 lg:pl-[300px] py-4 lg:py-8">
                <DashboardSidebar
                    heading="LibraAI"
                    links={navigationLinks}
                    variant="light"
                    SignOutComponent={SignOutButton}
                />
                <div className="flex items-center justify-center min-h-[60vh] pt-16 lg:pt-0">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-600">Loading quiz...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return null;
    }

    const currentQ = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const answeredCount = selectedAnswers.filter(a => a !== null).length;

    return (
        <div className="min-h-screen bg-gray-50 pr-4 pl-4 lg:pr-6 lg:pl-[300px] py-4 lg:py-8">
            <DashboardSidebar
                heading="LibraAI"
                links={navigationLinks}
                variant="light"
                SignOutComponent={SignOutButton}
            />

            <main className="space-y-6 max-w-4xl mx-auto pt-16 lg:pt-0">
                {!showResults ? (
                    <>
                        {/* Header */}
                        <header className="space-y-2">
                            <button
                                onClick={() => router.push("/student/quizzes")}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Quizzes
                            </button>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{quiz.title}</h1>
                            <p className="text-sm text-gray-600">
                                Question {currentQuestion + 1} of {quiz.questions.length} • {answeredCount}/{quiz.questions.length} answered
                            </p>
                        </header>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Question Card */}
                        <section className="rounded-lg bg-white border border-gray-200 p-6 lg:p-8 shadow-sm">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">
                                        QUESTION {currentQuestion + 1}
                                    </p>
                                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                                        {currentQ.question}
                                    </h2>
                                </div>

                                <div className="space-y-3">
                                    {currentQ.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerSelect(index)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selectedAnswers[currentQuestion] === index
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${selectedAnswers[currentQuestion] === index
                                                        ? "border-blue-500 bg-blue-500"
                                                        : "border-gray-300"
                                                        }`}
                                                >
                                                    {selectedAnswers[currentQuestion] === index && (
                                                        <CheckCircle className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                                <span className="text-sm lg:text-base text-gray-900">{option}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Navigation */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Previous
                            </button>

                            <div className="flex gap-2">
                                {currentQuestion === quiz.questions.length - 1 ? (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-5 w-5" />
                                                Submit Quiz
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNext}
                                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2"
                                    >
                                        Next
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Question Navigator */}
                        <section className="rounded-lg bg-white border border-gray-200 p-4 lg:p-6 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Navigation</h3>
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                {quiz.questions.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentQuestion(index)}
                                        className={`aspect-square rounded-lg text-sm font-medium transition-colors ${index === currentQuestion
                                            ? "bg-blue-600 text-white"
                                            : selectedAnswers[index] !== null
                                                ? "bg-green-100 text-green-700 border border-green-300"
                                                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </>
                ) : (
                    <>
                        {/* Results View */}
                        <header className="space-y-2">
                            <button
                                onClick={() => router.push("/student/quizzes")}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Quizzes
                            </button>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Quiz Results</h1>
                        </header>

                        {/* Score Card */}
                        <section className="rounded-lg bg-white border border-gray-200 p-6 lg:p-8 shadow-sm">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-2">
                                    <CheckCircle className="h-10 w-10 text-blue-600" />
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                                    {result.percentage}%
                                </h2>
                                <p className="text-lg text-gray-600">
                                    You scored {result.score} out of {result.totalQuestions}
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                                    <button
                                        onClick={handleRetake}
                                        className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
                                    >
                                        Retake Quiz
                                    </button>
                                    <button
                                        onClick={() => setShowPreviousResults(!showPreviousResults)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        {showPreviousResults ? "Hide" : "View"} Previous Attempts
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Answer Review */}
                        <section className="rounded-lg bg-white border border-gray-200 p-6 lg:p-8 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Review</h3>
                            <div className="space-y-6">
                                {quiz.questions.map((question, qIndex) => {
                                    const userAnswer = selectedAnswers[qIndex];
                                    const correctAnswer = question.correctAnswer;
                                    const isCorrect = userAnswer === correctAnswer;

                                    return (
                                        <div
                                            key={qIndex}
                                            className={`p-4 rounded-lg border-2 ${isCorrect
                                                ? "border-green-200 bg-green-50"
                                                : "border-red-200 bg-red-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <span
                                                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${isCorrect ? "bg-green-600" : "bg-red-600"
                                                        }`}
                                                >
                                                    {qIndex + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                                                    <div className="space-y-2">
                                                        {question.options.map((option, oIndex) => {
                                                            const isUserAnswer = userAnswer === oIndex;
                                                            const isCorrectAnswer = correctAnswer === oIndex;

                                                            return (
                                                                <div
                                                                    key={oIndex}
                                                                    className={`p-2 rounded text-sm ${isCorrectAnswer
                                                                        ? "bg-green-100 font-medium text-green-900"
                                                                        : isUserAnswer
                                                                            ? "bg-red-100 text-red-900"
                                                                            : "text-gray-700"
                                                                        }`}
                                                                >
                                                                    {option}
                                                                    {isCorrectAnswer && (
                                                                        <span className="ml-2 text-green-700">✓ Correct</span>
                                                                    )}
                                                                    {isUserAnswer && !isCorrectAnswer && (
                                                                        <span className="ml-2 text-red-700">✗ Your answer</span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Previous Results */}
                        {showPreviousResults && previousResults.length > 0 && (
                            <section className="rounded-lg bg-white border border-gray-200 p-6 lg:p-8 shadow-sm">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Previous Attempts ({previousResults.length})
                                </h3>
                                <div className="space-y-3">
                                    {previousResults.map((prevResult, index) => (
                                        <div
                                            key={prevResult._id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-3"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-gray-900">
                                                    {prevResult.percentage}%
                                                </span>
                                                <div className="text-sm">
                                                    <p className="text-gray-900 font-medium">
                                                        {prevResult.score}/{prevResult.totalQuestions} correct
                                                    </p>
                                                    <p className="text-gray-500 text-xs">
                                                        {formatDate(prevResult.completedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {prevResult.timeSpent > 0 && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="h-4 w-4" />
                                                    {formatTime(prevResult.timeSpent)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
