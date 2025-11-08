"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, ArrowLeft, Bookmark } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import BorrowConfirmButton from "@/components/borrow-confirm-button";

function StatusChip({ status }) {
  const map = {
    available: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
    "checked-out": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
    reserved: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
    maintenance: { bg: "bg-zinc-200", text: "text-zinc-800", dot: "bg-zinc-500" },
    lost: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  };
  const c = map[status] || map.available;
  const label = (status || "available").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
      {label}
    </span>
  );
}

export default function StudentAuthorBooksPage() {
  const params = useParams();
  const router = useRouter();
  const authorId = params?.authorId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [author, setAuthor] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [borrowing, setBorrowing] = useState(null);
  const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
  const [bookmarking, setBookmarking] = useState(null);

  const navigationLinks = getStudentLinks();

  useEffect(() => {
    if (authorId) loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId, page, pageSize]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/student/authors/${authorId}/books?page=${page}&pageSize=${pageSize}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load books");
      setAuthor(data.author);
      setItems(data.items || []);
      setTotal(data.total || 0);
      
      // Load bookmark status for books
      if (data.items && data.items.length > 0) {
        loadBookmarkStatus(data.items.map(b => b._id));
      }
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookmarkStatus(bookIds) {
    if (!bookIds || bookIds.length === 0) return;
    
    try {
      const bookmarkChecks = await Promise.all(
        bookIds.map(async (bookId) => {
          const res = await fetch(`/api/student/books/bookmark?bookId=${bookId}`, {
            cache: "no-store",
          });
          const data = await res.json().catch(() => ({}));
          return { bookId, bookmarked: data?.bookmarked || false };
        })
      );
      
      const newBookmarked = new Set();
      bookmarkChecks.forEach(({ bookId, bookmarked }) => {
        if (bookmarked) newBookmarked.add(bookId);
      });
      setBookmarkedBooks(newBookmarked);
    } catch (e) {
      console.error("Failed to load bookmark status:", e);
    }
  }

  async function handleBorrow(bookId) {
    setBorrowing(bookId);
    try {
      const res = await fetch("/api/student/books/borrow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to borrow book");
      
      showToast("Borrow request submitted for approval", "success");
      loadBooks();
    } catch (e) {
      showToast(e?.message || "Failed to borrow book", "error");
    } finally {
      setBorrowing(null);
    }
  }

  async function handleToggleBookmark(bookId, e) {
    e.preventDefault();
    e.stopPropagation();
    
    setBookmarking(bookId);
    try {
      const res = await fetch("/api/student/books/bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to toggle bookmark");

      const newBookmarked = new Set(bookmarkedBooks);
      if (data.bookmarked) {
        newBookmarked.add(bookId);
      } else {
        newBookmarked.delete(bookId);
      }
      setBookmarkedBooks(newBookmarked);
      
      showToast(data.message, "success");
    } catch (e) {
      showToast(e?.message || "Failed to toggle bookmark", "error");
    } finally {
      setBookmarking(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <ToastContainer />
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Authors
            </button>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {author ? author.name : "Loading..."}
            </h1>
            {author?.bio && (
              <p className="text-sm text-zinc-600 max-w-3xl leading-relaxed">{author.bio}</p>
            )}
            {author && (
              <p className="text-sm font-medium text-zinc-700 pt-2">
                {total} {total === 1 ? 'book' : 'books'} in our collection
              </p>
            )}
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading books…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <BookIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No books by this author</h2>
            <p className="text-sm text-zinc-600">No books found in the catalog for this author.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((book) => {
                const isBorrowingThis = borrowing === book._id;
                const lockedByOther = Boolean(borrowing) && !isBorrowingThis;
                const isBookmarked = bookmarkedBooks.has(book._id);
                const isBookmarkingThis = bookmarking === book._id;
                return (
                  <article key={book._id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
                    <Link href={`/student/books/${book._id}`} className="block space-y-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900 line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-zinc-600">{book.author}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        {book.year && <span>{book.year}</span>}
                        {book.year && book.publisher && <span>•</span>}
                        {book.publisher && <span>{book.publisher}</span>}
                      </div>
                      {book.shelf && (
                        <p className="text-xs text-zinc-500">📍 Shelf {book.shelf}</p>
                      )}
                    </Link>
                    <div className="flex items-center justify-between gap-2">
                      <StatusChip status={book.status} />
                      <div className="flex items-center gap-2">
                        {book.status === "available" && !["reference-only", "staff-only"].includes(book.loanPolicy || "") ? (
                          <BorrowConfirmButton
                            onConfirm={() => handleBorrow(book._id)}
                            disabled={lockedByOther}
                            busy={isBorrowingThis}
                            className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                            borrowLabel="Borrow"
                            confirmingLabel="Confirm?"
                            confirmingTitle="Submit Borrow Request"
                            confirmingMessage="This sends a borrow request to the librarian for approval."
                            confirmButtonLabel="Submit Request"
                            busyLabel="Borrowing..."
                          />
                        ) : book.status === "reserved" && book.reservedForCurrentUser ? (
                          <span className="text-xs font-medium text-zinc-500">Awaiting approval</span>
                        ) : book.status === "reserved" ? (
                          <span className="text-xs text-zinc-500">Reserved</span>
                        ) : book.status === "checked-out" ? (
                          <span className="text-xs text-zinc-500">Checked out</span>
                        ) : book.loanPolicy === "reference-only" ? (
                          <span className="text-xs text-zinc-500">Reference only</span>
                        ) : book.loanPolicy === "staff-only" ? (
                          <span className="text-xs text-zinc-500">Staff only</span>
                        ) : null}
                        
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleToggleBookmark(book._id, e)}
                          disabled={isBookmarkingThis}
                          className={`p-1.5 rounded-full transition-colors ${
                            isBookmarked
                              ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                              : "bg-white text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          } disabled:opacity-50`}
                          title={isBookmarked ? "Remove bookmark" : "Bookmark this book"}
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-zinc-500">Page {page} of {totalPages} · {total} total</p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
