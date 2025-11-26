"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { History } from "@/components/icons";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import CalendarDatePicker from "@/components/admin/calendar-date-picker";
import { ToastContainer, showToast } from "@/components/ToastContainer";

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

function getTodayInputDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const localMidnight = new Date(now.getTime() - offsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

export default function AdminTransactionsPage() {
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
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const justSelectedSuggestion = useRef(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState("");
  const [dueDates, setDueDates] = useState({});
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [returnTarget, setReturnTarget] = useState(null);
  const [bookCondition, setBookCondition] = useState("good");
  const [conditionNotes, setConditionNotes] = useState("");
  const [returnError, setReturnError] = useState("");

  const todayInputDateRef = useRef(getTodayInputDate());
  const todayInputDate = todayInputDateRef.current;

  const rejectProcessing = rejectTarget ? actionLoading === `${rejectTarget._id}:reject` : false;
  const returnProcessing = returnTarget ? actionLoading === `${returnTarget._id}:return` : false;

  const navigationLinks = useMemo(() => getAdminLinks(), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Auto-suggestions effect - reload when status filter changes
  useEffect(() => {
    // Don't show suggestions if user just selected one
    if (justSelectedSuggestion.current) {
      justSelectedSuggestion.current = false;
      return;
    }

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
  }, [searchInput, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        if (statusFilter) params.append("status", statusFilter);
        if (searchInput) params.append("search", searchInput);

        const url = `/api/admin/transactions?${params}`;
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
  }, [page, pageSize, statusFilter, searchInput, refreshKey]);

  function handleClearSearch() {
    setSearchInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    try {
      const params = new URLSearchParams({ q: searchInput });
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(
        `/api/admin/transactions/suggestions?${params}`,
        { cache: "no-store" }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error("Failed to load suggestions:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  function handleSuggestionClick(suggestion) {
    justSelectedSuggestion.current = true;
    setSearchInput(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setSuggestions([]);
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

  useEffect(() => {
    const today = todayInputDateRef.current;
    setDueDates((prev) => {
      const next = { ...prev };
      const seen = new Set();
      items.forEach((t) => {
        if (t.status === "pending-approval") {
          const key = t._id;
          seen.add(key);
          const initial = toInputDate(t.requestedDueDate || t.requestedAt) || today;
          const safeInitial = initial < today ? today : initial;
          if (!next[key]) {
            next[key] = safeInitial;
          } else if (next[key] < today) {
            next[key] = today;
          }
        }
      });
      Object.keys(next).forEach((key) => {
        if (!seen.has(key)) delete next[key];
      });
      return next;
    });
  }, [items]);

  function closeRejectDialog() {
    if (rejectProcessing) return;
    setRejectTarget(null);
    setRejectReason("");
    setRejectError("");
  }

  function closeReturnDialog() {
    if (returnProcessing) return;
    setReturnTarget(null);
    setBookCondition("good");
    setConditionNotes("");
    setReturnError("");
  }

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
      showToast(data?.message || "Action completed", "success");

      // For archive action, remove the item from the list dynamically
      if (action === "archive") {
        setItems((prevItems) => prevItems.filter((item) => item._id !== transactionId));
        setTotal((prevTotal) => Math.max(0, prevTotal - 1));
      } else {
        // For other actions, refresh the list
        setRefreshKey((k) => k + 1);
      }

      return { ok: true, message: data?.message };
    } catch (e) {
      showToast(e?.message || "Failed to update transaction", "error");
      return { ok: false, error: e?.message || "Failed to update transaction" };
    } finally {
      setActionLoading("");
    }
  }

  async function submitRejection(event) {
    event.preventDefault();
    if (!rejectTarget) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 3) {
      setRejectError("Please provide a brief reason (at least 3 characters).");
      return;
    }
    setRejectError("");
    const result = await handleAction(rejectTarget._id, "reject", { reason: trimmed });
    if (result?.ok) {
      closeRejectDialog();
    } else if (result?.error) {
      setRejectError(result.error);
    }
  }

  async function submitReturn(event) {
    event.preventDefault();
    if (!returnTarget) return;

    if (!bookCondition) {
      setReturnError("Please select a book condition.");
      return;
    }

    if (bookCondition === "damaged" && !conditionNotes.trim()) {
      setReturnError("Please provide notes explaining the damage.");
      return;
    }

    setReturnError("");
    const result = await handleAction(returnTarget._id, "return", {
      bookCondition,
      conditionNotes: conditionNotes.trim()
    });

    if (result?.ok) {
      closeReturnDialog();
    } else if (result?.error) {
      setReturnError(result.error);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px] text-(--text)">
      <ToastContainer position="top-right" />
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Borrow Transactions</h1>
              <p className="text-sm text-zinc-600">View all borrowing and return activity.</p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => router.push("/admin/transactions/archives")}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 whitespace-nowrap"
              >
                View Archives
              </button>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 w-full md:w-auto"
              >
                <option value="">All Status</option>
                <option value="borrowed">Borrowed</option>
                <option value="returned">Returned</option>
                <option value="pending-approval">Pending Approval</option>
                <option value="return-requested">Return Requested</option>
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
              placeholder="Search transactions..."
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
            {showSuggestions && suggestions.length > 0 && searchInput.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 border-b border-zinc-100 last:border-b-0 ${idx === selectedSuggestionIndex
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
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-6 py-2">Book</th>
                    <th className="px-6 py-2">User</th>
                    <th className="px-6 py-2">Requested</th>
                    <th className="px-6 py-2">Borrowed</th>
                    <th className="px-6 py-2">Due Date</th>
                    <th className="px-6 py-2">Returned</th>
                    <th className="px-6 py-2 pr-2">Status</th>
                    <th className="pl-2 py-2">Actions</th>
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
                        <td className="px-6 py-3">
                          <div className="font-medium text-zinc-900">{t.bookTitle}</div>
                          <div className="text-xs text-zinc-600">{t.bookAuthor}</div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-medium">{t.userName}</div>
                          <div className="text-xs text-zinc-600">{t.userId}</div>
                        </td>
                        <td className="px-6 py-3">{formatDate(t.requestedAt)}</td>
                        <td className="px-6 py-3">{formatDate(t.borrowedAt)}</td>
                        <td className="px-6 py-3">
                          <div>{formatDate(dueDateValue)}</div>
                          {durationLabel && <div className="text-xs text-zinc-500">{durationLabel}</div>}
                        </td>
                        <td className="px-6 py-3">{formatDate(t.returnedAt)}</td>
                        <td className="px-6 py-3 pr-2">
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
                            {t.status === "rejected" && !t.rejectionReason && (
                              <p className="text-xs text-zinc-500">No reason recorded.</p>
                            )}
                            {t.status === "returned" && t.bookCondition && (
                              <div className="mt-2">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.bookCondition === "good"
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
                        <td className="pl-2 py-3">
                          {t.status === "pending-approval" && (
                            <div className="space-y-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-zinc-600">Due Date</span>
                                <CalendarDatePicker
                                  value={dueDates[t._id] || ""}
                                  min={todayInputDate}
                                  onChange={(nextValue) =>
                                    setDueDates((prev) => ({
                                      ...prev,
                                      [t._id]: nextValue && nextValue < todayInputDate ? todayInputDate : nextValue,
                                    }))
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
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
                                  onClick={() => {
                                    setError("");
                                    setRejectTarget(t);
                                    setRejectReason("");
                                    setRejectError("");
                                  }}
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
                              onClick={() => {
                                setReturnTarget(t);
                                setBookCondition("good");
                                setConditionNotes("");
                                setReturnError("");
                              }}
                            >
                              {actionLoading === `${t._id}:return` ? "Processing…" : "Confirm Return"}
                            </button>
                          )}
                          {t.status === "borrowed" && (
                            <button
                              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                              disabled={actionLoading === `${t._id}:return`}
                              onClick={() => {
                                setReturnTarget(t);
                                setBookCondition("good");
                                setConditionNotes("");
                                setReturnError("");
                              }}
                            >
                              {actionLoading === `${t._id}:return` ? "Processing…" : "Mark Returned"}
                            </button>
                          )}
                          {(t.status === "rejected" || t.status === "returned") && !t.archived && (
                            <button
                              className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                              disabled={actionLoading === `${t._id}:archive`}
                              onClick={() => handleAction(t._id, "archive")}
                            >
                              {actionLoading === `${t._id}:archive` ? "Archiving…" : "Archive"}
                            </button>
                          )}
                          {t.archived && (
                            <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                              Archived
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
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
                  <div key={t._id} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-medium text-zinc-900 line-clamp-2">{t.bookTitle}</h3>
                        <p className="text-sm text-zinc-600">{t.bookAuthor}</p>
                      </div>
                      <StatusBadge status={t.status} />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <div className="flex-1 rounded-lg bg-zinc-50 p-2 border border-zinc-100">
                        <span className="block font-medium text-zinc-700 mb-0.5">User</span>
                        <div className="font-medium text-zinc-900">{t.userName}</div>
                        <div className="truncate">{t.userId}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-zinc-500">
                      <div>
                        <span className="block font-medium text-zinc-700">Requested</span>
                        {formatDate(t.requestedAt)}
                      </div>
                      <div>
                        <span className="block font-medium text-zinc-700">Borrowed</span>
                        {formatDate(t.borrowedAt)}
                      </div>
                      <div>
                        <span className="block font-medium text-zinc-700">Due Date</span>
                        {formatDate(dueDateValue)}
                        {durationLabel && <span className="ml-1 text-zinc-400">({durationLabel})</span>}
                      </div>
                      <div>
                        <span className="block font-medium text-zinc-700">Returned</span>
                        {formatDate(t.returnedAt)}
                      </div>
                    </div>

                    {/* Status Details (Rejection/Condition) */}
                    {t.status === "rejected" && t.rejectionReason && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                        <span className="font-semibold block mb-1">Rejection Reason:</span>
                        {t.rejectionReason}
                      </div>
                    )}
                    {t.status === "returned" && t.bookCondition && (
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-zinc-700">Condition:</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.bookCondition === "good"
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
                        </div>
                        {t.conditionNotes && (
                          <p className="text-zinc-600 italic">"{t.conditionNotes}"</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 border-t border-zinc-100">
                      {t.status === "pending-approval" && (
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-zinc-700">Set Due Date</span>
                            <CalendarDatePicker
                              value={dueDates[t._id] || ""}
                              min={todayInputDate}
                              onChange={(nextValue) =>
                                setDueDates((prev) => ({
                                  ...prev,
                                  [t._id]: nextValue && nextValue < todayInputDate ? todayInputDate : nextValue,
                                }))
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
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
                              className="rounded-lg border border-rose-500 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                              disabled={actionLoading === `${t._id}:reject`}
                              onClick={() => {
                                setError("");
                                setRejectTarget(t);
                                setRejectReason("");
                                setRejectError("");
                              }}
                            >
                              {actionLoading === `${t._id}:reject` ? "Rejecting…" : "Reject"}
                            </button>
                          </div>
                        </div>
                      )}

                      {t.status === "return-requested" && (
                        <button
                          className="w-full rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                          disabled={actionLoading === `${t._id}:return`}
                          onClick={() => {
                            setReturnTarget(t);
                            setBookCondition("good");
                            setConditionNotes("");
                            setReturnError("");
                          }}
                        >
                          {actionLoading === `${t._id}:return` ? "Processing…" : "Confirm Return"}
                        </button>
                      )}

                      {t.status === "borrowed" && (
                        <button
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
                          disabled={actionLoading === `${t._id}:return`}
                          onClick={() => {
                            setReturnTarget(t);
                            setBookCondition("good");
                            setConditionNotes("");
                            setReturnError("");
                          }}
                        >
                          {actionLoading === `${t._id}:return` ? "Processing…" : "Mark Returned"}
                        </button>
                      )}

                      {(t.status === "rejected" || t.status === "returned") && !t.archived && (
                        <button
                          className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                          disabled={actionLoading === `${t._id}:archive`}
                          onClick={() => handleAction(t._id, "archive")}
                        >
                          {actionLoading === `${t._id}:archive` ? "Archiving…" : "Archive"}
                        </button>
                      )}

                      {t.archived && (
                        <div className="text-center">
                          <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                            Archived
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          onClick={closeRejectDialog}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900">Reject Borrow Request</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Provide a reason for rejecting {rejectTarget.userName ? `${rejectTarget.userName}'s` : "this"} request for &quot;{rejectTarget.bookTitle}&quot;.
            </p>
            <form className="mt-4 space-y-4" onSubmit={submitRejection}>
              <label className="flex flex-col gap-2 text-sm text-zinc-700">
                Reason
                <textarea
                  className="min-h-[120px] rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-500 focus:outline-none"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                  maxLength={100}
                  placeholder="Explain why this request is being rejected…"
                  disabled={rejectProcessing}
                />
              </label>
              {rejectError && <p className="text-xs text-rose-600">{rejectError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                  onClick={closeRejectDialog}
                  disabled={rejectProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                  disabled={rejectProcessing}
                >
                  {rejectProcessing ? "Rejecting…" : "Submit Reason"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {returnTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          onClick={closeReturnDialog}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900">Process Book Return</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Check the condition of &quot;{returnTarget.bookTitle}&quot; returned by {returnTarget.userName || "the student"}.
            </p>
            <form className="mt-4 space-y-4" onSubmit={submitReturn}>
              <label className="flex flex-col gap-2 text-sm text-zinc-700">
                Book Condition
                <div className="space-y-2">
                  <label className="flex items-center gap-3 rounded-lg border border-zinc-300 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input
                      type="radio"
                      name="condition"
                      value="good"
                      checked={bookCondition === "good"}
                      onChange={(e) => {
                        setBookCondition(e.target.value);
                        if (returnError) setReturnError("");
                      }}
                      disabled={returnProcessing}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900">Good Condition</div>
                      <div className="text-xs text-zinc-500">No visible damage or wear</div>
                    </div>
                    <span className="text-emerald-600">✓</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-zinc-300 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input
                      type="radio"
                      name="condition"
                      value="fair"
                      checked={bookCondition === "fair"}
                      onChange={(e) => {
                        setBookCondition(e.target.value);
                        if (returnError) setReturnError("");
                      }}
                      disabled={returnProcessing}
                      className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900">Fair Condition</div>
                      <div className="text-xs text-zinc-500">Minor wear but still usable</div>
                    </div>
                    <span className="text-amber-600">⚠</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-zinc-300 px-4 py-3 cursor-pointer hover:bg-zinc-50 transition-colors">
                    <input
                      type="radio"
                      name="condition"
                      value="damaged"
                      checked={bookCondition === "damaged"}
                      onChange={(e) => {
                        setBookCondition(e.target.value);
                        if (returnError) setReturnError("");
                      }}
                      disabled={returnProcessing}
                      className="h-4 w-4 text-rose-600 focus:ring-rose-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900">Damaged</div>
                      <div className="text-xs text-zinc-500">Significant damage requiring attention</div>
                    </div>
                    <span className="text-rose-600">✕</span>
                  </label>
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm text-zinc-700">
                Notes {bookCondition === "damaged" && <span className="text-rose-600">(Required for damaged books)</span>}
                <textarea
                  className="min-h-[100px] rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-zinc-500 focus:outline-none"
                  value={conditionNotes}
                  onChange={(e) => {
                    setConditionNotes(e.target.value);
                    if (returnError) setReturnError("");
                  }}
                  maxLength={100}
                  placeholder={bookCondition === "damaged" ? "Describe the damage in detail…" : "Optional notes about the book's condition…"}
                  disabled={returnProcessing}
                />
                <span className="text-xs text-zinc-500">{conditionNotes.length}/100 characters</span>
              </label>

              {returnError && <p className="text-xs text-rose-600">{returnError}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                  onClick={closeReturnDialog}
                  disabled={returnProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                  disabled={returnProcessing}
                >
                  {returnProcessing ? "Processing…" : "Confirm Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
