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

export default function ShelfBooksPage() {
  const params = useParams();
  const router = useRouter();
  const shelfId = params?.shelfId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shelf, setShelf] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [borrowing, setBorrowing] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
  const [bookmarking, setBookmarking] = useState(null);

  const navigationLinks = getStudentLinks();

  // Debounced search effect
  useEffect(() => {
    if (!shelfId) return;
    
    const timer = setTimeout(() => {
      setPage(1);
      loadBooks();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, shelfId]);

  useEffect(() => {
    if (shelfId) loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfId, page, pageSize]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (searchInput) params.append("search", searchInput);
      const res = await fetch(`/api/student/shelves/${shelfId}/books?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load books");
      setShelf(data.shelf);
      setItems(data.items || []);
      setTotal(data.total || 0);
      
      // Load bookmark status for books in background (non-blocking)
      if (data.items && data.items.length > 0) {
        loadBookmarkStatus(data.items.map(b => b._id));
      }
      
      // Set loading to false immediately after main data loads
      setLoading(false);
    } catch (e) {
      setError(e?.message || "Unknown error");
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

  function handleClearSearch() {
    setSearchInput("");
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
              Back to Shelves
            </button>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {shelf ? `Shelf ${shelf.code}` : "Loading..."}
            </h1>
            {shelf && (
              <div className="space-y-1">
                {shelf.name && <p className="text-sm text-zinc-600">{shelf.name}</p>}
                {shelf.location && <p className="text-xs text-zinc-500">📍 {shelf.location}</p>}
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search books..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 animate-pulse">
                <div className="w-24 h-32 shrink-0 rounded bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="flex items-center gap-3 mt-4">
                    <div className="h-6 bg-gray-200 rounded-full w-24" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <BookIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {searchInput ? "No books found" : "No books on this shelf"}
            </h2>
            <p className="text-sm text-zinc-600">
              {searchInput ? "Try adjusting your search terms." : "This shelf is currently empty."}
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="space-y-4">
              {items.map((book) => {
                const isBorrowingThis = borrowing === book._id;
                const lockedByOther = Boolean(borrowing) && !isBorrowingThis;
                const isBookmarked = bookmarkedBooks.has(book._id);
                const isBookmarkingThis = bookmarking === book._id;
                return (
                  <Link
                    key={book._id}
                    href={`/student/books/${encodeURIComponent(book.slug || book._id)}`}
                    className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Book Cover Placeholder */}
                    <div className="w-24 h-32 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                      Book Cover
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {book.author}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                        {book.year && <span>Published: {book.year}</span>}
                        {book.year && book.publisher && <span>|</span>}
                        {book.publisher && <span>{book.publisher}</span>}
                        {book.format && (
                          <>
                            <span>|</span>
                            <span className="font-medium">{book.format}</span>
                          </>
                        )}
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusChip status={book.status} />
                          {book.isbn && (
                            <span className="text-sm text-gray-500">
                              Call #: {book.isbn}
                            </span>
                          )}
                        </div>

                        <div
                          className="flex items-center gap-3"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          {book.status === "available" && !["reference-only", "staff-only"].includes(book.loanPolicy || "") ? (
                            <BorrowConfirmButton
                              onConfirm={() => handleBorrow(book._id)}
                              disabled={lockedByOther}
                              busy={isBorrowingThis}
                              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                              borrowLabel="Borrow"
                              confirmingLabel="Confirm?"
                              confirmingTitle="Submit Borrow Request"
                              confirmingMessage="This sends a borrow request to the librarian for approval."
                              confirmButtonLabel="Submit Request"
                              busyLabel="Borrowing..."
                            />
                          ) : book.status === "reserved" && book.reservedForCurrentUser ? (
                            <span className="text-sm font-medium text-gray-500">Awaiting approval</span>
                          ) : book.status === "reserved" ? (
                            <button
                              disabled
                              className="rounded-md bg-gray-300 px-6 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
                            >
                              Reserved
                            </button>
                          ) : book.status === "checked-out" ? (
                            <button
                              disabled
                              className="rounded-md bg-gray-300 px-6 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
                            >
                              Unavailable
                            </button>
                          ) : book.loanPolicy === "reference-only" ? (
                            <span className="text-sm text-gray-500">Reference only</span>
                          ) : book.loanPolicy === "staff-only" ? (
                            <span className="text-sm text-gray-500">Staff only</span>
                          ) : null}
                          
                          {/* Bookmark Button */}
                          <button
                            onClick={(e) => handleToggleBookmark(book._id, e)}
                            disabled={isBookmarkingThis}
                            className={`p-2 rounded-full transition-colors ${
                              isBookmarked
                                ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                            } disabled:opacity-50`}
                            title={isBookmarked ? "Remove bookmark" : "Bookmark this book"}
                          >
                            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
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
