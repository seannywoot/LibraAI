"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, Plus } from "@/components/icons";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import ConfirmDialog from "@/components/confirm-dialog";

function StatusChip({ status }) {
  const map = {
    available: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
    "checked-out": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
    reserved: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
    maintenance: { bg: "bg-zinc-200", text: "text-zinc-800", dot: "bg-zinc-500" },
    damaged: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
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

export default function AdminBooksListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const justSelectedSuggestion = useRef(false);

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
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
        if (searchInput) params.append("search", searchInput);
        
        const res = await fetch(`/api/admin/books?${params}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load books");
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
  }, [page, pageSize, searchInput]);

  function handleClearSearch() {
    setSearchInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/admin/books/suggestions?q=${encodeURIComponent(searchInput)}`,
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleDelete(book) {
    if (!book) return;

    setDeleting(book._id);
    try {
      const identifier = book.slug || book._id;
      const res = await fetch(`/api/admin/books/${identifier}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to delete book");
      }

      showToast("Book deleted successfully", "success");
      setPendingDelete(null);
      
      // Reload the books list
      const reloadRes = await fetch(`/api/admin/books?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const reloadData = await reloadRes.json().catch(() => ({}));
      if (reloadRes.ok && reloadData?.ok) {
        setItems(reloadData.items || []);
        setTotal(reloadData.total || 0);
        
        // If current page is now empty and not the first page, go back one page
        if (reloadData.items.length === 0 && page > 1) {
          setPage(page - 1);
        }
      }
    } catch (e) {
      showToast(e?.message || "Failed to delete book", "error");
    } finally {
      setDeleting(null);
    }
  }

  const isDeletingCurrent = pendingDelete ? deleting === pendingDelete._id : false;

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <ToastContainer />
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Books</h1>
              <p className="text-sm text-zinc-600">View recent additions and their availability.</p>
            </div>
            <Link href="/admin/books/add" className="inline-flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              <Plus className="h-4 w-4" />
              Add book
            </Link>
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
              placeholder="Search books..."
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
                    className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 border-b border-zinc-100 last:border-b-0 ${
                      idx === selectedSuggestionIndex
                        ? "bg-zinc-100"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <svg className="h-4 w-4 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {suggestion.type === "title" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      ) : suggestion.type === "author" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
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
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading books…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <BookIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No existing book</h2>
            <p className="text-sm text-zinc-600">Get started by adding your first book to the catalog.</p>
            <Link href="/admin/books/add" className="mt-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">Add a book</Link>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Author</th>
                    <th className="px-4 py-2">Year</th>
                    <th className="px-4 py-2">Shelf</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">ISBN</th>
                    <th className="px-4 py-2">Barcode</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((b) => (
                    <tr key={b._id} className="rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800">
                      <td className="px-4 py-3 font-medium text-zinc-900">{b.title}</td>
                      <td className="px-4 py-3">{b.author || "—"}</td>
                      <td className="px-4 py-3">{b.year ?? "—"}</td>
                      <td className="px-4 py-3">
                        {b.shelf && b.shelfId ? (
                          <Link href={`/admin/shelves/${b.shelfId}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {b.shelf}
                          </Link>
                        ) : (
                          b.shelf || "—"
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusChip status={b.status} /></td>
                      <td className="px-4 py-3">{b.isbn || "—"}</td>
                      <td className="px-4 py-3">{b.barcode || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/books/${b.slug || b._id}/edit`}
                            className="rounded-lg border border-blue-500 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => setPendingDelete(b)}
                            disabled={deleting === b._id}
                            className="rounded-lg border border-rose-500 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                          >
                            {deleting === b._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
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
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Book"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.title}"? This action cannot be undone.` : ""}
        confirmLabel={isDeletingCurrent ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        loading={isDeletingCurrent}
        onCancel={() => {
          if (!isDeletingCurrent) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete && !isDeletingCurrent) {
            void handleDelete(pendingDelete);
          }
        }}
      />
    </div>
  );
}
