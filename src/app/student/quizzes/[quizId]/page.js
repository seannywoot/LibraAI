"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Clock, FileText, RefreshCw } from "@/components/icons";

// ============= LOCAL STORAGE UTILITIES =============

const QUIZ_STATE_KEY_PREFIX = "quiz_state_";

function getQuizStateKey(quizId) {
    return `${QUIZ_STATE_KEY_PREFIX}${quizId}`;
}

function saveQuizState(quizId, state) {
    try {
        const key = getQuizStateKey(quizId);
        localStorage.setItem(key, JSON.stringify(state));
    } catch (err) {
        console.error("Failed to save quiz state:", err);
    }
}

function loadQuizState(quizId) {
    try {
        const key = getQuizStateKey(quizId);
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch (err) {
        console.error("Failed to load quiz state:", err);
        return null;
    }
}

function clearQuizState(quizId) {
    try {
        const key = getQuizStateKey(quizId);
        localStorage.removeItem(key);
    } catch (err) {
        console.error("Failed to clear quiz state:", err);
    }
}

// Fisher-Yates shuffle algorithm for question randomization
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ============= MAIN COMPONENT =============

export default function QuizTakingPage({ params }) {
    const router = useRouter();
    const navigationLinks = getStudentLinks();
    const { quizId } = use(params);

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());
    const [previousResults, setPreviousResults] = useState([]);
    const [showPreviousResults, setShowPreviousResults] = useState(false);
    const [reviewCurrentQuestion, setReviewCurrentQuestion] = useState(0);

    // New state for randomization and resume modal
    const [questionOrder, setQuestionOrder] = useState([]);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [savedState, setSavedState] = useState(null);

    useEffect(() => {
        loadQuiz();
        loadPreviousResults();
    }, [loadPreviousResults, loadQuiz, quizId]);

    // Check for saved state after quiz loads
    useEffect(() => {
        if (quiz && !showResults) {
            const saved = loadQuizState(quizId);
            if (saved && saved.quizId === quizId) {
                setSavedState(saved);
                setShowResumeModal(true);
            } else {
                // No saved state, start fresh with randomized questions
                initializeNewAttempt();
            }
        }
    }, [initializeNewAttempt, quiz, quizId, showResults]);

    // Save state whenever answers or current question changes
    useEffect(() => {
        if (quiz && questionOrder.length > 0 && !showResults) {
            const state = {
                quizId,
                currentQuestion,
                selectedAnswers,
                startTime,
                questionOrder,
                savedAt: Date.now()
            };
            saveQuizState(quizId, state);
        }
    }, [currentQuestion, selectedAnswers, quizId, questionOrder, startTime, quiz, showResults]);

    function initializeNewAttempt() {
        if (!quiz) return;

        // Generate random question order
        const indices = Array.from({ length: quiz.questions.length }, (_, i) => i);
        const shuffled = shuffleArray(indices);
        setQuestionOrder(shuffled);
        setCurrentQuestion(0);
        setSelectedAnswers(new Array(quiz.questions.length).fill(null));
        setStartTime(Date.now());
    }

    function handleResumeQuiz() {
        if (savedState) {
            setCurrentQuestion(savedState.currentQuestion);
            setSelectedAnswers(savedState.selectedAnswers);
            setStartTime(savedState.startTime);
            setQuestionOrder(savedState.questionOrder);
            setShowResumeModal(false);
        }
    }

    function handleStartFresh() {
        clearQuizState(quizId);
        setShowResumeModal(false);
        initializeNewAttempt();
    }

    async function loadQuiz() {
        setLoading(true);
        try {
            const res = await fetch(`/api/student/quizzes/${quizId}`);
            const data = await res.json();
            if (data.ok) {
                setQuiz(data.quiz);
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
        const unanswered = selectedAnswers.filter(a => a === null).length;
        if (unanswered > 0) {
            if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
                return;
            }
        }

        setSubmitting(true);
        try {
            const timeSpent = Math.floor((Date.now() - startTime) / 1000);

            // Remap answers back to original question order
            const originalOrderAnswers = new Array(quiz.questions.length).fill(null);
            questionOrder.forEach((originalIndex, shuffledIndex) => {
                originalOrderAnswers[originalIndex] = selectedAnswers[shuffledIndex];
            });

            const res = await fetch(`/api/student/quizzes/${quizId}/results`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    answers: originalOrderAnswers,
                    timeSpent: timeSpent
                })
            });

            const data = await res.json();
            if (data.ok) {
                setResult(data);
                setShowResults(true);
                clearQuizState(quizId); // Clear saved state after successful submission
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
        clearQuizState(quizId);
        setShowResults(false);
        setResult(null);
        setReviewCurrentQuestion(0);
        initializeNewAttempt();
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
            <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
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

    // Get the current question using the randomized order
    const currentQuestionIndex = questionOrder.length > 0 ? questionOrder[currentQuestion] : currentQuestion;
    const currentQ = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const answeredCount = selectedAnswers.filter(a => a !== null).length;

    return (
        <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
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
                                className="bg-[var(--btn-primary)] h-2 rounded-full transition-all duration-300"
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
                                                ? "border-[var(--btn-primary)] bg-orange-50"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${selectedAnswers[currentQuestion] === index
                                                        ? "border-[var(--btn-primary)] bg-[var(--btn-primary)]"
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
                                        className="px-4 py-2 bg-[var(--btn-primary)] text-white rounded-lg hover:bg-[var(--btn-primary-hover)] flex items-center gap-2"
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
                                            ? "bg-[var(--btn-primary)] text-white"
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
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-2">
                                    <CheckCircle className="h-10 w-10 text-[var(--btn-primary)]" />
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
                                        className="px-6 py-2 bg-[var(--btn-primary)] text-white rounded-lg font-medium hover:bg-[var(--btn-primary-hover)]"
                                    >
                                        Retake Quiz
                                    </button>
                                    <button
                                        onClick={() => setShowPreviousResults(true)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        View Previous Attempts
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Answer Review */}
                        <section className="rounded-lg bg-white border border-gray-200 p-6 lg:p-8 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Answer Review</h3>
                                <span className="text-sm text-gray-500">
                                    Question {reviewCurrentQuestion + 1} of {quiz.questions.length}
                                </span>
                            </div>

                            {/* Question Display */}
                            {(() => {
                                const question = quiz.questions[reviewCurrentQuestion];
                                const userAnswer = selectedAnswers[reviewCurrentQuestion];
                                const correctAnswer = question.correctAnswer;
                                const isCorrect = userAnswer === correctAnswer;

                                return (
                                    <div className={`p-4 rounded-lg border-2 ${isCorrect
                                        ? "border-green-200 bg-green-50"
                                        : "border-red-200 bg-red-50"
                                        }`}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <span
                                                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium ${isCorrect ? "bg-green-600" : "bg-red-600"
                                                    }`}
                                            >
                                                {reviewCurrentQuestion + 1}
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
                            })()}

                            {/* Review Navigation */}
                            <div className="flex items-center justify-between mt-6 gap-3">
                                <button
                                    onClick={() => setReviewCurrentQuestion(prev => Math.max(0, prev - 1))}
                                    disabled={reviewCurrentQuestion === 0}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Previous
                                </button>
                                <button
                                    onClick={() => setReviewCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                                    disabled={reviewCurrentQuestion === quiz.questions.length - 1}
                                    className="px-4 py-2 bg-[var(--btn-primary)] text-white rounded-lg hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Next
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Quick Navigation Grid */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Jump to Question</h4>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                    {quiz.questions.map((q, index) => {
                                        const isCorrect = selectedAnswers[index] === q.correctAnswer;
                                        return (
                                            <button
                                                key={index}
                                                onClick={() => setReviewCurrentQuestion(index)}
                                                className={`aspect-square rounded-lg text-sm font-medium transition-colors ${index === reviewCurrentQuestion
                                                    ? "ring-2 ring-offset-2 ring-blue-500"
                                                    : ""
                                                    } ${isCorrect
                                                        ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                                                        : "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                                                    }`}
                                            >
                                                {index + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>

                        {/* Previous Results Modal */}
                        {showPreviousResults && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowPreviousResults(false)}>
                                <div
                                    className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            Previous Attempts ({previousResults.length})
                                        </h3>
                                        <button
                                            onClick={() => setShowPreviousResults(false)}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto p-6 space-y-3">
                                        {previousResults.length > 0 ? (
                                            previousResults.map((prevResult) => (
                                                <div
                                                    key={prevResult._id}
                                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 gap-3 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${prevResult.percentage >= 80 ? 'bg-green-100 text-green-700' :
                                                            prevResult.percentage >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {prevResult.percentage}%
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-900 font-medium">
                                                                {prevResult.score}/{prevResult.totalQuestions} correct
                                                            </p>
                                                            <p className="text-gray-500 text-xs">
                                                                {formatDate(prevResult.completedAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {prevResult.timeSpent > 0 && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                                                            <Clock className="h-4 w-4" />
                                                            {formatTime(prevResult.timeSpent)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                No previous attempts found.
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                                        <button
                                            onClick={() => setShowPreviousResults(false)}
                                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Resume Quiz Modal */}
                {showResumeModal && savedState && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-2">
                                    <RefreshCw className="h-8 w-8 text-[var(--btn-primary)]" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    Resume Previous Attempt?
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p>
                                        You have an incomplete quiz attempt from{" "}
                                        <span className="font-medium text-gray-900">
                                            {new Date(savedState.savedAt).toLocaleString()}
                                        </span>
                                    </p>
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                        <p className="font-medium text-gray-900">
                                            Progress: {savedState.selectedAnswers.filter(a => a !== null).length} of {quiz.questions.length} questions answered
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Current question: {savedState.currentQuestion + 1}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={handleResumeQuiz}
                                        className="w-full px-6 py-3 bg-[var(--btn-primary)] text-white rounded-lg font-medium hover:bg-[var(--btn-primary-hover)] transition-colors"
                                    >
                                        Resume Quiz
                                    </button>
                                    <button
                                        onClick={handleStartFresh}
                                        className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Start Fresh
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 italic">
                                    Starting fresh will discard your previous progress
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
