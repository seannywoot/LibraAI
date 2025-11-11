"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Archive } from "@/components/icons";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import ConfirmDialog from "@/components/confirm-dialog";
import { Trash2 } from "@/components/icons";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    timeZone: "Asia/Manila"
  });
}

function StatusBadge({ status }) {
  const map = {
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

export default function AdminTransactionArchivesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const navigationLinks = useMemo(() => getAdminLinks(), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Auto-suggestions effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length >= 2) {
        loadSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ 
          page: page.toString(), 
          pageSize: pageSize.toString(),
          showArchived: "true"
        });
        if (statusFilter) params.append("status", statusFilter);
        if (searchInput) params.append("search", searchInput);
        
        const url = `/api/admin/transactions?${params}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load archived transactions");
        if (!cancelled) {
          // Filter to only show archived items
          const archivedItems = (data.items || []).filter(item => item.archived === true);
          setItems(archivedItems);
          setTotal(archivedItems.length);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, pageSize, statusFilter, searchInput]);

  function handleClearSearch() {
    setSearchInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }

  async function loadSuggestions() {
    try {
      const res = await fetch(
        `/api/admin/transactions/suggestions?q=${encodeURIComponent(searchInput)}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error("Failed to load suggestions:", e);
    }
  }

  function handleSuggestionClick(suggestion) {
    setSearchInput(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setPage(1);
  }

  function handleKeyDown(e) {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          shouldCloseOnBlur.current = false;
          if (selectedSuggestionIndex >= 0) {
            handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          } else {
            setShowSuggestions(false);
            setSelectedSuggestionIndex(-1);
            setSuggestions([]);
          }
          setTimeout(() => {
            shouldCloseOnBlur.current = true;
          }, 100);
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          setSuggestions([]);
          break;
      }
    }
  }

  async function deleteTransaction(id) {
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Delete failed");
      showToast("Transaction deleted successfully", "success");
      setPendingDelete(null);
      // Reload the list
      setPage(1);
      const params = new URLSearchParams({ 
        page: "1", 
        pageSize: pageSize.toString(),
        showArchived: "true"
      });
      if (statusFilter) params.append("status", statusFilter);
      if (searchInput) params.append("search", searchInput);
      
      const url = `/api/admin/transactions?${params}`;
      const res2 = await fetch(url, { cache: "no-store" });
      const data2 = await res2.json().catch(() => ({}));
      if (res2.ok && data2?.ok) {
        const archivedItems = (data2.items || []).filter(item => item.archived === true);
        setItems(archivedItems);
        setTotal(archivedItems.length);
      }
    } catch (e) { 
      showToast(e?.message || "Failed to delete transaction", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isDeletingCurrent = pendingDelete ? deletingId === pendingDelete._id : false;

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <ToastContainer position="top-right" />
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Transaction Archives</h1>
              <p className="text-sm text-zinc-600">View archived transactions that have been completed or rejected.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/admin/transactions")}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                ← Back to Transactions
              </button>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <option value="">All Status</option>
                <option value="returned">Returned</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (shouldCloseOnBlur.current) {
                    setShowSuggestions(false);
                    setSelectedSuggestionIndex(-1);
                  }
                }, 200);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search archived transactions..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Auto-suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 border-b border-zinc-100 last:border-b-0 ${
                      idx === selectedSuggestionIndex
                        ? "bg-zinc-100"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {suggestion.type === "book" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      ) : suggestion.type === "user" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      )}
                    </svg>
                    <span className="text-sm text-zinc-900 truncate">{suggestion.text}</span>
                    <span className="ml-auto text-xs text-zinc-400 capitalize">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading archived transactions…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <Archive className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No archived transactions</h2>
            <p className="text-sm text-zinc-600">Archived transactions will appear here.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-separate" style={{ borderSpacing: "0 12px" }}>
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Book</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-3 py-2">Requested</th>
                    <th className="px-3 py-2">Borrowed</th>
                    <th className="px-3 py-2">Due Date</th>
                    <th className="px-3 py-2">Returned</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-3 py-2">Archived</th>
                    <th className="px-3 py-2 text-center">Actions</th>
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
                        <td className="px-4 py-4 rounded-l-xl">
                          <div className="font-medium text-zinc-900">{t.bookTitle}</div>
                          <div className="text-xs text-zinc-600">{t.bookAuthor}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">{t.userName}</div>
                          <div className="text-xs text-zinc-600">{t.userId}</div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">{formatDate(t.requestedAt)}</td>
                        <td className="px-3 py-4 whitespace-nowrap">{formatDate(t.borrowedAt)}</td>
                        <td className="px-3 py-4">
                          <div className="whitespace-nowrap">{formatDate(dueDateValue)}</div>
                          {durationLabel && <div className="text-xs text-zinc-500">{durationLabel}</div>}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">{formatDate(t.returnedAt)}</td>
                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <StatusBadge status={t.status} />
                            {t.status === "rejected" && t.rejectionReason && (
                              <p
                                className="whitespace-pre-line rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                                style={{ wordBreak: "break-word" }}
                              >
                                {t.rejectionReason}
                              </p>
                            )}
                            {t.status === "returned" && t.bookCondition && (
                              <div className="mt-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    t.bookCondition === "good"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : t.bookCondition === "fair"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {t.bookCondition === "good" && "✓"}
                                  {t.bookCondition === "fair" && "⚠"}
                                  {t.bookCondition === "damaged" && "✕"}
                                  {" "}
                                  {t.bookCondition.charAt(0).toUpperCase() + t.bookCondition.slice(1)}
                                </span>
                                {t.conditionNotes && (
                                  <p className="mt-1 text-xs text-zinc-600 italic">{t.conditionNotes}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-xs text-zinc-600 whitespace-nowrap">{formatDate(t.archivedAt)}</div>
                          {t.archivedBy && <div className="text-xs text-zinc-500 truncate max-w-[150px]" title={t.archivedBy}>{t.archivedBy}</div>}
                        </td>
                        <td className="px-3 py-4 text-center rounded-r-xl">
                          <button
                            onClick={() => setPendingDelete(t)}
                            className="inline-flex items-center justify-center rounded-lg border border-rose-500 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => {
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

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Transaction"
        description={pendingDelete ? `Are you sure you want to permanently delete this transaction for "${pendingDelete.bookTitle}"? This action cannot be undone.` : ""}
        confirmLabel={isDeletingCurrent ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        loading={isDeletingCurrent}
        onCancel={() => {
          if (!isDeletingCurrent) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete && !isDeletingCurrent) {
            void deleteTransaction(pendingDelete._id);
          }
        }}
      />
    </div>
  );
}
