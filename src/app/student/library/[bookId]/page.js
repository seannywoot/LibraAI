"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ArrowLeft, BookOpen, Trash2 } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import RecommendationCard from "@/components/recommendation-card";
import PDFViewer from "@/components/pdf-viewer";
import CategoryBadge from "@/components/category-badge";

function formatDisplayDate(date) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "—";
  }
}

export default function PersonalBookDetailPage({ params }) {
  const router = useRouter();
  const [bookId, setBookId] = useState(null);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isFallbackRecommendations, setIsFallbackRecommendations] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const navigationLinks = getStudentLinks();

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      setBookId(resolvedParams.bookId);
    });
  }, [params]);

  useEffect(() => {
    if (!bookId) return;
    loadBook();
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function loadBook() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/student/library/${bookId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load book");
      }
      setBook(data.book);
    } catch (err) {
      setError(err?.message || "Failed to load book");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations() {
    if (!bookId) return;

    setLoadingRecommendations(true);
    try {
      const res = await fetch(`/api/student/books/recommendations?context=library&bookId=${bookId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setRecommendations(data.recommendations || []);
        setIsFallbackRecommendations(data.isFallback || false);
      } else {
        console.error("Recommendations API error:", data?.error);
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function handleRemove() {
    if (!bookId) return;
    if (!confirm("Remove this book from your library?")) return;

    setRemoving(true);
    try {
      const res = await fetch(`/api/student/library/${bookId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to remove book");
      }
      showToast("Book removed from your library", "success");
      router.push("/student/library?tab=personal");
    } catch (err) {
      showToast(err?.message || "Failed to remove book", "error");
    } finally {
      setRemoving(false);
    }
  }

  const coverLabel = book?.fileType === "application/pdf" ? "PDF" : "Book";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
        <DashboardSidebar
          heading="LibraAI"
          links={navigationLinks}
          variant="light"
          SignOutComponent={SignOutButton}
        />
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
          Loading book details…
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
        <DashboardSidebar
          heading="LibraAI"
          links={navigationLinks}
          variant="light"
          SignOutComponent={SignOutButton}
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Book not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
      <ToastContainer />
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-6">
        <Link
          href="/student/library?tab=personal"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Library
        </Link>

        <div className="rounded-lg bg-white border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 shrink-0 flex justify-center md:block">
              <div className="aspect-2/3 w-48 md:w-full rounded bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium overflow-hidden">
                {book.thumbnail ? (
                  <img
                    src={book.thumbnail}
                    alt={`Cover of ${book.title}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<span class="text-gray-400 text-sm font-medium">No Cover</span>';
                    }}
                  />
                ) : (
                  <span>No Cover</span>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-600">
                  {book.author || "Unknown Author"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
                {book.isbn && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">ISBN</p>
                    <p className="text-sm text-gray-600">{book.isbn}</p>
                  </div>
                )}
                {book.publisher && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Publisher</p>
                    <p className="text-sm text-gray-600">{book.publisher}</p>
                  </div>
                )}
                {book.year && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Publication Year</p>
                    <p className="text-sm text-gray-600">{book.year}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">File Type</p>
                  <p className="text-sm text-gray-600">{book.fileType || "Manual entry"}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Date Added</p>
                  <p className="text-sm text-gray-600">{formatDisplayDate(book.addedAt)}</p>
                </div>
                {book.categories && book.categories.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((category, idx) => (
                        <CategoryBadge key={idx} label={category} variant="category" />
                      ))}
                    </div>
                  </div>
                )}
                {book.tags && book.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {book.tags.map((tag, idx) => (
                        <CategoryBadge key={idx} label={tag} variant="tag" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {book.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {book.fileType === "application/pdf" && book.fileUrl && (
                  <button
                    type="button"
                    onClick={() => setShowPDFModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Open PDF
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {removing ? "Removing..." : "Remove from Library"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Books / Recommendations Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {isFallbackRecommendations
                ? "Popular Books You Might Enjoy"
                : "Similar Books You Might Like"}
            </h2>
            {loadingRecommendations && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>

          {loadingRecommendations ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-2/3 rounded-lg mb-2"></div>
                  <div className="bg-gray-200 h-3 rounded w-3/4 mb-1"></div>
                  <div className="bg-gray-200 h-2 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {recommendations.slice(0, 6).map((rec) => (
                <RecommendationCard
                  key={rec._id}
                  book={rec}
                  onClick={(book) => router.push(`/student/books/${encodeURIComponent(book.slug || book._id)}`)}
                  compact={true}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-600">
                {isFallbackRecommendations
                  ? "We couldn't find books similar to this one, but here are some popular titles from our library."
                  : "No recommendations available at the moment. Check back later!"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* PDF Modal */}
      {showPDFModal && book.fileType === "application/pdf" && book.fileUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-white">{book.title}</h2>
              {book.author && (
                <span className="text-sm text-gray-400">by {book.author}</span>
              )}
            </div>
            <button
              onClick={() => setShowPDFModal(false)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              aria-label="Close PDF viewer"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden">
            <PDFViewer fileUrl={book.fileUrl} />
          </div>
        </div>
      )}
    </div>
  );
}
