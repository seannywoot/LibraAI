"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Upload, FileText, Loader2, CheckCircle, Trash2 } from "@/components/icons";
import Link from "next/link";
import { showToast } from "@/components/ToastContainer";
import ToastContainer from "@/components/ToastContainer";

export default function QuizzesPage() {
    const router = useRouter();
    const navigationLinks = getStudentLinks();

    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [questionCount, setQuestionCount] = useState(10);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [generationStage, setGenerationStage] = useState(0);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const [quizToDelete, setQuizToDelete] = useState(null);



    useEffect(() => {
        loadQuizzes();
    }, []);

    async function loadQuizzes() {
        setLoading(true);
        try {
            const res = await fetch("/api/student/quizzes");
            const data = await res.json();
            if (data.ok) {
                setQuizzes(data.quizzes || []);
            }
        } catch (err) {
            console.error("Failed to load quizzes:", err);
        } finally {
            setLoading(false);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setError("Please select a PDF file");
            setSelectedFile(null);
            return;
        }

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError("PDF file must be less than 10MB");
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
        setError("");
        setSuccess("");
    }

    async function handleUpload(e) {
        e.preventDefault();

        if (!selectedFile) {
            setError("Please select a PDF file");
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");
        setShowProgressModal(true);
        setGenerationStage(1);

        // Prepare FormData outside try so it's available in catch
        const formData = new FormData();
        formData.append("pdf", selectedFile);
        formData.append("questionCount", questionCount.toString());

        try {

            setTimeout(() => setGenerationStage(2), 2000);

            const res = await fetch("/api/student/quizzes", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            // Handle duplicate PDF error without throwing to avoid re-posting
            if (data && data.error === "duplicate_pdf" && data.existingQuiz) {
                setShowProgressModal(false);
                setGenerationStage(0);
                setError("There is already an existing quiz for this file");
                return;
            }

            if (!res.ok || !data.ok) {
                throw new Error(data.error || "Failed to generate quiz");
            }

            setGenerationStage(3);
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuccess("Quiz generated successfully!");
            setSelectedFile(null);

            const fileInput = document.getElementById("pdf-upload");
            if (fileInput) fileInput.value = "";

            await loadQuizzes();

            setShowProgressModal(false);
            setGenerationStage(0);
            setTimeout(() => {
                router.push(`/student/quizzes/${data.quizId}`);
            }, 500);
        } catch (err) {
            // Show error
            setError(err.message || "Failed to generate quiz");
            setShowProgressModal(false);
            setGenerationStage(0);
        } finally {
            setUploading(false);
        }
    }



    function openDeleteModal(quiz, e) {
        e.preventDefault();
        e.stopPropagation();
        setQuizToDelete(quiz);
        setDeleteModalOpen(true);
    }

    function cancelDelete() {
        setDeleteModalOpen(false);
        setQuizToDelete(null);
    }

    async function confirmDelete() {
        if (quizToDelete) {
            try {
                const res = await fetch(`/api/student/quizzes/${quizToDelete._id}`, {
                    method: "DELETE",
                });
                if (res.ok) {
                    setQuizzes(quizzes.filter((q) => q._id !== quizToDelete._id));
                    showToast("Quiz deleted successfully", "success", 3000);
                } else {
                    showToast("Failed to delete quiz", "error", 3000);
                }
            } catch (e) {
                console.error("Failed to delete quiz:", e);
                showToast("Failed to delete quiz", "error", 3000);
            }
        }
        setDeleteModalOpen(false);
        setQuizToDelete(null);
    }

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 pt-16 pb-8 lg:p-8 min-[1440px]:pl-[300px] min-[1440px]:pt-4">
            <DashboardSidebar
                heading="LibraAI"
                links={navigationLinks}
                variant="light"
                SignOutComponent={SignOutButton}
            />

            <main className="space-y-6">
                <header className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        QUIZ GENERATION
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">My Quizzes</h1>
                    <p className="text-sm text-gray-600">
                        Upload PDFs to generate AI-powered quizzes and test your knowledge
                    </p>
                </header>

                <section className="rounded-lg bg-white border border-gray-200 p-4 lg:p-6 shadow-sm">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                        Generate New Quiz
                    </h2>

                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
                                Upload PDF Document
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <label
                                    htmlFor="pdf-upload"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors bg-gray-50 hover:bg-gray-100"
                                >
                                    <Upload className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {selectedFile ? selectedFile.name : "Choose PDF file"}
                                    </span>
                                    <input
                                        id="pdf-upload"
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>
                                {selectedFile && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            const fileInput = document.getElementById("pdf-upload");
                                            if (fileInput) fileInput.value = "";
                                        }}
                                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                                        disabled={uploading}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum file size: 10MB
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Questions
                            </label>
                            <div className="flex gap-3">
                                {[5, 10, 15].map((count) => (
                                    <button
                                        key={count}
                                        type="button"
                                        onClick={() => setQuestionCount(count)}
                                        disabled={uploading}
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${questionCount === count
                                            ? "!border-[var(--btn-primary)] bg-orange-50 !text-[var(--btn-primary)]"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                                            }`}
                                    >
                                        {count} Questions
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-700">{success}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedFile || uploading}
                            className="w-full px-6 py-3 bg-[var(--btn-primary)] text-white rounded-lg font-medium hover:bg-[var(--btn-primary-hover)] disabled:bg-orange-100 disabled:text-[#C86F26] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin text-[#C86F26]" />
                                    Generating Quiz...
                                </>
                            ) : (
                                <>
                                    <FileText className="h-5 w-5" />
                                    Generate Quiz
                                </>
                            )}
                        </button>
                    </form>
                </section>

                <section className="rounded-lg bg-white border border-gray-200 p-4 lg:p-6 shadow-sm">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
                        Your Quizzes ({quizzes.length})
                    </h2>

                    {loading ? (
                        <div className="text-center py-8 text-gray-600">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#C86F26]" />
                            <p>Loading quizzes...</p>
                        </div>
                    ) : quizzes.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600">
                                No quizzes yet. Upload a PDF to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {quizzes.map((quiz) => (
                                <Link
                                    key={quiz._id}
                                    href={`/student/quizzes/${quiz._id}`}
                                    className="group block rounded-lg border border-gray-200 p-4 hover:shadow-[0_8px_20px_rgba(200,111,38,0.3)] hover:border-gray-300 transition-all"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="rounded-lg bg-orange-100 p-2">
                                            <FileText className="h-5 w-5 text-[var(--btn-primary)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                                                {quiz.title}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {quiz.questionCount} questions
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => openDeleteModal(quiz, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-opacity"
                                            title="Delete quiz"
                                        >
                                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                        </button>
                                    </div>

                                    <div className="space-y-1 text-xs text-gray-600">
                                        <p>Created: {formatDate(quiz.createdAt)}</p>
                                        <p className={quiz.attemptCount === 0 ? "text-gray-400 italic" : ""}>
                                            {quiz.attemptCount > 0 ? `Attempts: ${quiz.attemptCount}` : "No attempts yet"}
                                        </p>
                                        {quiz.attemptCount > 0 && quiz.latestPercentage !== null ? (
                                            <p className="font-medium text-gray-900">
                                                Latest Score: {quiz.latestScore}/{quiz.questionCount} ({quiz.latestPercentage}%)
                                            </p>
                                        ) : (
                                            <p className="text-gray-400 italic">No score yet</p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Progress Modal */}
                {showProgressModal && (
                    <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 lg:p-8 max-w-md w-full shadow-2xl">
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <Loader2 className="h-16 w-16 text-[var(--btn-primary)] animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-8 w-8 bg-orange-100 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                                        {generationStage === 1 && "Extracting PDF Content"}
                                        {generationStage === 2 && "AI is Generating Your Quiz"}
                                        {generationStage === 3 && "Almost Done!"}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {generationStage === 1 && "Reading your document..."}
                                        {generationStage === 2 && "Creating intelligent questions..."}
                                        {generationStage === 3 && "Finalizing your quiz..."}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-[var(--btn-primary)] h-2 rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: generationStage === 1 ? '33%' : generationStage === 2 ? '66%' : '100%'
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Step {generationStage} of 3
                                    </p>
                                </div>

                                <div className="flex justify-between items-center text-xs">
                                    <div className={`flex flex-col items-center gap-1 ${generationStage >= 1 ? 'text-[var(--btn-primary)]' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${generationStage >= 1 ? 'border-[var(--btn-primary)] bg-orange-50' : 'border-gray-300'}`}>
                                            {generationStage > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                                        </div>
                                        <span className="font-medium">Extract</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 mx-2 ${generationStage >= 2 ? 'bg-[var(--btn-primary)]' : 'bg-gray-300'}`}></div>
                                    <div className={`flex flex-col items-center gap-1 ${generationStage >= 2 ? 'text-[var(--btn-primary)]' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${generationStage >= 2 ? 'border-[var(--btn-primary)] bg-orange-50' : 'border-gray-300'}`}>
                                            {generationStage > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
                                        </div>
                                        <span className="font-medium">Generate</span>
                                    </div>
                                    <div className={`flex-1 h-0.5 mx-2 ${generationStage >= 3 ? 'bg-[var(--btn-primary)]' : 'bg-gray-300'}`}></div>
                                    <div className={`flex flex-col items-center gap-1 ${generationStage >= 3 ? 'text-[var(--btn-primary)]' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${generationStage >= 3 ? 'border-[var(--btn-primary)] bg-orange-50' : 'border-gray-300'}`}>
                                            {generationStage > 3 ? <CheckCircle className="h-5 w-5" /> : '3'}
                                        </div>
                                        <span className="font-medium">Finalize</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 italic">
                                    This may take a few moments...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Container */}
                <ToastContainer />

                {/* Delete Confirmation Modal */}
                {deleteModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={cancelDelete}
                    >
                        <div
                            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Delete Quiz?
                                </h3>
                                <p className="text-sm text-gray-600 mb-1">
                                    Are you sure you want to delete this quiz?
                                </p>
                                {quizToDelete && (
                                    <p className="text-sm font-medium text-gray-900 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        {quizToDelete.title}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 mt-3">
                                    This will also delete all quiz attempts and results. This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={cancelDelete}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </main>
        </div>
    );
}
