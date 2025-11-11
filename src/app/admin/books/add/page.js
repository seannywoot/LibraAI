"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import { useRouter } from "next/navigation";
import UnsavedChangesDialog from "@/components/unsaved-changes-dialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

export default function AdminAddBookPage() {
  const { data: session } = useSession();
  const router = useRouter();

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
  const [fetchingFromGoogle, setFetchingFromGoogle] = useState(false);
  const [coverImage, setCoverImage] = useState("");

  const { showDialog, cancelNavigation, confirmNavigation, navigateTo, handleNavigation } = useUnsavedChanges(hasUnsavedChanges);

  // Track any form field change
  const handleFieldChange = (setter) => (value) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [shelvesRes, authorsRes] = await Promise.all([
          fetch("/api/admin/shelves?pageSize=100", { cache: "no-store" }),
          fetch("/api/admin/authors?pageSize=100", { cache: "no-store" })
        ]);
        
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
      } finally {
        setLoadingShelves(false);
        setLoadingAuthors(false);
      }
    }
    loadData();
  }, []);

  const ALLOWED_STATUS = ["available", "reserved"];
  const ALLOWED_POLICIES = ["standard", "short-loan", "reference-only", "staff-only"];

  function validateForm() {
    const e = {};
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedShelf = shelf.trim();
    const trimmedIsbn = isbn.trim();
    const trimmedPublisher = publisher.trim();
    const trimmedBarcode = barcode.trim();
    const currentYear = new Date().getFullYear();
    const OLDEST_YEAR = 1450; // Gutenberg printing press era

    // Title validation
    if (!trimmedTitle) e.title = "Title is required";

    // Author validation - must not contain numbers or excessive symbols
    if (!trimmedAuthor) {
      e.author = "Author is required";
    } else if (/\d/.test(trimmedAuthor)) {
      e.author = "Author name cannot contain numbers";
    } else if (/[^a-zA-Z\s\-'.&,]/.test(trimmedAuthor)) {
      e.author = "Author name contains invalid characters";
    }

    // Year validation - must be numeric and within valid range
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

    // ISBN validation - either empty or exactly 13 digits
    if (trimmedIsbn !== "") {
      if (!/^\d{13}$/.test(trimmedIsbn)) {
        e.isbn = "ISBN must be either empty or exactly 13 digits";
      }
    }

    // Publisher validation - optional, but if provided must not be just numbers
    if (trimmedPublisher !== "" && /^\d+$/.test(trimmedPublisher)) {
      e.publisher = "Publisher cannot be only numbers";
    }

    // Barcode validation - optional, but if provided must have value
    if (trimmedBarcode !== "" && trimmedBarcode.length < 3) {
      e.barcode = "Item ID must be at least 3 characters if provided";
    }

    // Format validation - required for book data integrity
    if (!format) {
      e.format = "Book format/type is required";
    }

    // Category validation - required for book data integrity
    if (!category) {
      e.category = "Book category is required";
    }

    // Shelf is only required for non-eBook formats
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

  async function handleFetchFromGoogleBooks() {
    if (!isbn && !title) {
      showToast("Please enter ISBN or Title to fetch book details", "error");
      return;
    }

    setFetchingFromGoogle(true);
    try {
      // Build search query - prefer ISBN for accuracy
      const searchQuery = isbn 
        ? `isbn:${isbn}` 
        : encodeURIComponent(title);

      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1`
      );
      const googleData = await googleRes.json();

      if (!googleData.items || googleData.items.length === 0) {
        showToast("No book found on Google Books. Try a different ISBN or title.", "info");
        return;
      }

      const volumeInfo = googleData.items[0].volumeInfo;
      
      // Extract and process categories
      let categories = [];
      if (volumeInfo.categories && Array.isArray(volumeInfo.categories)) {
        categories = volumeInfo.categories.flatMap(cat => 
          cat.split('/').map(c => c.trim())
        ).filter(c => c.length > 0);
        categories = [...new Set(categories)];
      }

      // Auto-fill form fields (only if empty)
      if (volumeInfo.title && !title) {
        setTitle(volumeInfo.title);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.authors?.[0] && !author) {
        setAuthor(volumeInfo.authors[0]);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.publishedDate && !year) {
        const extractedYear = volumeInfo.publishedDate.substring(0, 4);
        setYear(extractedYear);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.publisher && !publisher) {
        setPublisher(volumeInfo.publisher);
        setHasUnsavedChanges(true);
      }
      if (volumeInfo.industryIdentifiers?.[0]?.identifier && !isbn) {
        const extractedIsbn = volumeInfo.industryIdentifiers[0].identifier.replace(/[^\d]/g, "");
        if (extractedIsbn.length === 13) {
          setIsbn(extractedIsbn);
          setHasUnsavedChanges(true);
        }
      }
      if (volumeInfo.description && !description) {
        setDescription(volumeInfo.description);
        setHasUnsavedChanges(true);
      }
      if (categories.length > 0 && !category) {
        // Map Google Books categories to our categories
        const categoryMap = {
          'Fiction': 'Fiction',
          'Science': 'Science',
          'Technology': 'Technology',
          'History': 'History',
          'Biography': 'Biography',
          'Self-Help': 'Self-Help',
          'Business': 'Business',
          'Art': 'Arts',
          'Education': 'Education',
          'Juvenile': 'Children',
          'Young Adult': 'Young Adult',
        };
        
        for (const cat of categories) {
          for (const [key, value] of Object.entries(categoryMap)) {
            if (cat.includes(key)) {
              setCategory(value);
              setHasUnsavedChanges(true);
              break;
            }
          }
          if (category) break;
        }
      }
      
      // Store cover image URL
      if (volumeInfo.imageLinks?.thumbnail) {
        setCoverImage(volumeInfo.imageLinks.thumbnail);
      }

      showToast("Book details fetched from Google Books!", "success");
    } catch (err) {
      console.error("Failed to fetch from Google Books:", err);
      showToast("Failed to fetch book details from Google Books", "error");
    } finally {
      setFetchingFromGoogle(false);
    }
  }

  async function handlePDFUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setExtractingMetadata(true);

    try {
      // First, upload the PDF file
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

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

      // Then extract metadata
      const metadataFormData = new FormData();
      metadataFormData.append("file", file);

      const metadataRes = await fetch("/api/admin/books/extract-pdf-metadata", {
        method: "POST",
        body: metadataFormData,
      });

      const metadataData = await metadataRes.json().catch(() => ({}));
      
      if (metadataRes.ok && metadataData?.ok && metadataData?.metadata) {
        const { metadata } = metadataData;
        
        // Fill form fields with extracted metadata (only if fields are empty)
        if (metadata.title && !title) {
          setTitle(metadata.title);
        }
        if (metadata.author && !author) {
          setAuthor(metadata.author);
        }
        if (metadata.year && !year) {
          setYear(metadata.year.toString());
        }
        if (metadata.publisher && !publisher) {
          setPublisher(metadata.publisher);
        }

        showToast("PDF uploaded and metadata extracted successfully!", "success");
      } else {
        showToast("PDF uploaded. Please fill in details manually.", "info");
      }
    } catch (err) {
      console.error("Failed to process PDF:", err);
      showToast(err?.message || "Failed to process PDF", "error");
      setEbookUrl("");
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
      // Focus first invalid field
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el?.focus) el.focus();
      showToast("Please fix errors in the form", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/books/create", {
        method: "POST",
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
          coverImage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to add book");
      }
      showToast(`Book "${data.book?.title || title}" added successfully!`, "success");
      setHasUnsavedChanges(false);
      // Reset form after success
      setTitle("");
      setAuthor("");
      setYear("");
      setShelf("");
      setIsbn("");
      setPublisher("");
      setFormat("");
      setEbookUrl("");
      setBarcode("");
      setCategory("");
      setDescription("");
      setStatus("available");
      setLoanPolicy("standard");
      setCoverImage("");
      setErrors({});
      // Optionally navigate to dashboard or a list page later
    } catch (err) {
      showToast(err?.message || "Failed to add book", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} onNavigate={handleNavigation} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-3 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Add a Book</h1>
            <p className="text-sm text-zinc-600">Enter basic bibliographic details to add a title to the catalog.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-8">
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Book details</h2>
              <button
                type="button"
                onClick={handleFetchFromGoogleBooks}
                disabled={fetchingFromGoogle || (!isbn && !title)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {fetchingFromGoogle ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Fetch from Google Books
                  </>
                )}
              </button>
            </div>
            
            {coverImage && (
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-zinc-200">
                <img 
                  src={coverImage} 
                  alt="Book cover preview" 
                  className="w-20 h-28 object-cover rounded shadow-sm"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Cover Image Found</p>
                  <p className="text-xs text-zinc-500 mt-1">This cover will be saved with the book</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">
                  Title <span className="text-rose-600">*</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.title ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={title}
                  onChange={(e) => handleFieldChange(setTitle)(e.target.value)}
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
                      className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"} w-full`}
                      value={author}
                      onChange={(e) => handleFieldChange(setAuthor)(e.target.value)}
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
                        className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"} w-full`}
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
                    className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"}`}
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
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.year ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={year}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow numeric input
                    if (value === '' || /^\d{0,4}$/.test(value)) {
                      setYear(value);
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
                    className={`rounded-xl border px-4 py-3 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
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
                    className={`rounded-xl border px-4 py-3 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
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
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.isbn ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  inputMode="numeric"
                  value={isbn}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 13);
                    setIsbn(value);
                  }}
                  placeholder="e.g., 9781492032649 (13 digits)"
                  aria-invalid={!!errors.isbn}
                  data-field="isbn"
                  maxLength={13}
                />
                {fieldError("isbn")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Publisher <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.publisher ? "border-rose-400" : "border-zinc-200"}`}
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
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.format ? "border-rose-400" : "border-zinc-200"}`}
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
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200"
                    type="file"
                    accept=".pdf,application/pdf"
                    disabled={extractingMetadata}
                    onChange={handlePDFUpload}
                  />
                  {extractingMetadata && (
                    <p className="text-xs text-blue-600">Extracting metadata from PDF...</p>
                  )}
                  <p className="text-xs text-zinc-500">Upload a PDF file - metadata will be extracted automatically to fill the form</p>
                </label>
              )}
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Barcode / Item ID <span className="text-zinc-500">(optional)</span>
                </span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.barcode ? "border-rose-400" : "border-zinc-200"}`}
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
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.category ? "border-rose-400" : "border-zinc-200"}`}
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
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 min-h-[120px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.status ? "border-rose-400" : "border-zinc-200"}`}
                  aria-invalid={!!errors.status}
                  data-field="status"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
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
                  className={`rounded-xl border px-4 py-3 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${format === "eBook" ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" : "bg-white text-zinc-900"} ${errors.loanPolicy ? "border-rose-400" : "border-zinc-200"}`}
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigateTo("/admin/dashboard")}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add book"}
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
