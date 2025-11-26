"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Users } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";

export default function StudentAuthorsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const justSelectedSuggestion = useRef(false);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  const navigationLinks = getStudentLinks();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadAuthors();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    loadAuthors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  async function loadAuthors() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (searchInput) params.append("search", searchInput);

      const res = await fetch(`/api/student/authors?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load authors");
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadSuggestions() {
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `/api/student/authors/suggestions?q=${encodeURIComponent(searchInput)}`,
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

  function handleClearSearch() {
    setSearchInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
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
            loadAuthors();
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
    } else if (e.key === "Enter") {
      loadAuthors();
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-zinc-200 bg-white p-6 lg:p-10 shadow-sm">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Browse Authors</h1>
            <p className="text-sm text-zinc-600">Explore authors in our library collection.</p>
          </div>

          {/* Search Bar with View Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
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
                onFocus={() =>
                  searchInput.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)
                }
                onBlur={() => {
                  setTimeout(() => {
                    if (shouldCloseOnBlur.current) {
                      setShowSuggestions(false);
                      setSelectedSuggestionIndex(-1);
                    }
                  }, 200);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search by author name..."
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
                      <svg
                        className="h-4 w-4 text-zinc-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-900 truncate">
                          {suggestion.text}
                        </p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {suggestion.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border border-zinc-300 bg-white overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2.5 text-sm transition-colors ${viewMode === "grid"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                  }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2.5 text-sm transition-colors ${viewMode === "list"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:bg-zinc-50"
                  }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-zinc-200 p-2 w-9 h-9" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-zinc-200 rounded w-32" />
                    <div className="h-4 bg-zinc-200 rounded w-full" />
                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 rounded w-20 mt-2" />
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
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No existing author</h2>
            <p className="text-sm text-zinc-600">Try searching for other authors or consult with the librarian for assistance.</p>
          </div>
        ) : (
          <section className="space-y-4">
            {viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((author) => (
                  <Link
                    key={author._id}
                    href={`/student/authors/${encodeURIComponent(author.slug || author._id)}`}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-white p-2 shadow-sm">
                        <Users className="h-5 w-5 text-zinc-700" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="font-semibold text-zinc-900">{author.name}</h3>
                        {author.bio && (
                          <p className="text-sm text-zinc-600 line-clamp-3">{author.bio}</p>
                        )}
                        <p className="text-xs font-medium text-zinc-700 pt-1">
                          {author.bookCount || 0} {author.bookCount === 1 ? 'book' : 'books'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((author) => (
                  <Link
                    key={author._id}
                    href={`/student/authors/${encodeURIComponent(author.slug || author._id)}`}
                    className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                  >
                    <div className="rounded-full bg-white p-2 shadow-sm">
                      <Users className="h-5 w-5 text-zinc-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-zinc-900">{author.name}</h3>
                      {author.bio && (
                        <p className="text-sm text-zinc-600 line-clamp-1">{author.bio}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-zinc-700">
                        {author.bookCount || 0} {author.bookCount === 1 ? 'book' : 'books'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

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
