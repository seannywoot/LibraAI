"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, BookOpen, Camera, Upload, X, Scan } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import dynamic from "next/dynamic";

// Dynamically import barcode scanner to avoid SSR issues
const BarcodeScanner = dynamic(() => import("@/components/barcode-scanner"), {
  ssr: false,
});

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

function MyLibraryContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "borrowed" ? "borrowed" : "personal";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [myBooks, setMyBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState("barcode"); // 'barcode' or 'ocr'
  const [uploading, setUploading] = useState(false);
  const [returning, setReturning] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // 'list' or 'grid'
  const [manualBook, setManualBook] = useState({
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    year: "",
  });
  const fileInputRef = useRef(null);

  const navigationLinks = getStudentLinks();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMyLibrary();
      loadBorrowedBooks();
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
  }, [searchInput, activeTab]);

  useEffect(() => {
    loadMyLibrary();
    loadBorrowedBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        `/api/student/library/suggestions?q=${encodeURIComponent(searchInput)}&tab=${activeTab}`,
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

  async function loadMyLibrary() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchInput) params.append("search", searchInput);
      
      const res = await fetch(`/api/student/library?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to load library");
      setMyBooks(data.books || []);
    } catch (e) {
      showToast(e?.message || "Failed to load library", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadBorrowedBooks() {
    try {
      const params = new URLSearchParams();
      if (searchInput) params.append("search", searchInput);
      
      const res = await fetch(`/api/student/books/borrowed?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load borrowed books");
      setBorrowedBooks(data.items || []);
    } catch (e) {
      console.error("Failed to load borrowed books:", e);
    }
  }

  async function handleBarcodeDetected(isbn) {
    setShowScanner(false);
    setUploading(true);
    try {
      const res = await fetch("/api/student/library/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isbn, method: "barcode" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to add book");

      showToast("Book added to your library!", "success");
      loadMyLibrary();
    } catch (e) {
      showToast(e?.message || "Failed to add book", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", file.type);

      const res = await fetch("/api/student/library/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to upload file");

      showToast(
        file.type === "application/pdf"
          ? "PDF uploaded successfully!"
          : "Book added to your library!",
        "success"
      );
      loadMyLibrary();
    } catch (e) {
      showToast(e?.message || "Failed to upload file", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveBook(bookId) {
    if (!confirm("Remove this book from your library?")) return;

    try {
      const res = await fetch(`/api/student/library/${bookId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to remove book");

      showToast("Book removed from library", "success");
      loadMyLibrary();
    } catch (e) {
      showToast(e?.message || "Failed to remove book", "error");
    }
  }

  async function handleManualAdd(e) {
    e.preventDefault();
    if (!manualBook.title.trim()) {
      showToast("Title is required", "error");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/student/library/manual", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(manualBook),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to add book");

      showToast("Book added to your library!", "success");
      setShowManualForm(false);
      setManualBook({ title: "", author: "", isbn: "", publisher: "", year: "" });
      loadMyLibrary();
    } catch (e) {
      showToast(e?.message || "Failed to add book", "error");
    } finally {
      setUploading(false);
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
            <h1 className="text-4xl font-bold text-gray-900">My Library</h1>
            <p className="text-sm text-gray-600">
              Manage your personal book collection and borrowed books from the catalog.
            </p>
          </div>
          {activeTab === "personal" && (
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload PDF/Image"}
              </button>
              <button
                onClick={() => setShowScanner(true)}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
                Scan Barcode
              </button>
              <button
                onClick={() => setShowManualForm(true)}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <BookIcon className="h-4 w-4" />
                Add Manually
              </button>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "personal"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Personal Collection ({myBooks.length})
          </button>
          <button
            onClick={() => setActiveTab("borrowed")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "borrowed"
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Borrowed Books ({borrowedBooks.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Auto-suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                    idx === selectedSuggestionIndex
                      ? "bg-gray-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {suggestion.type === "title" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    )}
                  </svg>
                  <span className="text-sm text-gray-900 truncate">{suggestion.text}</span>
                  <span className="ml-auto text-xs text-gray-400 capitalize">{suggestion.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Manual Add Modal */}
        {showManualForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <button
                onClick={() => setShowManualForm(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Add Book Manually
              </h2>

              <form onSubmit={handleManualAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={manualBook.title}
                    onChange={(e) =>
                      setManualBook({ ...manualBook, title: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={manualBook.author}
                    onChange={(e) =>
                      setManualBook({ ...manualBook, author: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={manualBook.isbn}
                    onChange={(e) =>
                      setManualBook({ ...manualBook, isbn: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={manualBook.publisher}
                      onChange={(e) =>
                        setManualBook({
                          ...manualBook,
                          publisher: e.target.value,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={manualBook.year}
                      onChange={(e) =>
                        setManualBook({ ...manualBook, year: e.target.value })
                      }
                      placeholder="2024"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? "Adding..." : "Add Book"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <button
                onClick={() => setShowScanner(false)}
                className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Scan Book Barcode
              </h2>

              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setScannerMode("barcode")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scannerMode === "barcode"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Barcode Scanner
                </button>
                <button
                  onClick={() => setScannerMode("ocr")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scannerMode === "ocr"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  OCR Scanner
                </button>
              </div>

              <BarcodeScanner
                mode={scannerMode}
                onDetected={handleBarcodeDetected}
                onError={(err) => showToast(err, "error")}
              />
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "personal" ? (
          /* Personal Collection */
          <div className="space-y-4">
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Personal Collection ({myBooks.length})
              </h2>
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

            <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">

              {loading ? (
                <div className="text-center py-12 text-gray-600">
                  Loading your library...
                </div>
              ) : myBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="rounded-full bg-gray-100 p-4 text-gray-400">
                    <BookIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No books yet
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    Start building your library by uploading PDFs, scanning barcodes, or adding books manually.
                  </p>
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-4">
                  {myBooks.map((book) => (
                    <div
                      key={book._id}
                      className="relative rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveBook(book._id);
                        }}
                        className="absolute right-4 top-4 z-10 rounded-full p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <Link
                        href={`/student/library/${book._id}`}
                        className="block rounded-lg p-5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40"
                      >
                        <div className="flex gap-5">
                          {/* Book Cover */}
                          <div className="w-20 h-28 md:w-24 md:h-32 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                            {book.fileType === "application/pdf" ? "PDF" : "Book"}
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                              {book.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {book.author || "Unknown Author"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                              {book.isbn && <span>ISBN: {book.isbn}</span>}
                              {book.addedAt && (
                                <span>Added {new Date(book.addedAt).toLocaleDateString()}</span>
                              )}
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">View details</span>
                              {book.fileType === "application/pdf" && book.fileUrl ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.open(book.fileUrl, "_blank", "noopener,noreferrer");
                                  }}
                                  className="rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                                >
                                  Open PDF
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {myBooks.map((book) => (
                    <div
                      key={book._id}
                      className="relative rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveBook(book._id);
                        }}
                        className="absolute right-2 top-2 z-10 rounded-full p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors shadow-sm"
                      >
                        <X className="h-4 w-4" />
                      </button>

                      <Link
                        href={`/student/library/${book._id}`}
                        className="flex h-full flex-col gap-2 rounded-lg p-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40"
                      >
                        {/* Book Cover */}
                        <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                          {book.fileType === "application/pdf" ? "PDF" : "Book"}
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {book.author || "Unknown Author"}
                          </p>
                          {book.isbn && (
                            <p className="text-xs text-gray-500">
                              ISBN: {book.isbn}
                            </p>
                          )}

                          {/* Action Button */}
                          <div className="mt-auto pt-2">
                            {book.fileType === "application/pdf" && book.fileUrl ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(book.fileUrl, "_blank", "noopener,noreferrer");
                                }}
                                className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                              >
                                Open PDF
                              </button>
                            ) : (
                              <div className="text-[11px] text-gray-400 text-center">
                                Added {new Date(book.addedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Borrowed Books */
          <div className="space-y-4">
            {/* View Controls */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Borrowed Books ({borrowedBooks.length})
              </h2>
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

            <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
              {loading ? (
                <div className="text-center py-12 text-gray-600">
                  Loading borrowed books...
                </div>
              ) : borrowedBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                  <div className="rounded-full bg-gray-100 p-4 text-gray-400">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No borrowed books
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    You haven&apos;t borrowed any books yet. Browse the catalog to get started.
                  </p>
                </div>
              ) : viewMode === "list" ? (
                <div className="space-y-4">
                  {borrowedBooks.map((transaction) => {
                    const borrowDate = transaction.status === "borrowed" ? transaction.borrowedAt : transaction.requestedAt;
                    const dueDate = transaction.status === "borrowed" ? transaction.dueDate : transaction.requestedDueDate;
                    const overdue = transaction.status === "borrowed" ? isOverdue(dueDate) : false;
                    const canReturn = transaction.status === "borrowed";
                    return (
                      <Link
                        key={transaction._id}
                        href={`/student/books/${transaction.bookId}?from=library&tab=borrowed`}
                        className={`rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer ${
                          overdue ? "border-rose-200 bg-rose-50" : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex gap-6">
                          {/* Book Cover */}
                          <div className="w-24 h-32 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
                            Book Cover
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                              {transaction.bookTitle}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {transaction.bookAuthor}
                            </p>

                            <div className="flex items-center gap-3 mb-3">
                              <StatusBadge status={transaction.status} />
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                              <span>{transaction.status === "pending-approval" ? "Requested" : "Borrowed"}: {formatDate(borrowDate)}</span>
                              <span>|</span>
                              <span className={overdue ? "font-semibold text-rose-700" : ""}>
                                Due: {formatDate(dueDate)}
                                {overdue && " (Overdue)"}
                              </span>
                            </div>

                            {/* Action Button */}
                            <div className="flex items-center justify-between">
                              <div></div>
                              <div onClick={(e) => e.preventDefault()}>
                                {canReturn ? (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleReturn(transaction.bookId);
                                    }}
                                    disabled={returning === transaction.bookId}
                                    className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                  >
                                    {returning === transaction.bookId ? "Submitting..." : "Request Return"}
                                  </button>
                                ) : transaction.status === "return-requested" ? (
                                  <span className="text-sm font-medium text-gray-500">
                                    Awaiting confirmation
                                  </span>
                                ) : transaction.status === "rejected" ? (
                                  <span className="text-sm font-medium text-rose-600">
                                    Request rejected
                                  </span>
                                ) : (
                                  <span className="text-sm font-medium text-gray-500">
                                    Pending approval
                                  </span>
                                )}
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
                  {borrowedBooks.map((transaction) => {
                  const borrowDate = transaction.status === "borrowed" ? transaction.borrowedAt : transaction.requestedAt;
                  const dueDate = transaction.status === "borrowed" ? transaction.dueDate : transaction.requestedDueDate;
                  const overdue = transaction.status === "borrowed" ? isOverdue(dueDate) : false;
                  const canReturn = transaction.status === "borrowed";
                  return (
                    <Link
                      key={transaction._id}
                      href={`/student/books/${transaction.bookId}?from=library&tab=borrowed`}
                      className={`rounded-lg border p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col ${
                        overdue ? "border-rose-200 bg-rose-50" : "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Book Cover */}
                      <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium mb-2">
                        Book Cover
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">
                          {transaction.bookTitle}
                        </h3>
                        <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                          {transaction.bookAuthor}
                        </p>

                        {/* Status Badge */}
                        <div className="mb-2">
                          <StatusBadge status={transaction.status} />
                        </div>

                        {/* Dates */}
                        <div className="text-[11px] text-gray-500 space-y-1 mb-3">
                          <p>{transaction.status === "pending-approval" ? "Requested" : "Borrowed"}: {formatDate(borrowDate)}</p>
                          <p className={overdue ? "font-semibold text-rose-700" : ""}>
                            Due: {formatDate(dueDate)}
                            {overdue && " (Overdue)"}
                          </p>
                        </div>

                        {/* Action Button */}
                        <div className="mt-auto" onClick={(e) => e.preventDefault()}>
                          {canReturn ? (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleReturn(transaction.bookId);
                              }}
                              disabled={returning === transaction.bookId}
                              className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {returning === transaction.bookId ? "Submitting..." : "Request Return"}
                            </button>
                          ) : transaction.status === "return-requested" ? (
                            <span className="block text-center text-xs font-medium text-gray-500">
                              Awaiting confirmation
                            </span>
                          ) : transaction.status === "rejected" ? (
                            <span className="block text-center text-xs font-medium text-rose-600">
                              Request rejected
                            </span>
                          ) : (
                            <span className="block text-center text-xs font-medium text-gray-500">
                              Pending approval
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MyLibraryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <MyLibraryContent />
    </Suspense>
  );
}
