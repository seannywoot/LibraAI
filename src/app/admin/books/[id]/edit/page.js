"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import { useRouter, useParams } from "next/navigation";
import UnsavedChangesDialog from "@/components/unsaved-changes-dialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

export default function AdminEditBookPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const identifier = params?.id;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [shelf, setShelf] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [format, setFormat] = useState("");
  const [ebookUrl, setEbookUrl] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  const [loanPolicy, setLoanPolicy] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [shelves, setShelves] = useState([]);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataRef = useRef(null);

  const ALLOWED_STATUS = ["available", "checked-out", "reserved", "maintenance", "lost"];
  const ALLOWED_POLICIES = ["standard", "short-loan", "reference-only", "staff-only"];

  const { showDialog, cancelNavigation, confirmNavigation, navigateTo, navigateBack, handleNavigation } = useUnsavedChanges(hasUnsavedChanges);

  // Track changes on all form fields
  const handleFieldChange = (setter) => (value) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Loading book with identifier:", identifier);
        const [bookRes, shelvesRes, authorsRes] = await Promise.all([
          fetch(`/api/admin/books/${identifier}`, { cache: "no-store" }),
          fetch("/api/admin/shelves?pageSize=100", { cache: "no-store" }),
          fetch("/api/admin/authors?pageSize=100", { cache: "no-store" })
        ]);

        console.log("Book response status:", bookRes.status);
        const bookData = await bookRes.json().catch(() => ({}));
        console.log("Book data:", bookData);

        // Show 404 page if book not found or invalid ID
        if (bookRes.status === 404 || (bookRes.status === 400 && bookData?.error?.includes("Invalid"))) {
          router.push("/404");
          return;
        }

        if (bookRes.ok && bookData?.ok && bookData?.book) {
          const book = bookData.book;
          console.log("Setting book data:", book);
          setTitle(book.title || "");
          setAuthor(book.author || "");
          setYear(book.year ? String(book.year) : "");
          setShelf(book.shelf || "");
          setIsbn(book.isbn || "");
          setPublisher(book.publisher || "");
          setFormat(book.format || "");
          setEbookUrl(book.ebookUrl || "");
          setBarcode(book.barcode || "");
          setCategory(book.category || "");
          setDescription(book.description || "");
          setStatus(book.status || "available");
          setLoanPolicy(book.loanPolicy || "standard");

          // Store initial data for comparison
          initialDataRef.current = {
            title: book.title || "",
            author: book.author || "",
            year: book.year ? String(book.year) : "",
            shelf: book.shelf || "",
            isbn: book.isbn || "",
            publisher: book.publisher || "",
            format: book.format || "",
            ebookUrl: book.ebookUrl || "",
            barcode: book.barcode || "",
            category: book.category || "",
            description: book.description || "",
            status: book.status || "available",
            loanPolicy: book.loanPolicy || "standard"
          };
        } else {
          console.error("Failed to load book:", bookData);
          showToast(bookData?.error || "Failed to load book details", "error");
        }

        const shelvesData = await shelvesRes.json().catch(() => ({}));
        if (shelvesRes.ok && shelvesData?.ok) {
          setShelves(shelvesData.items || []);
        }

        const authorsData = await authorsRes.json().catch(() => ({}));
        if (authorsRes.ok && authorsData?.ok) {
          setAuthors(authorsData.items || []);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
        showToast(e?.message || "Failed to load book details", "error");
      } finally {
        setLoading(false);
        setLoadingShelves(false);
        setLoadingAuthors(false);
      }
    }
    if (identifier) {
      loadData();
    }
  }, [identifier, router]);

  function validateForm() {
    const e = {};
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedShelf = shelf.trim();
    const trimmedIsbn = isbn.trim();
    const trimmedPublisher = publisher.trim();
    const trimmedBarcode = barcode.trim();
    const currentYear = new Date().getFullYear();
    const OLDEST_YEAR = 1450;

    if (!trimmedTitle) e.title = "Title is required";

    if (!trimmedAuthor) {
      e.author = "Author is required";
    } else if (/\d/.test(trimmedAuthor)) {
      e.author = "Author name cannot contain numbers";
    } else if (/[^a-zA-Z\s\-'.&,]/.test(trimmedAuthor)) {
      e.author = "Author name contains invalid characters";
    }

    if (year === "") {
      e.year = "Year is required";
    } else if (!/^\d+$/.test(year)) {
      e.year = "Year must be numeric only";
    } else {
      const yearNum = Number(year);
      if (yearNum < OLDEST_YEAR || yearNum > currentYear) {
        e.year = `Year must be between ${OLDEST_YEAR} and ${currentYear}`;
      }
    }

    if (trimmedIsbn !== "") {
      if (!/^\d{13}$/.test(trimmedIsbn)) {
        e.isbn = "ISBN must be either empty or exactly 13 digits";
      }
    }

    if (trimmedPublisher !== "" && /^\d+$/.test(trimmedPublisher)) {
      e.publisher = "Publisher cannot be only numbers";
    }

    if (trimmedBarcode !== "" && trimmedBarcode.length < 3) {
      e.barcode = "Item ID must be at least 3 characters if provided";
    }

    if (!format) {
      e.format = "Book format/type is required";
    }

    if (!category) {
      e.category = "Book category is required";
    }

    if (format !== "eBook" && !trimmedShelf) {
      e.shelf = "Shelf is required";
    }

    if (!ALLOWED_STATUS.includes(status)) e.status = "Invalid status";
    if (!ALLOWED_POLICIES.includes(loanPolicy)) e.loanPolicy = "Invalid loan policy";

    setErrors(e);
    return { valid: Object.keys(e).length === 0, firstKey: Object.keys(e)[0] };
  }

  function fieldError(name) {
    return errors?.[name] ? (
      <p className="text-xs text-rose-600" role="alert">{errors[name]}</p>
    ) : null;
  }

  const navigationLinks = getAdminLinks();

  async function handlePDFUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setExtractingMetadata(true);

    try {
      // First, upload the PDF file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("bookId", identifier);

      const uploadRes = await fetch("/api/admin/books/upload-pdf", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok || !uploadData?.ok) {
        throw new Error(uploadData?.error || "Failed to upload PDF");
      }

      // Store the PDF ID as the ebookUrl
      setEbookUrl(uploadData.pdfId);

      // Then extract metadata (optional for edit, but can help verify)
      const metadataFormData = new FormData();
      metadataFormData.append("file", file);

      const metadataRes = await fetch("/api/admin/books/extract-pdf-metadata", {
        method: "POST",
        body: metadataFormData,
      });

      const metadataData = await metadataRes.json().catch(() => ({}));

      if (metadataRes.ok && metadataData?.ok && metadataData?.metadata) {
        showToast("PDF uploaded successfully! Metadata extracted for verification.", "success");
      } else {
        showToast("PDF uploaded successfully!", "success");
      }
    } catch (err) {
      console.error("Failed to process PDF:", err);
      showToast(err?.message || "Failed to process PDF", "error");
      setPdfFile(null);
    } finally {
      setExtractingMetadata(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const { valid, firstKey } = validateForm();
    if (!valid) {
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el?.focus) el.focus();
      showToast("Please fix errors in the form", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/books/${identifier}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          year: Number(year),
          shelf,
          isbn,
          publisher,
          format,
          ebookUrl: format === "eBook" ? ebookUrl : undefined,
          barcode,
          category,
          description,
          status,
          loanPolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update book");
      }
      showToast(`Book "${data.book?.title || title}" updated successfully!`, "success");
      setHasUnsavedChanges(false);
      setTimeout(() => navigateTo("/admin/books"), 1500);
    } catch (err) {
      showToast(err?.message || "Failed to update book", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px] text-(--text)">
        <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} onNavigate={handleNavigation} />
        <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
          <p className="text-zinc-600">Loading book details...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-24 pb-20 lg:p-8 lg:pl-[300px] text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} onNavigate={handleNavigation} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-3 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Edit Book</h1>
            <p className="text-sm text-zinc-600">Update bibliographic details for this title.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-6 md:gap-8">
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:p-6">
            <h2 className="text-base font-semibold text-zinc-900">Book details</h2>
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Title <span className="text-rose-600">*</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.title ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="e.g., Deep Learning with Python"
                  aria-invalid={!!errors.title}
                  data-field="title"
                  required
                />
                {fieldError("title")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Author <span className="text-rose-600">*</span>
                </span>
                {loadingAuthors ? (
                  <input
                    className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                    type="text"
                    value="Loading authors..."
                    disabled
                  />
                ) : authors.length > 0 ? (
                  <div className="relative">
                    <select
                      className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"} w-full`}
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      aria-invalid={!!errors.author}
                      data-field="author"
                    >
                      <option value="">Select an author or type custom</option>
                      {authors.map((a) => (
                        <option key={a._id} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2">
                      <input
                        className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"} w-full`}
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Or type custom author name"
                        aria-invalid={!!errors.author}
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"}`}
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g., François Chollet"
                    aria-invalid={!!errors.author}
                    data-field="author"
                  />
                )}
                {fieldError("author")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Year <span className="text-rose-600">*</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.year ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={year}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numeric input
                    if (value === '' || /^\d{0,4}$/.test(value)) {
                      handleFieldChange(setYear)(value);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value) {
                      const yearNum = parseInt(value, 10);
                      const currentYear = new Date().getFullYear();
                      if (yearNum > currentYear) {
                        setErrors(prev => ({ ...prev, year: `Year cannot be in the future (max: ${currentYear})` }));
                      } else if (yearNum < 1450) {
                        setErrors(prev => ({ ...prev, year: 'Year must be 1450 or later' }));
                      } else {
                        setErrors(prev => {
                          const { year, ...rest } = prev;
                          return rest;
                        });
                      }
                    }
                  }}
                  placeholder={String(new Date().getFullYear())}
                  aria-invalid={!!errors.year}
                  data-field="year"
                  required
                />
                {fieldError("year")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Shelf {format !== "eBook" && <span className="text-rose-600">*</span>}
                  {format === "eBook" && <span className="text-zinc-500"> (not applicable for eBooks)</span>}
                </span>
                {loadingShelves ? (
                  <input
                    className="rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3 text-zinc-500"
                    type="text"
                    value="Loading shelves..."
                    disabled
                  />
                ) : shelves.length > 0 ? (
                  <select
                    className={`rounded-xl border px-4 py-3 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    aria-invalid={!!errors.shelf}
                    data-field="shelf"
                    disabled={format === "eBook"}
                  >
                    <option value="">Select a shelf{format === "eBook" ? " (N/A)" : ""}</option>
                    {shelves.map((s) => (
                      <option key={s._id} value={s.code}>
                        {s.code}{s.name ? ` - ${s.name}` : ""}{s.location ? ` (${s.location})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className={`rounded-xl border px-4 py-3 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
                    type="text"
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value)}
                    placeholder={format === "eBook" ? "N/A for eBooks" : "e.g., A3"}
                    aria-invalid={!!errors.shelf}
                    data-field="shelf"
                    disabled={format === "eBook"}
                  />
                )}
                {fieldError("shelf")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  ISBN / Identifier <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.isbn ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  inputMode="numeric"
                  value={isbn}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    handleFieldChange(setIsbn)(value);
                  }}
                  placeholder="e.g., 9781492032649 (13 digits)"
                  aria-invalid={!!errors.isbn}
                  data-field="isbn"
                />
                {fieldError("isbn")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Publisher <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.publisher ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g., O'Reilly Media"
                  aria-invalid={!!errors.publisher}
                  data-field="publisher"
                />
                {fieldError("publisher")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Format / Type <span className="text-rose-600">*</span>
                </span>
                <select
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.format ? "border-rose-400" : "border-zinc-200"}`}
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  aria-invalid={!!errors.format}
                  data-field="format"
                >
                  <option value="">Select format (required)</option>
                  <option value="Physical Book">Physical Book</option>
                  <option value="eBook">eBook</option>
                  <option value="Journal">Journal</option>
                  <option value="Reference">Reference</option>
                  <option value="Thesis">Thesis</option>
                </select>
                {fieldError("format")}
              </label>
              {format === "eBook" && (
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className="text-zinc-700">eBook File (PDF only)</span>
                  <input
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200"
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={extractingMetadata}
                    onChange={handlePDFUpload}
                  />
                  {extractingMetadata && (
                    <p className="text-xs text-blue-600">Uploading and processing PDF...</p>
                  )}
                  {ebookUrl && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>PDF uploaded successfully</span>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">
                    Upload a new PDF to replace the current eBook file. The PDF will be stored securely and accessible to students.
                  </p>
                </label>
              )}
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Barcode / Item ID <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.barcode ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g., BC-000123"
                  aria-invalid={!!errors.barcode}
                  data-field="barcode"
                />
                {fieldError("barcode")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Category <span className="text-rose-600">*</span>
                </span>
                <select
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.category ? "border-rose-400" : "border-zinc-200"}`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-invalid={!!errors.category}
                  data-field="category"
                >
                  <option value="">Select category (required)</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science">Science</option>
                  <option value="Technology">Technology</option>
                  <option value="History">History</option>
                  <option value="Biography">Biography</option>
                  <option value="Self-Help">Self-Help</option>
                  <option value="Business">Business</option>
                  <option value="Arts">Arts</option>
                  <option value="Education">Education</option>
                  <option value="Children">Children</option>
                  <option value="Young Adult">Young Adult</option>
                </select>
                {fieldError("category")}
              </label>
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Description <span className="text-zinc-500">(optional but recommended)</span>
                </span>
                <textarea
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 min-h-[120px] resize-y"
                  value={description}
                  onChange={(e) => handleFieldChange(setDescription)(e.target.value)}
                  placeholder="Enter a brief description of the book's content, themes, and key topics. This helps students discover books through the chatbot and improves search results."
                  rows={4}
                />
                <p className="text-xs text-zinc-500">
                  💡 Tip: Include main themes, key concepts, and target audience. This description is searchable and helps the AI chatbot recommend this book to students.
                </p>
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Status <span className="text-rose-600">*</span>
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${errors.status ? "border-rose-400" : "border-zinc-200"}`}
                  aria-invalid={!!errors.status}
                  data-field="status"
                >
                  <option value="available">Available</option>
                  <option value="checked-out">Checked out</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="lost">Lost</option>
                </select>
                {fieldError("status")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Loan Policy {format !== "eBook" && <span className="text-rose-600">*</span>}
                  {format === "eBook" && <span className="text-zinc-500"> (not applicable for eBooks)</span>}
                </span>
                <select
                  value={format === "eBook" ? "n/a" : loanPolicy}
                  onChange={(e) => setLoanPolicy(e.target.value)}
                  className={`rounded-xl border px-4 py-3 outline-none transition focus:border-[var(--btn-primary)] focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.loanPolicy ? "border-rose-400" : "border-zinc-200"}`}
                  aria-invalid={!!errors.loanPolicy}
                  data-field="loanPolicy"
                  disabled={format === "eBook"}
                >
                  {format === "eBook" ? (
                    <option value="n/a">N/A - Digital Access Only</option>
                  ) : (
                    <>
                      <option value="standard">Standard</option>
                      <option value="short-loan">Short loan</option>
                      <option value="reference-only">Reference only</option>
                      <option value="staff-only">Staff only</option>
                    </>
                  )}
                </select>
                {fieldError("loanPolicy")}
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigateTo("/admin/books")}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-3 sm:py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border border-[var(--btn-primary)] bg-[var(--btn-primary)] px-5 py-3 sm:py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--btn-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 text-center"
            >
              {submitting ? "Updating…" : "Update book"}
            </button>
          </div>
        </form>
      </main>

      <ToastContainer position="top-right" />

      <UnsavedChangesDialog
        hasUnsavedChanges={hasUnsavedChanges}
        showDialog={showDialog}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />
    </div>
  );
}
