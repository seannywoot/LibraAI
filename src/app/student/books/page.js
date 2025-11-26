"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, BookOpen, Bookmark } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import { getBehaviorTracker } from "@/lib/behavior-tracker";
import RecommendationsSidebar from "@/components/recommendations-sidebar";
import BorrowConfirmButton from "@/components/borrow-confirm-button";

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
    damaged: {
      bg: "bg-rose-100",
      text: "text-rose-800",
      dot: "bg-rose-500",
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

function formatBookFormat(format) {
  if (!format) return null;

  const formatLower = format.toLowerCase();
  if (formatLower === 'hardcover' || formatLower === 'paperback') {
    return `Physical, ${format}`;
  }
  return format;
}

export default function StudentBooksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [borrowing, setBorrowing] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    resourceTypes: ["Books"],
    yearRange: [null, null],
    availability: [],
    formats: [],
    categories: [],
  });
  const [tempFilters, setTempFilters] = useState({
    resourceTypes: ["Books"],
    yearRange: [null, null],
    availability: [],
    formats: [],
    categories: [],
  });
  const [yearInputs, setYearInputs] = useState({ from: "", to: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const justSelectedSuggestion = useRef(false);
  const [recommendationsKey, setRecommendationsKey] = useState(0);
  const [bookmarkedBooks, setBookmarkedBooks] = useState(new Set());
  const [bookmarking, setBookmarking] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const navigationLinks = getStudentLinks();
  const tracker = getBehaviorTracker();

  // Initialize state from URL parameters or sessionStorage on mount
  useEffect(() => {
    if (isInitialized) return;

    // FORCE CLEAR old sessionStorage with year range values
    // This ensures clean state for all users
    const savedState = sessionStorage.getItem('catalogState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // If it has any year range values, clear it completely
        if (parsed?.filters?.yearRange &&
          (parsed.filters.yearRange[0] !== null || parsed.filters.yearRange[1] !== null)) {
          console.log('Clearing old catalog state with year range values');
          sessionStorage.removeItem('catalogState');
        }
      } catch (e) {
        console.error('Failed to parse saved catalog state:', e);
        sessionStorage.removeItem('catalogState');
      }
    }

    // Now try to restore from sessionStorage (should be clean now)
    const cleanState = sessionStorage.getItem('catalogState');
    let initialState = null;

    if (cleanState) {
      try {
        initialState = JSON.parse(cleanState);
      } catch (e) {
        console.error('Failed to parse saved catalog state:', e);
        sessionStorage.removeItem('catalogState');
      }
    }

    // If we have saved state, use it; otherwise use URL params or defaults
    if (initialState) {
      setSearchInput(initialState.searchInput || "");
      setSortBy(initialState.sortBy || "relevance");
      setPage(initialState.page || 1);
      setFilters(initialState.filters || {
        resourceTypes: ["Books"],
        yearRange: [null, null],
        availability: [],
        formats: [],
        categories: [],
      });
      setTempFilters(initialState.filters || {
        resourceTypes: ["Books"],
        yearRange: [null, null],
        availability: [],
        formats: [],
        categories: [],
      });
      setYearInputs({
        from: initialState.filters?.yearRange?.[0] !== null && initialState.filters?.yearRange?.[0] !== undefined
          ? initialState.filters.yearRange[0].toString()
          : "",
        to: initialState.filters?.yearRange?.[1] !== null && initialState.filters?.yearRange?.[1] !== undefined
          ? initialState.filters.yearRange[1].toString()
          : "",
      });
      setViewMode(initialState.viewMode || "grid");
    } else {
      // Fall back to URL params
      const urlSearch = searchParams.get("search") || "";
      const urlSortBy = searchParams.get("sortBy") || "relevance";
      const urlPage = parseInt(searchParams.get("page") || "1", 10);
      const urlResourceTypes = searchParams.get("resourceTypes")?.split(",").filter(Boolean) || ["Books"];
      const urlFormats = searchParams.get("formats")?.split(",").filter(Boolean) || [];
      const urlCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];
      const urlAvailability = searchParams.get("availability")?.split(",").filter(Boolean) || [];
      const urlYearMinStr = searchParams.get("yearMin");
      const urlYearMaxStr = searchParams.get("yearMax");
      const urlYearMin = urlYearMinStr ? parseInt(urlYearMinStr, 10) : null;
      const urlYearMax = urlYearMaxStr ? parseInt(urlYearMaxStr, 10) : null;

      setSearchInput(urlSearch);
      setSortBy(urlSortBy);
      setPage(urlPage);
      const initialFilters = {
        resourceTypes: urlResourceTypes,
        yearRange: [urlYearMin, urlYearMax],
        availability: urlAvailability,
        formats: urlFormats,
        categories: urlCategories,
      };
      setFilters(initialFilters);
      setTempFilters(initialFilters);
      setYearInputs({
        from: urlYearMin !== null ? urlYearMin.toString() : "",
        to: urlYearMax !== null ? urlYearMax.toString() : "",
      });
    }

    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL and sessionStorage when filters/search/sort change
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();

    if (searchInput) params.set("search", searchInput);
    if (sortBy !== "relevance") params.set("sortBy", sortBy);
    if (page !== 1) params.set("page", page.toString());
    // Only include resourceTypes if not default (Books only)
    if (filters.resourceTypes.length !== 1 || filters.resourceTypes[0] !== "Books") {
      params.set("resourceTypes", filters.resourceTypes.join(","));
    }
    if (filters.formats.length > 0) params.set("formats", filters.formats.join(","));
    if (filters.categories.length > 0) params.set("categories", filters.categories.join(","));
    if (filters.availability.length > 0) params.set("availability", filters.availability.join(","));
    if (filters.yearRange[0] !== null) params.set("yearMin", filters.yearRange[0].toString());
    if (filters.yearRange[1] !== null) params.set("yearMax", filters.yearRange[1].toString());

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Update URL without triggering a navigation
    window.history.replaceState({}, "", newUrl);

    // Save state to sessionStorage for persistence across navigation
    const stateToSave = {
      searchInput,
      sortBy,
      page,
      filters,
      viewMode,
    };
    sessionStorage.setItem('catalogState', JSON.stringify(stateToSave));
  }, [searchInput, sortBy, page, filters, viewMode, isInitialized]);

  // Cleanup tracker on unmount
  useEffect(() => {
    return () => {
      tracker.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh bookmark status when page becomes visible (e.g., returning from bookmarks page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && items.length > 0) {
        // Refresh bookmark status when page becomes visible
        loadBookmarkStatus(items.map((b) => b._id));
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

  }, [items]);

  // Clear sessionStorage when navigating away (except for back/forward navigation)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Keep the state in sessionStorage even on page refresh
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      setPage(1);
      loadBooks();

      // Track search event if there's a query
      if (searchInput.trim()) {
        tracker.trackSearch(searchInput, {
          formats: filters.formats,
          categories: filters.categories,
          yearRange: filters.yearRange,
          availability: filters.availability,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, isInitialized]);

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
    if (!isInitialized) return;

    loadBooks();
    loadCategories();

    // Track filter changes as search events
    if (
      filters.formats.length > 0 ||
      filters.availability.length > 0 ||
      filters.categories.length > 0
    ) {
      tracker.trackSearch(searchInput || "filtered search", {
        formats: filters.formats,
        categories: filters.categories,
        yearRange: filters.yearRange,
        availability: filters.availability,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, filters, isInitialized]);

  async function loadCategories() {
    try {
      const res = await fetch("/api/student/books/categories", {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setAvailableCategories(data.categories || []);
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
      // Fallback to default categories if API fails
      setAvailableCategories([
        "Fiction",
        "Non-Fiction",
        "Science",
        "Technology",
        "History",
        "Biography",
        "Self-Help",
        "Business",
        "Arts",
        "Education",
        "Children",
        "Young Adult",
      ]);
    }
  }

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
      // Only send resourceTypes if it's not the default (Books only) or if it's empty
      // If only "Books" is selected, don't send the parameter (books don't have resourceType field in DB)
      if (filters.resourceTypes.length > 0 &&
        !(filters.resourceTypes.length === 1 && filters.resourceTypes[0] === "Books")) {
        params.append("resourceTypes", filters.resourceTypes.join(","));
      }
      if (filters.formats.length > 0) {
        params.append("formats", filters.formats.join(","));
      }
      if (filters.categories.length > 0) {
        params.append("categories", filters.categories.join(","));
      }
      // Only send year range if values are set
      if (filters.yearRange[0] !== null) {
        params.append("yearMin", filters.yearRange[0].toString());
      }
      if (filters.yearRange[1] !== null) {
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

      const items = Array.isArray(data.items) ? data.items : [];
      setItems(items);
      setTotal(data.total || 0);

      // Load bookmark status for all books
      loadBookmarkStatus(items.map((b) => b._id));
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadBookmarkStatus(bookIds) {
    if (!bookIds || bookIds.length === 0) return;

    try {
      // Use bulk API to check all bookmarks at once
      const res = await fetch("/api/student/books/bookmarks/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookIds }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        // Update bookmarked set with the results
        const newBookmarked = new Set();
        Object.keys(data.bookmarks || {}).forEach((bookId) => {
          if (data.bookmarks[bookId]) {
            newBookmarked.add(bookId);
          }
        });
        setBookmarkedBooks(newBookmarked);
      }
    } catch (e) {
      console.error("Failed to load bookmark status:", e);
    }
  }

  async function handleToggleBookmark(bookId, e) {
    e.preventDefault();
    e.stopPropagation();

    // Optimistically update UI immediately
    const wasBookmarked = bookmarkedBooks.has(bookId);
    const newBookmarked = new Set(bookmarkedBooks);
    if (wasBookmarked) {
      newBookmarked.delete(bookId);
    } else {
      newBookmarked.add(bookId);
    }
    setBookmarkedBooks(newBookmarked);

    setBookmarking(bookId);
    try {
      const res = await fetch("/api/student/books/bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        // Revert optimistic update on error
        const revertBookmarked = new Set(bookmarkedBooks);
        if (wasBookmarked) {
          revertBookmarked.add(bookId);
        } else {
          revertBookmarked.delete(bookId);
        }
        setBookmarkedBooks(revertBookmarked);
        throw new Error(data?.error || "Failed to toggle bookmark");
      }

      // Confirm the state matches the server response
      const confirmedBookmarked = new Set(bookmarkedBooks);
      if (data.bookmarked) {
        confirmedBookmarked.add(bookId);
      } else {
        confirmedBookmarked.delete(bookId);
      }
      setBookmarkedBooks(confirmedBookmarked);

      showToast(data.message, "success");
    } catch (e) {
      showToast(e?.message || "Failed to toggle bookmark", "error");
    } finally {
      setBookmarking(null);
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
    justSelectedSuggestion.current = true;
    setSearchInput(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setSuggestions([]);
    setPage(1);
  }

  function handleApplyFilters() {
    setFilters(tempFilters);
    setPage(1);
    setShowFilters(false);
  }

  function handleClearFilters() {
    const defaultFilters = {
      resourceTypes: ["Books"],
      yearRange: [null, null],
      availability: [],
      formats: [],
      categories: [],
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setYearInputs({ from: "", to: "" });
    setPage(1);
  }

  function handleCancelFilters() {
    setTempFilters(filters);
    setYearInputs({
      from: filters.yearRange[0] !== null ? filters.yearRange[0].toString() : "",
      to: filters.yearRange[1] !== null ? filters.yearRange[1].toString() : ""
    });
    setShowFilters(false);
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
            loadBooks();
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
      loadBooks();
    }
  }

  function toggleResourceType(type) {
    setTempFilters((prev) => ({
      ...prev,
      resourceTypes: prev.resourceTypes.includes(type)
        ? prev.resourceTypes.filter((t) => t !== type)
        : [...prev.resourceTypes, type],
    }));
  }

  function toggleAvailability(status) {
    setTempFilters((prev) => ({
      ...prev,
      availability: prev.availability.includes(status)
        ? prev.availability.filter((a) => a !== status)
        : [...prev.availability, status],
    }));
  }

  function toggleFormat(format) {
    setTempFilters((prev) => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter((f) => f !== format)
        : [...prev.formats, format],
    }));
  }

  function toggleCategory(category) {
    setTempFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
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
    <div className="h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px] flex flex-col overflow-hidden">
      <ToastContainer />
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="flex flex-col gap-6 flex-1 min-h-0">
        {/* Header */}
        <header className="flex items-end justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              STUDENT
            </p>
            <h1 className="text-4xl font-bold text-gray-900">Catalog</h1>
            <p className="text-sm text-gray-600">
              Explore available books and borrow them for your studies.
            </p>
          </div>
          <Link
            href="/student/library"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            My Library
          </Link>
        </header>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Filters Modal */}
          {showFilters && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Resource Type */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Resource Type
                      </h3>
                      <div className="space-y-2">
                        {["Books", "Articles", "Journals", "Theses"].map((label) => (
                          <label
                            key={label}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={tempFilters.resourceTypes.includes(label)}
                              onChange={() => toggleResourceType(label)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Format */}
                    <div>
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
                              checked={tempFilters.formats.includes(format)}
                              onChange={() => toggleFormat(format)}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {format}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Availability
                      </h3>
                      <div className="space-y-2">
                        {["Available", "Checked Out", "Reserved"].map(
                          (status) => (
                            <label
                              key={status}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tempFilters.availability.includes(status)}
                                onChange={() => toggleAvailability(status)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {status}
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>

                    {/* Publication Year */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Publication Year
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">
                            From
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Any year"
                            maxLength={4}
                            value={yearInputs.from}
                            onChange={(e) => {
                              const value = e.target.value;
                              const currentYear = new Date().getFullYear();

                              // Allow empty string or valid numbers up to 4 digits
                              if (value === "") {
                                setYearInputs((prev) => ({ ...prev, from: "" }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [null, prev.yearRange[1]],
                                }));
                              } else if (/^\d+$/.test(value) && value.length <= 4) {
                                const numValue = parseInt(value);

                                // Prevent typing future years
                                if (numValue > currentYear) {
                                  return; // Don't update if trying to type future year
                                }

                                setYearInputs((prev) => ({ ...prev, from: value }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [numValue, prev.yearRange[1]],
                                }));
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === "") {
                                // Allow empty - no minimum year
                                setYearInputs((prev) => ({ ...prev, from: "" }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [null, prev.yearRange[1]],
                                }));
                              } else {
                                const numValue = parseInt(value);
                                const currentYear = new Date().getFullYear();

                                // Validate: must be a valid year, not exceed current year, and not exceed "to" year
                                let clampedValue = Math.min(numValue, currentYear);

                                // Don't exceed "to" year if set
                                if (tempFilters.yearRange[1] !== null && clampedValue > tempFilters.yearRange[1]) {
                                  clampedValue = tempFilters.yearRange[1];
                                }

                                setYearInputs((prev) => ({ ...prev, from: clampedValue.toString() }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [clampedValue, prev.yearRange[1]],
                                }));
                              }
                            }}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                        <span className="text-gray-400 mt-6">—</span>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">
                            To
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder={`Max ${new Date().getFullYear()}`}
                            maxLength={4}
                            value={yearInputs.to}
                            onChange={(e) => {
                              const value = e.target.value;
                              const currentYear = new Date().getFullYear();

                              // Allow empty string or valid numbers up to 4 digits
                              if (value === "") {
                                setYearInputs((prev) => ({ ...prev, to: "" }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [prev.yearRange[0], null],
                                }));
                              } else if (/^\d+$/.test(value) && value.length <= 4) {
                                const numValue = parseInt(value);

                                // Prevent typing future years
                                if (numValue > currentYear) {
                                  return; // Don't update if trying to type future year
                                }

                                setYearInputs((prev) => ({ ...prev, to: value }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [prev.yearRange[0], numValue],
                                }));
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value === "") {
                                // Allow empty - no maximum year
                                setYearInputs((prev) => ({ ...prev, to: "" }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [prev.yearRange[0], null],
                                }));
                              } else {
                                const numValue = parseInt(value);
                                const currentYear = new Date().getFullYear();

                                // Validate: must not exceed current year and must not be less than "from" year
                                let clampedValue = Math.min(numValue, currentYear);

                                // Don't go below "from" year if set
                                if (tempFilters.yearRange[0] !== null && clampedValue < tempFilters.yearRange[0]) {
                                  clampedValue = tempFilters.yearRange[0];
                                }

                                setYearInputs((prev) => ({ ...prev, to: clampedValue.toString() }));
                                setTempFilters((prev) => ({
                                  ...prev,
                                  yearRange: [prev.yearRange[0], clampedValue],
                                }));
                              }
                            }}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Leave empty to search all years
                      </p>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Category
                      </h3>
                      {availableCategories.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                          {[...availableCategories].sort((a, b) => a.localeCompare(b)).map((category) => (
                            <label
                              key={category}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tempFilters.categories.includes(category)}
                                onChange={() => toggleCategory(category)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {category}
                              </span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Loading categories...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                  >
                    Clear All Filters
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCancelFilters}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-6 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )

          }

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Sticky Controls */}
            <div className="shrink-0 space-y-6 mb-6">
              {/* Search Bar */}
              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
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
                      placeholder="Search by title, author, year, ISBN..."
                      className="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput("");
                          setSuggestions([]);
                          setShowSuggestions(false);
                          setSelectedSuggestionIndex(-1);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={loadBooks}
                    className="p-2.5 rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                    title="Search"
                  >
                    <svg
                      className="h-5 w-5"
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
                  </button>
                  <button
                    onClick={() => setShowFilters(true)}
                    className="relative p-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Filters"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    {(filters.formats.length > 0 ||
                      filters.categories.length > 0 ||
                      filters.availability.length > 0) && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-black rounded-full">
                          {filters.formats.length +
                            filters.categories.length +
                            filters.availability.length}
                        </span>
                      )}
                  </button>

                  {/* Auto-suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && searchInput.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${idx === selectedSuggestionIndex
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                            }`}
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
              </div >

              {/* Results Header */}
              < div className="flex items-center justify-between" >
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
                    className={`p-1.5 rounded ${viewMode === "grid"
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
                    className={`p-1.5 rounded ${viewMode === "list"
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
              </div >
            </div >

            {/* Scrollable Books List */}
            < div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400" >
              {/* Books List */}
              {
                loading ? (
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
                      No matches found
                    </h2>
                    <p className="text-sm text-gray-600">
                      {searchInput
                        ? "Try adjusting your search terms or filters."
                        : "Try adjusting your filters or check back later for new additions."}
                    </p>
                  </div>
                ) : viewMode === "list" ? (
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
                          className="block rounded-lg bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex gap-6">
                            {/* Book Cover */}
                            <div className="w-24 h-32 shrink-0 rounded bg-gray-100 flex flex-col items-center justify-center text-gray-400 text-xs font-medium overflow-hidden">
                              {book.coverImage || book.coverImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={book.coverImage || book.coverImageUrl}
                                  alt={`Cover of ${book.title}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentElement;
                                    parent.innerHTML = '<svg class="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span class="text-xs text-gray-400">No Cover</span>';
                                  }}
                                />
                              ) : (
                                <>
                                  <BookOpen className="w-8 h-8 mb-1" />
                                  <span>No Cover</span>
                                </>
                              )}
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
                                    <span className="font-medium">
                                      {formatBookFormat(book.format)}
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Description */}
                              {book.description && (
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                  {book.description}
                                </p>
                              )}

                              {/* Status and Actions */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <StatusChip status={book.status} />
                                  {book.isbn && (
                                    <span className="text-sm text-gray-500">
                                      ISBN: {book.isbn}
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
                                  {book.format === "eBook" && book.ebookUrl ? (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        // Check if ebookUrl is a PDF ID (MongoDB ObjectId format) or external URL
                                        const isPdfId = /^[a-f\d]{24}$/i.test(
                                          book.ebookUrl
                                        );
                                        const url = isPdfId
                                          ? `/api/ebooks/${book.ebookUrl}`
                                          : book.ebookUrl;
                                        window.open(
                                          url,
                                          "_blank",
                                          "noopener,noreferrer"
                                        );
                                      }}
                                      className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                    >
                                      Access
                                    </button>
                                  ) : book.status === "available" &&
                                    !["reference-only", "staff-only"].includes(
                                      book.loanPolicy || ""
                                    ) ? (
                                    <BorrowConfirmButton
                                      onConfirm={() => handleBorrow(book._id)}
                                      disabled={lockedByOther}
                                      busy={isBorrowingThis}
                                      className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                      borrowLabel="Borrow"
                                      confirmingLabel="Confirm?"
                                      confirmingTitle="Submit Borrow Request"
                                      confirmingMessage={`Send a borrow request for "${book.title}"?`}
                                      confirmButtonLabel="Submit Request"
                                      busyLabel="Borrowing..."
                                    />
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

                                  {/* Bookmark Button */}
                                  <button
                                    onClick={(e) =>
                                      handleToggleBookmark(book._id, e)
                                    }
                                    disabled={isBookmarkingThis}
                                    className={`p-2 rounded-full transition-colors ${isBookmarked
                                      ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                      } disabled:opacity-50`}
                                    title={
                                      isBookmarked
                                        ? "Remove bookmark"
                                        : "Bookmark this book"
                                    }
                                  >
                                    <Bookmark
                                      className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""
                                        }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {items.map((book) => {
                      const isBorrowingThis = borrowing === book._id;
                      const lockedByOther = Boolean(borrowing) && !isBorrowingThis;
                      const isBookmarked = bookmarkedBooks.has(book._id);
                      const isBookmarkingThis = bookmarking === book._id;
                      return (
                        <div
                          key={book._id}
                          className="relative rounded-lg bg-white border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                        >
                          {/* Bookmark Button */}
                          <button
                            onClick={(e) => handleToggleBookmark(book._id, e)}
                            disabled={isBookmarkingThis}
                            className={`absolute right-2 top-2 z-10 p-1.5 rounded-full transition-colors ${isBookmarked
                              ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                              } disabled:opacity-50`}
                            title={
                              isBookmarked
                                ? "Remove bookmark"
                                : "Bookmark this book"
                            }
                          >
                            <Bookmark
                              className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""
                                }`}
                            />
                          </button>

                          <Link
                            href={`/student/books/${encodeURIComponent(book.slug || book._id)}`}
                            className="flex flex-col h-full cursor-pointer"
                          >
                            {/* Book Cover */}
                            <div className="w-full aspect-2/3 rounded bg-gray-100 flex flex-col items-center justify-center text-gray-400 text-[10px] font-medium mb-2 overflow-hidden">
                              {book.coverImage || book.coverImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={book.coverImage || book.coverImageUrl}
                                  alt={`Cover of ${book.title}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentElement;
                                    parent.innerHTML = '<svg class="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg><span class="text-[10px] text-gray-400">No Cover</span>';
                                  }}
                                />
                              ) : (
                                <>
                                  <BookOpen className="w-6 h-6 mb-1" />
                                  <span>No Cover</span>
                                </>
                              )}
                            </div>

                            {/* Book Details */}
                            <div className="flex-1 flex flex-col">
                              <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2 h-10">
                                {book.title}
                              </h3>
                              <p className="text-[11px] text-gray-600 mb-1 line-clamp-1 h-4">
                                {book.author}
                              </p>
                              <div className="text-[11px] text-gray-500 mb-2 h-4">
                                {book.year && <span>{book.year}</span>}
                              </div>

                              {/* Status */}
                              <div className="mb-2">
                                <StatusChip status={book.status} />
                              </div>

                              {/* Action Buttons */}
                              <div
                                className="mt-auto space-y-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                {book.format === "eBook" && book.ebookUrl ? (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Check if ebookUrl is a PDF ID (MongoDB ObjectId format) or external URL
                                      const isPdfId = /^[a-f\d]{24}$/i.test(
                                        book.ebookUrl
                                      );
                                      const url = isPdfId
                                        ? `/api/ebooks/${book.ebookUrl}`
                                        : book.ebookUrl;
                                      window.open(
                                        url,
                                        "_blank",
                                        "noopener,noreferrer"
                                      );
                                    }}
                                    className="block w-full text-center rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                                  >
                                    Access
                                  </button>
                                ) : book.status === "available" &&
                                  !["reference-only", "staff-only"].includes(
                                    book.loanPolicy || ""
                                  ) ? (
                                  <BorrowConfirmButton
                                    onConfirm={() => handleBorrow(book._id)}
                                    disabled={lockedByOther}
                                    busy={isBorrowingThis}
                                    className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                    wrapperClassName="w-full"
                                    borrowLabel="Borrow"
                                    confirmingLabel="Confirm?"
                                    confirmingTitle="Submit Borrow Request"
                                    confirmingMessage={`Send a borrow request for "${book.title}"?`}
                                    confirmButtonLabel="Submit Request"
                                    busyLabel="Borrowing..."
                                  />
                                ) : book.status === "reserved" &&
                                  book.reservedForCurrentUser ? (
                                  <div className="w-full rounded-md bg-sky-100 border border-sky-200 px-4 py-2 text-xs font-medium text-sky-700 text-center">
                                    Awaiting approval
                                  </div>
                                ) : book.status === "reserved" ? (
                                  <div className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 text-center">
                                    Reserved
                                  </div>
                                ) : book.status === "checked-out" ? (
                                  <div className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 text-center">
                                    Unavailable
                                  </div>
                                ) : book.loanPolicy === "reference-only" ? (
                                  <div className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 text-center">
                                    Reference only
                                  </div>
                                ) : book.loanPolicy === "staff-only" ? (
                                  <div className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 text-center">
                                    Staff only
                                  </div>
                                ) : null}

                                {/* Bookmark Button */}
                                <button
                                  onClick={(e) => handleToggleBookmark(book._id, e)}
                                  disabled={isBookmarkingThis}
                                  className={`w-full flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-medium transition-colors border ${isBookmarked
                                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                                    } disabled:opacity-50`}
                                  title={
                                    isBookmarked
                                      ? "Remove bookmark"
                                      : "Bookmark this book"
                                  }
                                >
                                  <Bookmark
                                    className={`h-3 w-3 ${isBookmarked ? "fill-current" : ""
                                      }`}
                                  />
                                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                                </button>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )
              }

              {/* Pagination */}
              {
                !loading && !error && items.length > 0 && (
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
                          className={`min-w-10 h-10 rounded text-sm font-medium transition-colors ${page === pageNum
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
                          className={`min-w-10 h-10 rounded text-sm font-medium transition-colors ${page === totalPages
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
                )
              }
            </div >
          </div >

          {/* Recommendations Sidebar */}
          < RecommendationsSidebar
            className="hidden lg:block"
            key={recommendationsKey}
            maxItems={8}
            context={searchInput ? "search" : "browse"}
            onRefresh={() => {
              setRecommendationsKey((prev) => prev + 1);
              loadBooks();
            }
            }
          />
        </div >
      </main >
    </div >
  );
}
