"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import { useRouter } from "next/navigation";

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
  const [status, setStatus] = useState("available");
  const [loanPolicy, setLoanPolicy] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [shelves, setShelves] = useState([]);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);

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

  const ALLOWED_STATUS = ["available", "checked-out", "reserved", "maintenance", "lost"];
  const ALLOWED_POLICIES = ["standard", "short-loan", "reference-only", "staff-only"];

  function validateForm() {
    const e = {};
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const trimmedShelf = shelf.trim();
    const currentYear = new Date().getFullYear();
    const yearNum = Number(year);

    if (!trimmedTitle) e.title = "Title is required";
    if (!trimmedAuthor) e.author = "Author is required";
    if (year === "" || Number.isNaN(yearNum)) {
      e.year = "Year is required";
    } else if (!Number.isInteger(yearNum) || yearNum < 0 || yearNum > currentYear + 1) {
      e.year = `Enter a valid year (0–${currentYear + 1})`;
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
          status,
          loanPolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to add book");
      }
      showToast(`Book "${data.book?.title || title}" added successfully!`, "success");
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
      setStatus("available");
      setLoanPolicy("standard");
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
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

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
            <h2 className="text-base font-semibold text-zinc-900">Book details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="text-zinc-700">Title</span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.title ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Deep Learning with Python"
                  aria-invalid={!!errors.title}
                  data-field="title"
                />
                {fieldError("title")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Author</span>
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
                <span className="text-zinc-700">Year</span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.year ? "border-rose-400" : "border-zinc-200"}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={String(new Date().getFullYear())}
                  aria-invalid={!!errors.year}
                  data-field="year"
                />
                {fieldError("year")}
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">
                  Shelf {format === "eBook" && <span className="text-zinc-500">(not applicable for eBooks)</span>}
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
                <span className="text-zinc-700">ISBN / Identifier</span>
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="e.g., 9781492032649"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Publisher</span>
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  type="text"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value)}
                  placeholder="e.g., O'Reilly Media"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Format / Type</span>
                <select
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="">Select format (optional)</option>
                  <option value="Physical Book">Physical Book</option>
                  <option value="eBook">eBook</option>
                  <option value="Journal">Journal</option>
                  <option value="Reference">Reference</option>
                  <option value="Thesis">Thesis</option>
                </select>
              </label>
              {format === "eBook" && (
                <label className="grid gap-2 text-sm sm:col-span-2">
                  <span className="text-zinc-700">eBook URL</span>
                  <input
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                    type="url"
                    value={ebookUrl}
                    onChange={(e) => setEbookUrl(e.target.value)}
                    placeholder="e.g., https://example.com/ebook.pdf"
                  />
                  <p className="text-xs text-zinc-500">Enter the URL where students can access this eBook</p>
                </label>
              )}
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Barcode / Item ID</span>
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g., BC-000123"
                />
              </label>
              <label className="grid gap-2 text-sm">
                <span className="text-zinc-700">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.status ? "border-rose-400" : "border-zinc-200"}`}
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
                  Loan Policy {format === "eBook" && <span className="text-zinc-500">(not applicable for eBooks)</span>}
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
              onClick={() => router.push("/admin/dashboard")}
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
    </div>
  );
}
