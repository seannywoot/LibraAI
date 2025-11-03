"use client";

import { useEffect, useState, useRef } from "react";
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

export default function MyLibraryPage() {
  const [loading, setLoading] = useState(true);
  const [myBooks, setMyBooks] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState("barcode"); // 'barcode' or 'ocr'
  const [uploading, setUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualBook, setManualBook] = useState({
    title: "",
    author: "",
    isbn: "",
    publisher: "",
    year: "",
  });
  const fileInputRef = useRef(null);

  const navigationLinks = getStudentLinks();

  useEffect(() => {
    loadMyLibrary();
  }, []);

  async function loadMyLibrary() {
    setLoading(true);
    try {
      const res = await fetch("/api/student/library", { cache: "no-store" });
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
              Manage your personal book collection. Upload PDFs, scan barcodes, or add books manually.
            </p>
          </div>
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
        </header>

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

        {/* My Books Grid */}
        <div className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            My Collection ({myBooks.length})
          </h2>

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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myBooks.map((book) => (
                <div
                  key={book._id}
                  className="relative rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => handleRemoveBook(book._id)}
                    className="absolute right-2 top-2 rounded-full p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex gap-3">
                    <div className="w-16 h-20 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      {book.fileType === "application/pdf" ? "PDF" : "Book"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {book.author || "Unknown Author"}
                      </p>
                      {book.isbn && (
                        <p className="text-xs text-gray-500">
                          ISBN: {book.isbn}
                        </p>
                      )}
                      {book.fileType === "application/pdf" && book.fileUrl && (
                        <a
                          href={book.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <BookOpen className="h-3 w-3" />
                          Open PDF
                        </a>
                      )}
                      {book.addedAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Added {new Date(book.addedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
