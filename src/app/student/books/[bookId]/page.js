"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ArrowLeft, BookOpen } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import RecommendationCard from "@/components/recommendation-card";

function StatusChip({ status }) {
  const map = {
    available: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
    },
    "checked-out": {
      bg: "bg-amber-100",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    reserved: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
    maintenance: {
      bg: "bg-zinc-200",
      text: "text-zinc-800",
      dot: "bg-zinc-500",
    },
    lost: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  };
  const c = map[status] || map.available;
  const label = (status || "available")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
      {label}
    </span>
  );
}

export default function BookDetailPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [book, setBook] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [borrowing, setBorrowing] = useState(false);
  const [bookId, setBookId] = useState(null);

  const navigationLinks = getStudentLinks();

  // Unwrap params Promise
  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      setBookId(resolvedParams.bookId);
    });
  }, [params]);

  useEffect(() => {
    if (bookId) {
      loadBookDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  useEffect(() => {
    if (book) {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  async function loadBookDetails() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/student/books/${bookId}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to load book details");
      setBook(data.book);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations() {
    setLoadingRecommendations(true);
    try {
      const params = new URLSearchParams({
        bookId: book._id,
        limit: "8",
      });
      const res = await fetch(`/api/student/books/recommendations?${params}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setRecommendations(data.recommendations || []);
      }
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  async function handleBorrow() {
    setBorrowing(true);
    try {
      const res = await fetch("/api/student/books/borrow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId: book._id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to borrow book");

      showToast("Borrow request submitted for approval", "success");
      loadBookDetails();
    } catch (e) {
      showToast(e?.message || "Failed to borrow book", "error");
    } finally {
      setBorrowing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
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
      <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
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
    <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
      <ToastContainer />
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-6">
        {/* Back Button */}
        <Link
          href="/student/books"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>

        {/* Book Details */}
        <div className="rounded-lg bg-white border border-gray-200 p-8 shadow-sm">
          <div className="flex gap-8">
            {/* Book Cover */}
            <div className="w-64 h-96 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
              Book Cover
            </div>

            {/* Book Information */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {book.title}
                </h1>
                <p className="text-lg text-gray-600 mb-4">by {book.author}</p>
                <StatusChip status={book.status} />
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-200">
                {book.isbn && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">ISBN</p>
                    <p className="text-sm text-gray-600">{book.isbn}</p>
                  </div>
                )}
                {book.publisher && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Publisher
                    </p>
                    <p className="text-sm text-gray-600">{book.publisher}</p>
                  </div>
                )}
                {book.year && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Publication Year
                    </p>
                    <p className="text-sm text-gray-600">{book.year}</p>
                  </div>
                )}
                {book.format && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Format
                    </p>
                    <p className="text-sm text-gray-600">{book.format}</p>
                  </div>
                )}
                {book.category && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Category
                    </p>
                    <p className="text-sm text-gray-600">{book.category}</p>
                  </div>
                )}
                {book.language && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Language
                    </p>
                    <p className="text-sm text-gray-600">{book.language}</p>
                  </div>
                )}
                {book.pages && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Pages</p>
                    <p className="text-sm text-gray-600">{book.pages}</p>
                  </div>
                )}
                {book.edition && (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Edition
                    </p>
                    <p className="text-sm text-gray-600">{book.edition}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                {book.format === "eBook" && book.ebookUrl ? (
                  <a
                    href={book.ebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Access eBook
                  </a>
                ) : book.status === "available" &&
                  !["reference-only", "staff-only"].includes(
                    book.loanPolicy || ""
                  ) ? (
                  <button
                    onClick={handleBorrow}
                    disabled={borrowing}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    {borrowing ? "Borrowing..." : "Borrow Book"}
                  </button>
                ) : book.status === "reserved" &&
                  book.reservedForCurrentUser ? (
                  <span className="text-sm font-medium text-gray-500">
                    Awaiting approval
                  </span>
                ) : book.loanPolicy === "reference-only" ? (
                  <span className="text-sm text-gray-500">
                    Reference only - Cannot be borrowed
                  </span>
                ) : book.loanPolicy === "staff-only" ? (
                  <span className="text-sm text-gray-500">
                    Staff only - Cannot be borrowed
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">
                    Currently unavailable
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Books */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended Books
            </h2>
            {loadingRecommendations && (
              <span className="text-sm text-gray-500">Loading...</span>
            )}
          </div>

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec._id}
                  book={rec}
                  onClick={(book) => router.push(`/student/books/${book._id}`)}
                />
              ))}
            </div>
          ) : !loadingRecommendations ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              No recommendations available at this time.
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
