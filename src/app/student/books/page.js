"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Home, Book as BookIcon, User, Settings, BookOpen } from "@/components/icons";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ToastContainer";

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

export default function StudentBooksPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [borrowing, setBorrowing] = useState(null);

  const navigationLinks = [
    { key: "student-dashboard", label: "Dashboard", href: "/student/dashboard", exact: true, icon: <Home className="h-4 w-4" /> },
    { key: "student-books", label: "Browse Books", href: "/student/books", exact: true, icon: <BookIcon className="h-4 w-4" /> },
    { key: "student-borrowed", label: "My Books", href: "/student/borrowed", exact: true, icon: <BookOpen className="h-4 w-4" /> },
    { key: "student-profile", label: "Profile", href: "/student/profile", exact: true, icon: <User className="h-4 w-4" /> },
    { key: "student-settings", label: "Settings", href: "/student/settings", exact: true, icon: <Settings className="h-4 w-4" /> },
  ];

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/student/books?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load books");
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <ToastContainer />
      <DashboardSidebar
        heading="LibraAI Student"
        tagline="Student"
        links={navigationLinks}
        variant="light"
        footer="Browse and borrow books from the library."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="flex items-end justify-between gap-4 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Browse Books</h1>
            <p className="text-sm text-zinc-600">Explore available books and borrow them for your studies.</p>
          </div>
          <Link href="/student/borrowed" className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            <BookOpen className="h-4 w-4" />
            My Books
          </Link>
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
            <h2 className="text-lg font-semibold text-zinc-900">No books available</h2>
            <p className="text-sm text-zinc-600">Check back later for new additions to the catalog.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((book) => (
                <article key={book._id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-zinc-900 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-zinc-600">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {book.year && <span>{book.year}</span>}
                    {book.year && book.publisher && <span>•</span>}
                    {book.publisher && <span>{book.publisher}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusChip status={book.status} />
                    {book.status === "available" && !["reference-only", "staff-only"].includes(book.loanPolicy || "") ? (
                      <button
                        onClick={() => handleBorrow(book._id)}
                        disabled={borrowing === book._id}
                        className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        {borrowing === book._id ? "Borrowing..." : "Borrow"}
                      </button>
                    ) : book.status === "reserved" && book.reservedForCurrentUser ? (
                      <span className="text-xs font-medium text-zinc-500">Awaiting admin approval</span>
                    ) : book.status === "reserved" ? (
                      <span className="text-xs text-zinc-500">Reserved</span>
                    ) : book.status === "checked-out" ? (
                      <span className="text-xs text-zinc-500">Checked out</span>
                    ) : book.loanPolicy === "reference-only" ? (
                      <span className="text-xs text-zinc-500">Reference only</span>
                    ) : book.loanPolicy === "staff-only" ? (
                      <span className="text-xs text-zinc-500">Staff only</span>
                    ) : null}
                  </div>
                </article>
              ))}
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
