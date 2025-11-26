"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, BookOpen, Camera, Upload, X, Scan, Bookmark, Archive } from "@/components/icons";
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
    returned: { bg: "bg-green-100", text: "text-green-800", label: "Returned" },
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
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const initialTab = tabParam === "borrowed" ? "borrowed" : tabParam === "bookmarked" ? "bookmarked" : "personal";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [myBooks, setMyBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [archivedBooks, setArchivedBooks] = useState([]);
  const [bookmarkedBooks, setBookmarkedBooks] = useState([]);
  const [totalMyBooks, setTotalMyBooks] = useState(0);
  const [totalBorrowedBooks, setTotalBorrowedBooks] = useState(0);
  const [totalArchivedBooks, setTotalArchivedBooks] = useState(0);
  const [totalBookmarkedBooks, setTotalBookmarkedBooks] = useState(0);
  const [statusFilter, setStatusFilter] = useState("active"); // 'active', 'returned', 'rejected', 'archived'
  const [archiving, setArchiving] = useState(null);
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const shouldCloseOnBlur = useRef(true);
  const justSelectedSuggestion = useRef(false);
  const [showScanner, setShowScanner] = useState(false);
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
    description: "",
    thumbnail: "",
    categories: [],
    tags: [],
  });
  const [bookmarkStatus, setBookmarkStatus] = useState(new Map()); // Map of bookId -> boolean
  const [bookmarking, setBookmarking] = useState(null);
  const [fetchingFromGoogle, setFetchingFromGoogle] = useState(false);
  const fileInputRef = useRef(null);

  const navigationLinks = getStudentLinks();

  // Debounce search input - only search within active tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "personal") {
        loadMyLibrary();
      } else if (activeTab === "borrowed") {
        loadBorrowedBooks();
      } else if (activeTab === "bookmarked") {
        loadBookmarkedBooks();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, activeTab, statusFilter]);

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
  }, [searchInput, activeTab]);

  // Load all counts on initial mount
  useEffect(() => {
    loadAllCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load data for active tab on tab change
  useEffect(() => {
    if (activeTab === "personal") {
      loadMyLibrary();
    } else if (activeTab === "borrowed") {
      setStatusFilter("active"); // Reset filter when switching to borrowed tab
      setSelectedTransactions(new Set()); // Clear selections when switching tabs
      loadBorrowedBooks();
    } else if (activeTab === "bookmarked") {
      loadBookmarkedBooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadAllCounts() {
    // Load all counts in parallel without search filters
    try {
      const [myLibRes, borrowedRes, bookmarkedRes] = await Promise.all([
        fetch("/api/student/library", { cache: "no-store" }),
        fetch("/api/student/books/borrowed", { cache: "no-store" }),
        fetch("/api/student/books/bookmarked", { cache: "no-store" })
      ]);

      const [myLibData, borrowedData, bookmarkedData] = await Promise.all([
        myLibRes.json().catch(() => ({})),
        borrowedRes.json().catch(() => ({})),
        bookmarkedRes.json().catch(() => ({}))
      ]);

      if (myLibRes.ok && myLibData?.ok) {
        setTotalMyBooks(myLibData.books?.length || 0);
        if (activeTab === "personal") {
          setMyBooks(myLibData.books || []);
          setLoading(false);
        }
      }

      if (borrowedRes.ok && borrowedData?.ok) {
        setTotalBorrowedBooks(borrowedData.items?.length || 0);
        if (activeTab === "borrowed") {
          setBorrowedBooks(borrowedData.items || []);
          setLoading(false);
        }
      }

      if (bookmarkedRes.ok && bookmarkedData?.ok) {
        setTotalBookmarkedBooks(bookmarkedData.books?.length || 0);
        if (activeTab === "bookmarked") {
          setBookmarkedBooks(bookmarkedData.books || []);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error("Failed to load counts:", e);
      setLoading(false);
    }
  }

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
    justSelectedSuggestion.current = true;
    setSearchInput(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setSuggestions([]);
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

      // Only update total count when not searching
      if (!searchInput) {
        setTotalMyBooks(data.books?.length || 0);
      }
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
      if (statusFilter && statusFilter !== "active") {
        params.append("status", statusFilter);
      }

      const res = await fetch(`/api/student/books/borrowed?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load borrowed books");

      setBorrowedBooks(data.items || []);

      // Clear selections when data changes
      setSelectedTransactions(new Set());

      // Only update total count when not searching
      if (!searchInput) {
        setTotalBorrowedBooks(data.items?.length || 0);
      }

      // Load bookmark status for borrowed books
      if (data.items && data.items.length > 0) {
        const bookIds = data.items.map(item => item.bookId).filter(Boolean);
        if (bookIds.length > 0) {
          loadBookmarkStatus(bookIds);
        }
      }
    } catch (e) {
      console.error("Failed to load borrowed books:", e);
    }
  }

  async function loadBookmarkedBooks() {
    try {
      const params = new URLSearchParams();
      if (searchInput) params.append("search", searchInput);

      const res = await fetch(`/api/student/books/bookmarked?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load bookmarked books");
      setBookmarkedBooks(data.books || []);

      // Only update total count when not searching
      if (!searchInput) {
        setTotalBookmarkedBooks(data.books?.length || 0);
      }
    } catch (e) {
      console.error("Failed to load bookmarked books:", e);
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

      // Navigate to the book detail page to show recommendations
      if (data.bookId) {
        router.push(`/student/library/${data.bookId}`);
      } else {
        loadMyLibrary();
      }
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
      setManualBook({
        title: "",
        author: "",
        isbn: "",
        publisher: "",
        year: "",
        description: "",
        thumbnail: "",
        categories: [],
        tags: [],
      });
      loadMyLibrary();
    } catch (e) {
      showToast(e?.message || "Failed to add book", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleFetchFromGoogleBooks() {
    // Get current values from the form inputs directly
    const currentIsbn = manualBook.isbn.trim();
    const currentTitle = manualBook.title.trim();

    if (!currentIsbn && !currentTitle) {
      showToast("Please enter ISBN or Title to fetch book details", "error");
      return;
    }

    setFetchingFromGoogle(true);
    try {
      // Build search query - prefer ISBN for accuracy
      let searchQuery = "";
      if (currentIsbn) {
        searchQuery = `isbn:${currentIsbn}`;
      } else {
        searchQuery = `intitle:${encodeURIComponent(currentTitle)}`;
        if (manualBook.author?.trim()) {
          searchQuery += `+inauthor:${encodeURIComponent(manualBook.author.trim())}`;
        }
      }

      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1`,
        {
          cache: 'no-store', // Prevent caching
          headers: {
            'Cache-Control': 'no-cache',
          }
        }
      );
      const googleData = await googleRes.json();

      if (!googleData.items || googleData.items.length === 0) {
        showToast("No book found on Google Books. Try a different ISBN or title.", "info");
        return;
      }

      const volumeInfo = googleData.items[0].volumeInfo;
      const newBookData = { ...manualBook };
      let updated = false;

      // Auto-fill form fields (always overwrite with fetched data)
      if (volumeInfo.title) {
        newBookData.title = volumeInfo.title;
        updated = true;
      }
      if (volumeInfo.authors?.[0]) {
        newBookData.author = volumeInfo.authors[0];
        updated = true;
      }
      if (volumeInfo.publishedDate) {
        newBookData.year = volumeInfo.publishedDate.substring(0, 4);
        updated = true;
      }
      if (volumeInfo.publisher) {
        newBookData.publisher = volumeInfo.publisher;
        updated = true;
      }
      if (volumeInfo.industryIdentifiers?.[0]?.identifier) {
        const extractedIsbn = volumeInfo.industryIdentifiers[0].identifier.replace(/[^\d]/g, "");
        if (extractedIsbn.length === 13) {
          newBookData.isbn = extractedIsbn;
          updated = true;
        }
      }
      if (volumeInfo.description) {
        newBookData.description = volumeInfo.description;
        updated = true;
      }
      if (volumeInfo.imageLinks?.thumbnail) {
        newBookData.thumbnail = volumeInfo.imageLinks.thumbnail;
        updated = true;
      }

      // Extract categories
      if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
        const categories = volumeInfo.categories.flatMap(cat =>
          cat.split('/').map(c => c.trim())
        ).filter(c => c.length > 0);
        newBookData.categories = [...new Set(categories)];
        updated = true;
      }

      // Extract tags (subjects)
      if (volumeInfo.subjects && Array.isArray(volumeInfo.subjects)) {
        const tags = volumeInfo.subjects.map(s => s.trim()).filter(s => s.length > 0);
        newBookData.tags = [...new Set(tags)];
        updated = true;
      }

      if (updated) {
        setManualBook(newBookData);
        showToast("Book details fetched from Google Books!", "success");
      }
    } catch (err) {
      console.error("Failed to fetch from Google Books:", err);
      showToast("Failed to fetch book details from Google Books", "error");
    } finally {
      setFetchingFromGoogle(false);
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

  async function handleArchive(transactionId) {
    if (!confirm("Archive this transaction? You can view it later in the Archived filter.")) return;

    setArchiving(transactionId);
    try {
      const res = await fetch("/api/student/books/archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to archive transaction");

      showToast("Transaction archived", "success");
      loadBorrowedBooks();
    } catch (e) {
      showToast(e?.message || "Failed to archive transaction", "error");
    } finally {
      setArchiving(null);
    }
  }

  async function handleBulkArchive() {
    // Use selected transactions if any are selected, otherwise use all archivable
    const transactionsToArchive = selectedTransactions.size > 0
      ? borrowedBooks.filter((t) => selectedTransactions.has(t._id))
      : borrowedBooks.filter(
        (t) => ["returned", "rejected"].includes(t.status) && !t.archived
      );

    if (transactionsToArchive.length === 0) {
      showToast("No transactions to archive", "info");
      return;
    }

    const message = selectedTransactions.size > 0
      ? `Archive ${transactionsToArchive.length} selected transaction(s)?`
      : `Archive all ${transactionsToArchive.length} transaction(s)?`;

    if (!confirm(`${message} You can view them later in the Archived filter.`)) return;

    setBulkArchiving(true);
    try {
      const results = await Promise.allSettled(
        transactionsToArchive.map((transaction) =>
          fetch("/api/student/books/archive", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ transactionId: transaction._id }),
          })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - successful;

      if (successful > 0) {
        showToast(`${successful} transaction(s) archived successfully`, "success");
      }
      if (failed > 0) {
        showToast(`${failed} transaction(s) failed to archive`, "error");
      }

      setSelectedTransactions(new Set());
      loadBorrowedBooks();
    } catch (e) {
      showToast(e?.message || "Failed to archive transactions", "error");
    } finally {
      setBulkArchiving(false);
    }
  }

  function handleToggleSelection(transactionId) {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  }

  function handleToggleSelectAll() {
    const archivableTransactions = borrowedBooks.filter(
      (t) => ["returned", "rejected"].includes(t.status) && !t.archived
    );

    if (selectedTransactions.size === archivableTransactions.length) {
      // Deselect all
      setSelectedTransactions(new Set());
    } else {
      // Select all archivable
      setSelectedTransactions(new Set(archivableTransactions.map(t => t._id)));
    }
  }

  async function loadBookmarkStatus(bookIds) {
    if (!bookIds || bookIds.length === 0) return;

    try {
      const bookmarkChecks = await Promise.all(
        bookIds.map(async (bookId) => {
          const res = await fetch(`/api/student/books/bookmark?bookId=${bookId}`, {
            cache: "no-store",
          });
          const data = await res.json().catch(() => ({}));
          return { bookId, bookmarked: data?.bookmarked || false };
        })
      );

      const newStatus = new Map();
      bookmarkChecks.forEach(({ bookId, bookmarked }) => {
        newStatus.set(bookId, bookmarked);
      });
      setBookmarkStatus(newStatus);
    } catch (e) {
      console.error("Failed to load bookmark status:", e);
    }
  }

  async function handleToggleBookmark(bookId, e) {
    e.preventDefault();
    e.stopPropagation();

    setBookmarking(bookId);
    try {
      const res = await fetch("/api/student/books/bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(data?.error || "Failed to toggle bookmark");

      const newStatus = new Map(bookmarkStatus);
      newStatus.set(bookId, data.bookmarked);
      setBookmarkStatus(newStatus);

      showToast(data.message, "success");

      // Reload bookmarked books if we're on that tab
      if (activeTab === "bookmarked") {
        loadBookmarkedBooks();
      }
    } catch (e) {
      showToast(e?.message || "Failed to toggle bookmark", "error");
    } finally {
      setBookmarking(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px]">
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
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 sm:px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Upload PDF"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">{uploading ? "Uploading..." : "Upload PDF"}</span>
              </button>
              <button
                onClick={() => setShowScanner(true)}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 sm:px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Scan Barcode"
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
              <button
                onClick={() => setShowManualForm(true)}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-3 sm:px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                title="Add Manually"
              >
                <BookIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add Manually</span>
              </button>
            </div>
          )}
        </header>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("personal")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "personal"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Personal Collection ({totalMyBooks})
          </button>
          <button
            onClick={() => setActiveTab("borrowed")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "borrowed"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Borrowed Books ({totalBorrowedBooks})
          </button>
          <button
            onClick={() => setActiveTab("bookmarked")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "bookmarked"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Bookmarked ({totalBookmarkedBooks})
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
            placeholder="Search by title, author, ISBN..."
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
          accept="application/pdf"
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

              <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <p>
                  Enter an ISBN or Title and click <strong>Fetch Details</strong> to automatically fill in the book information.
                </p>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-4">
                {/* Cover Image Preview */}
                {manualBook.thumbnail && (
                  <div className="flex justify-center mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={manualBook.thumbnail}
                      alt="Book Cover"
                      className="h-32 w-auto object-cover rounded shadow-sm"
                    />
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
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
                  <button
                    type="button"
                    onClick={handleFetchFromGoogleBooks}
                    disabled={fetchingFromGoogle}
                    className="mb-[1px] rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {fetchingFromGoogle ? "Fetching..." : "Fetch Details"}
                  </button>
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

                {/* Hidden fields for extended data */}
                {manualBook.categories.length > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Categories:</span> {manualBook.categories.join(", ")}
                  </div>
                )}

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
          </div >
        )
        }


        {/* Scanner Modal */}
        {
          showScanner && (
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

                <BarcodeScanner
                  onDetected={handleBarcodeDetected}
                  onError={(err) => showToast(err, "error")}
                />
              </div>
            </div>
          )
        }

        {/* Tab Content */}
        {
          activeTab === "bookmarked" ? (
            /* Bookmarked Books */
            <div className="space-y-4">
              {/* View Controls */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Bookmarked Books ({bookmarkedBooks.length})
                </h2>
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
              </div>

              <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
                {loading ? (
                  <div className="text-center py-12 text-gray-600">
                    Loading bookmarked books...
                  </div>
                ) : bookmarkedBooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="rounded-full bg-gray-100 p-4 text-gray-400">
                      <Bookmark className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      No bookmarked books
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md">
                      Bookmark books from the catalog to save them for later.
                    </p>
                  </div>
                ) : viewMode === "list" ? (
                  <div className="space-y-4">
                    {bookmarkedBooks.map((book) => (
                      <Link
                        key={book._id}
                        href={`/student/books/${encodeURIComponent(book.slug || book._id)}?from=library&tab=bookmarked`}
                        className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow cursor-pointer block"
                      >
                        <div className="flex gap-6">
                          {/* Book Cover */}
                          <div className="w-24 h-32 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium overflow-hidden">
                            {book.coverImage || book.coverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={book.coverImage || book.coverImageUrl}
                                alt={`Cover of ${book.title}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">Book Cover</span>';
                                }}
                              />
                            ) : (
                              <span>Book Cover</span>
                            )}
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                              {book.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {book.author}
                            </p>

                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                              {book.isbn && <span>ISBN: {book.isbn}</span>}
                              {book.bookmarkedAt && (
                                <span>Bookmarked {new Date(book.bookmarkedAt).toLocaleDateString()}</span>
                              )}
                            </div>

                            {book.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {book.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                    {bookmarkedBooks.map((book) => (
                      <Link
                        key={book._id}
                        href={`/student/books/${encodeURIComponent(book.slug || book._id)}?from=library&tab=bookmarked`}
                        className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                      >
                        {/* Book Cover */}
                        <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium mb-2 overflow-hidden">
                          {book.coverImage || book.coverImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.coverImage || book.coverImageUrl}
                              alt={`Cover of ${book.title}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">Book Cover</span>';
                              }}
                            />
                          ) : (
                            <span>Book Cover</span>
                          )}
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2 h-10">
                            {book.title}
                          </h3>
                          <p className="text-xs text-gray-600 mb-1 line-clamp-1 h-4">
                            {book.author}
                          </p>
                          <div className="text-xs text-gray-500 mb-2 h-4">
                            {book.isbn && <span>ISBN: {book.isbn}</span>}
                          </div>

                          {/* Bookmark Date */}
                          <div className="mt-auto">
                            <div className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2 text-[11px] font-medium text-gray-500 text-center">
                              Bookmarked {new Date(book.bookmarkedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "personal" ? (
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
                            <div className="w-20 h-28 md:w-24 md:h-32 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium overflow-hidden">
                              {book.thumbnail ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={book.thumbnail}
                                  alt={`Cover of ${book.title}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">No Cover</span>';
                                  }}
                                />
                              ) : (
                                <span>No Cover</span>
                              )}
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
                                <span className="text-xs text-gray-400">
                                  {book.fileType === "application/pdf" && book.fileUrl ? "Click to read PDF" : "View details"}
                                </span>
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
                          className="flex h-full flex-col rounded-lg p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40"
                        >
                          {/* Book Cover */}
                          <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium mb-2 overflow-hidden">
                            {book.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={book.thumbnail}
                                alt={`Cover of ${book.title}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">No Cover</span>';
                                }}
                              />
                            ) : (
                              <span>No Cover</span>
                            )}
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2 h-10">
                              {book.title}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-1 h-4">
                              {book.author || "Unknown Author"}
                            </p>
                            <div className="text-xs text-gray-500 mb-2 h-4">
                              {book.isbn && <span>ISBN: {book.isbn}</span>}
                            </div>

                            {/* Action Button */}
                            <div className="mt-auto space-y-2">
                              {book.fileType === "application/pdf" && book.fileUrl ? (
                                <div className="w-full rounded-md bg-black px-4 py-2 text-xs font-medium text-white text-center">
                                  Read PDF
                                </div>
                              ) : (
                                <div className="w-full rounded-md bg-gray-100 border border-gray-200 px-4 py-2 text-[11px] font-medium text-gray-500 text-center">
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
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Borrowed Books ({borrowedBooks.length})
                  </h2>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setSearchInput("");
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="returned">Returned</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  {/* Select All Checkbox - only show for returned/rejected filters */}
                  {(statusFilter === "returned" || statusFilter === "rejected") && borrowedBooks.filter(t => ["returned", "rejected"].includes(t.status) && !t.archived).length > 0 && (
                    <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size > 0 && selectedTransactions.size === borrowedBooks.filter(t => ["returned", "rejected"].includes(t.status) && !t.archived).length}
                        onChange={handleToggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      Select All
                    </label>
                  )}
                  {/* Bulk Archive Button - only show for returned/rejected filters */}
                  {(statusFilter === "returned" || statusFilter === "rejected") && (
                    <button
                      onClick={handleBulkArchive}
                      disabled={bulkArchiving || borrowedBooks.filter(t => ["returned", "rejected"].includes(t.status) && !t.archived).length === 0}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Archive className="h-4 w-4" />
                      {bulkArchiving ? "Archiving..." : selectedTransactions.size > 0 ? `Archive Selected (${selectedTransactions.size})` : "Archive All"}
                    </button>
                  )}
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
                </div>
              </div>

              <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
                {loading ? (
                  <div className="text-center py-12 text-gray-600">
                    Loading transactions...
                  </div>
                ) : borrowedBooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <div className="rounded-full bg-gray-100 p-4 text-gray-400">
                      {statusFilter === "archived" ? <Archive className="h-8 w-8" /> : <BookOpen className="h-8 w-8" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {statusFilter === "active" && "No active borrowed books"}
                      {statusFilter === "returned" && "No returned books"}
                      {statusFilter === "rejected" && "No rejected requests"}
                      {statusFilter === "archived" && "No archived transactions"}
                    </h3>
                    <p className="text-sm text-gray-600 max-w-md">
                      {statusFilter === "active" && "You haven't borrowed any books yet. Browse the catalog to get started."}
                      {statusFilter === "returned" && "Your returned books will appear here."}
                      {statusFilter === "rejected" && "Your rejected borrow requests will appear here."}
                      {statusFilter === "archived" && "Archived transactions will appear here."}
                    </p>
                  </div>
                ) : viewMode === "list" ? (
                  <div className="space-y-4">
                    {borrowedBooks.map((transaction) => {
                      const borrowDate = transaction.borrowedAt || transaction.requestedAt;
                      const returnDate = transaction.returnedAt;
                      const isReturned = transaction.status === "returned";
                      return (
                        <Link
                          key={transaction._id}
                          href={`/student/books/${encodeURIComponent(transaction.bookSlug || transaction.bookId)}?from=library&tab=borrowed`}
                          className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col relative"
                        >
                          {/* Selection Checkbox - only for returned/rejected */}
                          {canArchive && (
                            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
                              <input
                                type="checkbox"
                                checked={selectedTransactions.has(transaction._id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelection(transaction._id);
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                              />
                            </div>
                          )}
                          {/* Book Cover */}
                          <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium mb-2 overflow-hidden">
                            {transaction.bookCoverImage || transaction.bookThumbnail || transaction.bookCoverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={transaction.bookCoverImage || transaction.bookThumbnail || transaction.bookCoverImageUrl}
                                alt={`Cover of ${transaction.bookTitle}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">Book Cover</span>';
                                }}
                              />
                            ) : (
                              <span>Book Cover</span>
                            )}
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2 h-10">
                              {transaction.bookTitle}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-1 h-4">
                              {transaction.bookAuthor}
                            </p>

                            {/* Status Badge */}
                            <div className="mb-2 h-6 flex items-center">
                              <StatusBadge status={transaction.status} />
                            </div>

                            {/* Dates */}
                            <div className="text-[11px] text-gray-500 space-y-1 mb-3">
                              {borrowDate && <p>Borrowed: {formatDate(borrowDate)}</p>}
                              {isReturned && returnDate && <p>Returned: {formatDate(returnDate)}</p>}
                            </div>

                            {/* Bookmark Button */}
                            <div className="mt-auto space-y-2" onClick={(e) => e.preventDefault()}>
                              <button
                                onClick={(e) => handleToggleBookmark(transaction.bookId, e)}
                                disabled={bookmarking === transaction.bookId}
                                className={`w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors ${bookmarkStatus.get(transaction.bookId)
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  } disabled:opacity-50`}
                              >
                                <Bookmark className={`h-3.5 w-3.5 ${bookmarkStatus.get(transaction.bookId) ? "fill-current" : ""}`} />
                                {bookmarkStatus.get(transaction.bookId) ? "Bookmarked" : "Bookmark"}
                              </button>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
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
                      const borrowDate = transaction.borrowedAt || transaction.requestedAt;
                      const dueDate = transaction.dueDate || transaction.requestedDueDate;
                      const returnDate = transaction.returnedAt;
                      const overdue = transaction.status === "borrowed" ? isOverdue(dueDate) : false;
                      const canReturn = transaction.status === "borrowed";
                      const canArchive = ["returned", "rejected"].includes(transaction.status) && !transaction.archived;
                      const isArchived = transaction.archived === true;

                      return (
                        <Link
                          key={transaction._id}
                          href={`/student/books/${encodeURIComponent(transaction.bookSlug || transaction.bookId)}?from=library&tab=borrowed`}
                          className={`block rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer relative ${overdue ? "border-rose-200 bg-rose-50" : isArchived ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white"
                            }`}
                        >
                          {/* Selection Checkbox - only for returned/rejected */}
                          {canArchive && (
                            <div className="absolute top-4 right-4 z-10" onClick={(e) => e.preventDefault()}>
                              <input
                                type="checkbox"
                                checked={selectedTransactions.has(transaction._id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelection(transaction._id);
                                }}
                                className="h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                              />
                            </div>
                          )}
                          <div className="flex gap-6">
                            {/* Book Cover */}
                            <div className="w-24 h-32 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium overflow-hidden">
                              {transaction.bookCoverImage || transaction.bookThumbnail || transaction.bookCoverImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={transaction.bookCoverImage || transaction.bookThumbnail || transaction.bookCoverImageUrl}
                                  alt={`Cover of ${transaction.bookTitle}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">Book Cover</span>';
                                  }}
                                />
                              ) : (
                                <span>Book Cover</span>
                              )}
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
                                {borrowDate && <span>{transaction.status === "pending-approval" ? "Requested" : "Borrowed"}: {formatDate(borrowDate)}</span>}
                                {dueDate && statusFilter === "active" && (
                                  <>
                                    <span>|</span>
                                    <span className={overdue ? "font-semibold text-rose-700" : ""}>
                                      Due: {formatDate(dueDate)}
                                      {overdue && " (Overdue)"}
                                    </span>
                                  </>
                                )}
                                {returnDate && transaction.status === "returned" && (
                                  <>
                                    <span>|</span>
                                    <span>Returned: {formatDate(returnDate)}</span>
                                  </>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between">
                                <div></div>
                                <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
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
                                  ) : transaction.status === "pending-approval" ? (
                                    <span className="text-sm font-medium text-gray-500">
                                      Pending approval
                                    </span>
                                  ) : null}

                                  {/* Archive Button */}
                                  {canArchive && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleArchive(transaction._id);
                                      }}
                                      disabled={archiving === transaction._id}
                                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                      {archiving === transaction._id ? "Archiving..." : "Archive"}
                                    </button>
                                  )}

                                  {/* Bookmark Button */}
                                  <button
                                    onClick={(e) => handleToggleBookmark(transaction.bookId, e)}
                                    disabled={bookmarking === transaction.bookId}
                                    className={`p-2 rounded-full transition-colors ${bookmarkStatus.get(transaction.bookId)
                                      ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                      : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                      } disabled:opacity-50`}
                                    title={bookmarkStatus.get(transaction.bookId) ? "Remove bookmark" : "Bookmark this book"}
                                  >
                                    <Bookmark className={`h-4 w-4 ${bookmarkStatus.get(transaction.bookId) ? "fill-current" : ""}`} />
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
                    {borrowedBooks.map((transaction) => {
                      const borrowDate = transaction.borrowedAt || transaction.requestedAt;
                      const dueDate = transaction.dueDate || transaction.requestedDueDate;
                      const returnDate = transaction.returnedAt;
                      const overdue = transaction.status === "borrowed" ? isOverdue(dueDate) : false;
                      const canReturn = transaction.status === "borrowed";
                      const canArchive = ["returned", "rejected"].includes(transaction.status) && !transaction.archived;
                      const isArchived = transaction.archived === true;

                      return (
                        <Link
                          key={transaction._id}
                          href={`/student/books/${encodeURIComponent(transaction.bookSlug || transaction.bookId)}?from=library&tab=borrowed`}
                          className={`rounded-lg border p-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col ${overdue ? "border-rose-200 bg-rose-50" : isArchived ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white"
                            }`}
                        >
                          {/* Book Cover */}
                          <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium mb-2 overflow-hidden">
                            {transaction.bookCoverImage || transaction.bookThumbnail || transaction.bookCoverImageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={transaction.bookCoverImage || transaction.bookThumbnail || transaction.bookCoverImageUrl}
                                alt={`Cover of ${transaction.bookTitle}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs font-medium">Book Cover</span>';
                                }}
                              />
                            ) : (
                              <span>Book Cover</span>
                            )}
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 flex flex-col">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2 h-10">
                              {transaction.bookTitle}
                            </h3>
                            <p className="text-xs text-gray-600 mb-1 line-clamp-1 h-4">
                              {transaction.bookAuthor}
                            </p>

                            {/* Status Badge */}
                            <div className="mb-2 h-6 flex items-center gap-1 flex-wrap">
                              <StatusBadge status={transaction.status} />
                            </div>

                            {/* Dates */}
                            <div className="text-[11px] text-gray-500 space-y-1 mb-3">
                              {borrowDate && <p>{transaction.status === "pending-approval" ? "Requested" : "Borrowed"}: {formatDate(borrowDate)}</p>}
                              {dueDate && statusFilter === "active" && (
                                <p className={overdue ? "font-semibold text-rose-700" : ""}>
                                  Due: {formatDate(dueDate)}
                                  {overdue && " (Overdue)"}
                                </p>
                              )}
                              {returnDate && transaction.status === "returned" && (
                                <p>Returned: {formatDate(returnDate)}</p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-auto space-y-2" onClick={(e) => e.preventDefault()}>
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
                                <div className="w-full rounded-md bg-amber-100 border border-amber-200 px-4 py-2 text-xs font-medium text-amber-700 text-center">
                                  Awaiting confirmation
                                </div>
                              ) : transaction.status === "rejected" ? (
                                <div className="w-full rounded-md bg-rose-100 border border-rose-200 px-4 py-2 text-xs font-medium text-rose-700 text-center">
                                  Request rejected
                                </div>
                              ) : transaction.status === "pending-approval" ? (
                                <div className="w-full rounded-md bg-sky-100 border border-sky-200 px-4 py-2 text-xs font-medium text-sky-700 text-center">
                                  Pending approval
                                </div>
                              ) : null}

                              {/* Archive Button */}
                              {canArchive && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleArchive(transaction._id);
                                  }}
                                  disabled={archiving === transaction._id}
                                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                  {archiving === transaction._id ? "Archiving..." : "Archive"}
                                </button>
                              )}

                              {/* Bookmark Button */}
                              <button
                                onClick={(e) => handleToggleBookmark(transaction.bookId, e)}
                                disabled={bookmarking === transaction.bookId}
                                className={`w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-medium transition-colors ${bookmarkStatus.get(transaction.bookId)
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  } disabled:opacity-50`}
                              >
                                <Bookmark className={`h-3.5 w-3.5 ${bookmarkStatus.get(transaction.bookId) ? "fill-current" : ""}`} />
                                {bookmarkStatus.get(transaction.bookId) ? "Bookmarked" : "Bookmark"}
                              </button>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        }
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
