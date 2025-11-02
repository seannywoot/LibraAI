"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Home, Book as BookIcon, Plus, Users, Library as LibraryIcon, User, Settings, History } from "@/components/icons";
import SignOutButton from "@/components/sign-out-button";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }) {
  const map = {
    "pending-approval": { bg: "bg-sky-100", text: "text-sky-800", label: "Pending Approval" },
    borrowed: { bg: "bg-amber-100", text: "text-amber-800", label: "Borrowed" },
    "return-requested": { bg: "bg-rose-100", text: "text-rose-800", label: "Return Requested" },
    returned: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Returned" },
    rejected: { bg: "bg-zinc-200", text: "text-zinc-700", label: "Rejected" },
  };
  const fallback = { bg: "bg-zinc-200", text: "text-zinc-700", label: (status || "Unknown").replace(/-/g, " ") };
  const c = map[status] || fallback;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function toInputDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState("");
  const [dueDates, setDueDates] = useState({});

  const navigationLinks = useMemo(() => ([
    { key: "admin-dashboard", label: "Dashboard", href: "/admin/dashboard", exact: true, icon: <Home className="h-4 w-4" /> },
    { key: "admin-books", label: "Books", href: "/admin/books", exact: true, icon: <BookIcon className="h-4 w-4" /> },
    { key: "admin-add-book", label: "Add Book", href: "/admin/books/add", exact: true, icon: <Plus className="h-4 w-4" /> },
    { key: "admin-transactions", label: "Transactions", href: "/admin/transactions", exact: true, icon: <History className="h-4 w-4" /> },
    { key: "admin-authors", label: "Authors", href: "/admin/authors", exact: true, icon: <Users className="h-4 w-4" /> },
    { key: "admin-shelves", label: "Shelves", href: "/admin/shelves", exact: true, icon: <LibraryIcon className="h-4 w-4" /> },
    { key: "admin-profile", label: "Profile", href: "/admin/profile", exact: true, icon: <User className="h-4 w-4" /> },
    { key: "admin-settings", label: "Settings", href: "/admin/settings", exact: true, icon: <Settings className="h-4 w-4" /> },
  ]), []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const url = `/api/admin/transactions?page=${page}&pageSize=${pageSize}${statusFilter ? `&status=${statusFilter}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load transactions");
        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, pageSize, statusFilter, refreshKey]);

  useEffect(() => {
    setDueDates((prev) => {
      const next = { ...prev };
      const seen = new Set();
      items.forEach((t) => {
        if (t.status === "pending-approval") {
          const key = t._id;
          seen.add(key);
          if (!next[key]) {
            next[key] = toInputDate(t.requestedDueDate || t.requestedAt);
          }
        }
      });
      Object.keys(next).forEach((key) => {
        if (!seen.has(key)) delete next[key];
      });
      return next;
    });
  }, [items]);

  async function handleAction(transactionId, action, extra = {}) {
    const actionKey = `${transactionId}:${action}`;
    setActionLoading(actionKey);
    setError("");
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionId, action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update transaction");
      }
      setFeedback(data?.message || "Action completed");
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(e?.message || "Failed to update transaction");
    } finally {
      setActionLoading("");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="Library Catalog"
        tagline="Admin"
        links={navigationLinks}
        variant="light"
        footer="Monitor borrowing activity."
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="flex items-end justify-between gap-4 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Borrow Transactions</h1>
            <p className="text-sm text-zinc-600">View all borrowing and return activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setFeedback("");
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
            >
              <option value="">All Status</option>
              <option value="borrowed">Borrowed</option>
              <option value="returned">Returned</option>
              <option value="pending-approval">Pending Approval</option>
              <option value="return-requested">Return Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading transactions…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <History className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No transactions yet</h2>
            <p className="text-sm text-zinc-600">Borrowing activity will appear here.</p>
          </div>
        ) : (
          <section className="space-y-4">
            {feedback && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{feedback}</div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Book</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Requested</th>
                    <th className="px-4 py-2">Borrowed</th>
                    <th className="px-4 py-2">Due Date</th>
                    <th className="px-4 py-2">Returned</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => {
                    const startDateValue = t.borrowedAt || t.requestedAt;
                    const startDate = startDateValue ? new Date(startDateValue) : null;
                    const dueDateValue = t.dueDate || t.requestedDueDate;
                    const dueDateObj = dueDateValue ? new Date(dueDateValue) : null;
                    let durationLabel = "";
                    if (startDate && dueDateObj && !Number.isNaN(startDate.getTime()) && !Number.isNaN(dueDateObj.getTime())) {
                      const diffMs = dueDateObj.getTime() - startDate.getTime();
                      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
                      durationLabel = `${diffDays} day${diffDays === 1 ? "" : "s"}`;
                    } else if (t.requestedLoanDays) {
                      const days = Math.max(1, t.requestedLoanDays);
                      durationLabel = `${days} day${days === 1 ? "" : "s"}`;
                    }

                    return (
                      <tr key={t._id} className="rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800">
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900">{t.bookTitle}</div>
                          <div className="text-xs text-zinc-600">{t.bookAuthor}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{t.userName}</div>
                          <div className="text-xs text-zinc-600">{t.userId}</div>
                        </td>
                        <td className="px-4 py-3">{formatDate(t.requestedAt)}</td>
                        <td className="px-4 py-3">{formatDate(t.borrowedAt)}</td>
                        <td className="px-4 py-3">
                          <div>{formatDate(dueDateValue)}</div>
                          {durationLabel && <div className="text-xs text-zinc-500">{durationLabel}</div>}
                        </td>
                        <td className="px-4 py-3">{formatDate(t.returnedAt)}</td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3">
                          {t.status === "pending-approval" && (
                            <div className="space-y-2">
                              <label className="flex flex-col gap-1 text-xs text-zinc-600">
                                Due Date
                                <input
                                  type="date"
                                  value={dueDates[t._id] || ""}
                                  onChange={(e) =>
                                    setDueDates((prev) => ({
                                      ...prev,
                                      [t._id]: e.target.value,
                                    }))
                                  }
                                  className="rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-800"
                                />
                              </label>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                  disabled={actionLoading === `${t._id}:approve`}
                                  onClick={() =>
                                    handleAction(t._id, "approve", {
                                      dueDate: dueDates[t._id] ? new Date(dueDates[t._id]).toISOString() : undefined,
                                    })
                                  }
                                >
                                  {actionLoading === `${t._id}:approve` ? "Approving…" : "Approve"}
                                </button>
                                <button
                                  className="rounded-lg border border-rose-500 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                                  disabled={actionLoading === `${t._id}:reject`}
                                  onClick={() => handleAction(t._id, "reject")}
                                >
                                  {actionLoading === `${t._id}:reject` ? "Rejecting…" : "Reject"}
                                </button>
                              </div>
                            </div>
                          )}
                          {t.status === "return-requested" && (
                            <button
                              className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                              disabled={actionLoading === `${t._id}:return`}
                              onClick={() => handleAction(t._id, "return")}
                            >
                              {actionLoading === `${t._id}:return` ? "Processing…" : "Confirm Return"}
                            </button>
                          )}
                          {t.status === "borrowed" && (
                            <button
                              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                              disabled={actionLoading === `${t._id}:return`}
                              onClick={() => handleAction(t._id, "return")}
                            >
                              {actionLoading === `${t._id}:return` ? "Processing…" : "Mark Returned"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Page {page} of {totalPages} · {total} total</p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => {
                    setFeedback("");
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => {
                    setFeedback("");
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
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
