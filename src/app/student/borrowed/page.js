"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, BookOpen } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ToastContainer";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

function StatusBadge({ status }) {
  const map = {
    "pending-approval": { bg: "bg-sky-100", text: "text-sky-800", label: "Pending Approval" },
    borrowed: { bg: "bg-amber-100", text: "text-amber-800", label: "Borrowed" },
    "return-requested": { bg: "bg-rose-100", text: "text-rose-800", label: "Return Requested" },
    rejected: { bg: "bg-zinc-200", text: "text-zinc-700", label: "Request Rejected" },
  };
  const config = map[status] || map["pending-approval"];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

export default function StudentBorrowedPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [returning, setReturning] = useState(null);

  const navigationLinks = getStudentLinks();

  useEffect(() => {
    loadBorrowedBooks();
  }, []);

  async function loadBorrowedBooks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/books/borrowed", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load borrowed books");
      setItems(data.items || []);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(bookId) {
    setReturning(bookId);
    try {
      const res = await fetch("/api/student/books/return", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to return book");
      
  showToast("Return request submitted", "success");
      loadBorrowedBooks();
    } catch (e) {
      showToast(e?.message || "Failed to return book", "error");
    } finally {
      setReturning(null);
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <ToastContainer />
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="flex items-end justify-between gap-4 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">My Borrowed Books</h1>
            <p className="text-sm text-zinc-600">View and return your currently borrowed books.</p>
          </div>
          <Link href="/student/books" className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            <BookIcon className="h-4 w-4" />
            Catalog
          </Link>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading borrowed books…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No borrowed books</h2>
            <p className="text-sm text-zinc-600">You haven&apos;t borrowed any books yet. Browse the catalog to get started.</p>
            <Link href="/student/books" className="mt-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">Catalog</Link>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="space-y-3">
              {items.map((transaction) => {
                const borrowDate = transaction.status === "borrowed" ? transaction.borrowedAt : transaction.requestedAt;
                const dueDate = transaction.status === "borrowed" ? transaction.dueDate : transaction.requestedDueDate;
                const overdue = transaction.status === "borrowed" ? isOverdue(dueDate) : false;
                const canReturn = transaction.status === "borrowed";
                return (
                  <article key={transaction._id} className={`rounded-xl border p-5 ${overdue ? "border-rose-200 bg-rose-50" : "border-zinc-200 bg-zinc-50"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-semibold text-zinc-900">{transaction.bookTitle}</h3>
                          <p className="text-sm text-zinc-600">{transaction.bookAuthor}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                          <span>{transaction.status === "pending-approval" ? "Requested" : "Borrowed"}: {formatDate(borrowDate)}</span>
                          <span className={overdue ? "font-semibold text-rose-700" : ""}>
                            Due: {formatDate(dueDate)}
                            {overdue && " (Overdue)"}
                          </span>
                          {transaction.loanPolicy && transaction.loanPolicy !== "standard" && (
                            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-700">
                              {transaction.loanPolicy.replace(/-/g, " ")}
                            </span>
                          )}
                          <StatusBadge status={transaction.status} />
                        </div>
                        {transaction.status === "return-requested" && (
                          <p className="text-xs text-zinc-500">Waiting for admin to confirm the return.</p>
                        )}
                        {transaction.status === "pending-approval" && (
                          <p className="text-xs text-zinc-500">Your request is with the admin for approval.</p>
                        )}
                        {transaction.status === "rejected" && (
                          <p className="text-xs text-rose-600">This request was rejected by the admin.</p>
                        )}
                      </div>
                      {canReturn ? (
                        <button
                          onClick={() => handleReturn(transaction.bookId)}
                          disabled={returning === transaction.bookId}
                          className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                        >
                          {returning === transaction.bookId ? "Submitting..." : "Request Return"}
                        </button>
                      ) : transaction.status === "return-requested" ? (
                        <span className="text-xs font-medium text-zinc-500">Awaiting admin confirmation</span>
                      ) : transaction.status === "rejected" ? (
                        <span className="text-xs font-medium text-rose-600">Request rejected</span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-500">Pending admin approval</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
