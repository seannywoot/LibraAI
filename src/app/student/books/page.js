"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, BookOpen } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import { getBehaviorTracker } from "@/lib/behavior-tracker";
import RecommendationsSidebar from "@/components/recommendations-sidebar";

function StatusChip({ status }) {
  const map = {
    available: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
    },
    "checked-out": {
      bg: "bg-amber-100",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    reserved: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
    maintenance: {
      bg: "bg-zinc-200",
      text: "text-zinc-800",
      dot: "bg-zinc-500",
    },
    lost: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  };
  const c = map[status] || map.available;
  const label = (status || "available")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}
    >
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
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    resourceTypes: ["Books"],
    yearRange: [1950, 2025],
    subjects: ["Computer Science"],
    availability: [],
    formats: [],
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [recommendationsKey, setRecommendationsKey] = useState(0);

  const navigationLinks = getStudentLinks();
  const tracker = getBehaviorTracker();

  // Cleanup tracker on unmount
  useEffect(() => {
    return () => {
      tracker.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadBooks();
      
      // Track search event if there's a query
      if (searchInput.trim()) {
        tracker.trackSearch(searchInput, {
          formats: filters.formats,
          yearRange: filters.yearRange,
          availability: filters.availability
        });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    loadBooks();
    
    // Track filter changes as search events
    if (filters.formats.length > 0 || filters.availability.length > 0) {
      tracker.trackSearch(searchInput || "filtered search", {
        formats: filters.formats,
        yearRange: filters.yearRange,
        availability: filters.availability
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, filters]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: sortBy,
      });
      if (searchInput) params.append("search", searchInput);
      
      // Add filter parameters
      if (filters.formats.length > 0) {
        params.append("formats", filters.formats.join(","));
      }
      if (filters.yearRange) {
        params.append("yearMin", filters.yearRange[0].toString());
        params.append("yearMax", filters.yearRange[1].toString());
      }
      if (filters.availability.length > 0) {
        params.append("availability", filters.availability.join(","));
      }
      
      const res = await fetch(`/api/student/books?${params}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to load books");
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
        `/api/student/books/suggestions?q=${encodeURIComponent(searchInput)}`,
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
    setSearchInput(suggestion.text);
    setShowSuggestions(false);
    setPage(1);
  }

  function toggleResourceType(type) {
    setFilters((prev) => ({
      ...prev,
      resourceTypes: prev.resourceTypes.includes(type)
        ? prev.resourceTypes.filter((t) => t !== type)
        : [...prev.resourceTypes, type],
    }));
  }

  function toggleSubject(subject) {
    setFilters((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  }

  function toggleAvailability(status) {
    setFilters((prev) => ({
      ...prev,
      availability: prev.availability.includes(status)
        ? prev.availability.filter((a) => a !== status)
        : [...prev.availability, status],
    }));
  }

  function toggleFormat(format) {
    setFilters((prev) => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter((f) => f !== format)
        : [...prev.formats, format],
    }));
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
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to borrow book");

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
    <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
      <ToastContainer />
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-6">
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              STUDENT
            </p>
            <h1 className="text-4xl font-bold text-gray-900">Browse Books</h1>
            <p className="text-sm text-gray-600">
              Explore available books and borrow them for your studies.
            </p>
          </div>
          <Link
            href="/student/borrowed"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            My Books
          </Link>
        </header>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-56 shrink-0 space-y-6">
            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Filters
              </h2>

              {/* Resource Type */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Resource Type
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Books", count: total },
                    { label: "Articles", count: 0 },
                    { label: "Journals", count: 0 },
                    { label: "Theses", count: 0 },
                  ].map(({ label, count }) => (
                    <label
                      key={label}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.resourceTypes.includes(label)}
                        onChange={() => toggleResourceType(label)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {label} ({count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Format
                </h3>
                <div className="space-y-2">
                  {["Physical", "eBook"].map((format) => (
                    <label
                      key={format}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.formats.includes(format)}
                        onChange={() => toggleFormat(format)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{format}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Publication Year */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Publication Year
                </h3>
                <input
                  type="range"
                  min="1950"
                  max="2025"
                  value={filters.yearRange[1]}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      yearRange: [prev.yearRange[0], parseInt(e.target.value)],
                    }))
                  }
                  className="w-full h-2 bg-blue-500 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1950</span>
                  <span>2025</span>
                </div>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Subject
                </h3>
                <div className="space-y-2">
                  {[
                    "Computer Science",
                    "Mathematics",
                    "Engineering",
                    "Data Science",
                  ].map((subject) => (
                    <label
                      key={subject}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.subjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Availability
                </h3>
                <div className="space-y-2">
                  {["Available", "Checked Out", "Reserved"].map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.availability.includes(status)}
                        onChange={() => toggleAvailability(status)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setPage(1);
                  loadBooks();
                }}
                className="w-full rounded-lg bg-black text-white py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Search Bar */}
            <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search books by title, author, ISBN, or publisher..."
                  className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-24 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
                <button
                  onClick={loadBooks}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-black px-6 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                  Search
                </button>
                
                {/* Auto-suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                      >
                        <svg
                          className="h-4 w-4 text-gray-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          {suggestion.type === "title" ? (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          ) : (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          )}
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {suggestion.text}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {suggestion.type}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {searchInput && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{searchInput}</span>
                </div>
              )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {total.toLocaleString()}
                  </span>{" "}
                  results {searchInput && `for "${searchInput}"`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="title">Title</option>
                    <option value="year">Year</option>
                    <option value="author">Author</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-gray-300 p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded ${
                    viewMode === "grid"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded ${
                    viewMode === "list"
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Books List */}
            {loading ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                Loading books…
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
                <div className="rounded-full bg-white p-3 shadow text-gray-500">
                  <BookIcon className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {searchInput ? "No books found" : "No books available"}
                </h2>
                <p className="text-sm text-gray-600">
                  {searchInput
                    ? "Try adjusting your search terms."
                    : "Check back later for new additions to the catalog."}
                </p>
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-4">
                {items.map((book) => (
                  <article
                    key={book._id}
                    className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-6">
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

                          {book.format === "eBook" && book.ebookUrl ? (
                            <a
                              href={book.ebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                            >
                              Access
                            </a>
                          ) : book.status === "available" &&
                            !["reference-only", "staff-only"].includes(
                              book.loanPolicy || ""
                            ) ? (
                            <button
                              onClick={() => handleBorrow(book._id)}
                              disabled={borrowing === book._id}
                              className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {borrowing === book._id
                                ? "Borrowing..."
                                : "Borrow"}
                            </button>
                          ) : book.status === "reserved" &&
                            book.reservedForCurrentUser ? (
                            <span className="text-sm font-medium text-gray-500">
                              Awaiting approval
                            </span>
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
                            <span className="text-sm text-gray-500">
                              Reference only
                            </span>
                          ) : book.loanPolicy === "staff-only" ? (
                            <span className="text-sm text-gray-500">
                              Staff only
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((book) => (
                  <article
                    key={book._id}
                    className="rounded-lg bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Book Cover */}
                    <div className="w-full aspect-[2/3] rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium mb-3">
                      Book Cover
                    </div>

                    {/* Book Details */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                        {book.author}
                      </p>
                      <div className="text-xs text-gray-500 mb-2">
                        {book.year && <span>{book.year}</span>}
                      </div>

                      {/* Status */}
                      <div className="mb-3">
                        <StatusChip status={book.status} />
                      </div>

                      {/* Action Button */}
                      <div className="mt-auto">
                        {book.format === "eBook" && book.ebookUrl ? (
                          <a
                            href={book.ebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                          >
                            Access
                          </a>
                        ) : book.status === "available" &&
                          !["reference-only", "staff-only"].includes(
                            book.loanPolicy || ""
                          ) ? (
                          <button
                            onClick={() => handleBorrow(book._id)}
                            disabled={borrowing === book._id}
                            className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                          >
                            {borrowing === book._id ? "Borrowing..." : "Borrow"}
                          </button>
                        ) : book.status === "reserved" &&
                          book.reservedForCurrentUser ? (
                          <span className="block text-center text-xs font-medium text-gray-500">
                            Awaiting approval
                          </span>
                        ) : book.status === "reserved" ? (
                          <button
                            disabled
                            className="w-full rounded-md bg-gray-300 px-4 py-2 text-xs font-medium text-gray-500 cursor-not-allowed"
                          >
                            Reserved
                          </button>
                        ) : book.status === "checked-out" ? (
                          <button
                            disabled
                            className="w-full rounded-md bg-gray-300 px-4 py-2 text-xs font-medium text-gray-500 cursor-not-allowed"
                          >
                            Unavailable
                          </button>
                        ) : book.loanPolicy === "reference-only" ? (
                          <span className="block text-center text-xs text-gray-500">
                            Reference only
                          </span>
                        ) : book.loanPolicy === "staff-only" ? (
                          <span className="block text-center text-xs text-gray-500">
                            Staff only
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && items.length > 0 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-10 h-10 rounded text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-black text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`min-w-10 h-10 rounded text-sm font-medium transition-colors ${
                        page === totalPages
                          ? "bg-black text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Recommendations Sidebar */}
          <RecommendationsSidebar
            key={recommendationsKey}
            maxItems={8}
            context={searchInput ? "search" : "browse"}
            onRefresh={() => {
              setRecommendationsKey(prev => prev + 1);
              loadBooks();
            }}
          />
        </div>
      </main>
    </div>
  );
}
