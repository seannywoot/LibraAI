"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { ArrowLeft, BookOpen, Trash2 } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";

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

  const navigationLinks = getStudentLinks();

  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      setBookId(resolvedParams.bookId);
    });
  }, [params]);

  useEffect(() => {
    if (!bookId) return;
    loadBook();
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
        <Link
          href="/student/library?tab=personal"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Library
        </Link>

        <div className="rounded-lg bg-white border border-gray-200 p-8 shadow-sm">
          <div className="flex flex-col gap-8 md:flex-row">
            <div className="w-full max-w-xs aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
              {coverLabel}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-gray-200">
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
              </div>

              {book.description && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {book.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {book.fileType === "application/pdf" && book.fileUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(book.fileUrl, "_blank", "noopener,noreferrer")}
                    className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                  >
                    <BookOpen className="h-4 w-4" />
                    Open PDF
                  </button>
                ) : null}
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
      </main>
    </div>
  );
}
