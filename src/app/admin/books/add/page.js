"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Home, Book, Plus, Users, Library as LibraryIcon, User, Settings } from "@/components/icons";
import SignOutButton from "@/components/sign-out-button";
import ToastContainer from "@/components/ToastContainer";
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
  const [barcode, setBarcode] = useState("");
  const [status, setStatus] = useState("available");
  const [loanPolicy, setLoanPolicy] = useState("standard");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [toasts, setToasts] = useState([]);
  const pushToast = (toast) => {
    const id = Date.now() + Math.random();
    const t = { id, duration: 2500, ...toast };
    setToasts((prev) => [t, ...prev]);
    if (t.duration) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, t.duration + 100);
    }
  };

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
    if (!trimmedShelf) e.shelf = "Shelf is required";

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

  const navigationLinks = [
    { key: "admin-dashboard", label: "Dashboard", href: "/admin/dashboard", exact: true, icon: <Home className="h-4 w-4" /> },
    { key: "admin-books", label: "Books", href: "/admin/books", exact: true, icon: <Book className="h-4 w-4" /> },
    { key: "admin-add-book", label: "Add Book", href: "/admin/books/add", exact: true, icon: <Plus className="h-4 w-4" /> },
    { key: "admin-authors", label: "Authors", href: "/admin/authors", exact: true, icon: <Users className="h-4 w-4" /> },
    { key: "admin-shelves", label: "Shelves", href: "/admin/shelves", exact: true, icon: <LibraryIcon className="h-4 w-4" /> },
    { key: "admin-profile", label: "Profile", href: "/admin/profile", exact: true, icon: <User className="h-4 w-4" /> },
    { key: "admin-settings", label: "Settings", href: "/admin/settings", exact: true, icon: <Settings className="h-4 w-4" /> },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    const { valid, firstKey } = validateForm();
    if (!valid) {
      // Focus first invalid field
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      if (el?.focus) el.focus();
      pushToast({ type: "error", title: "Please fix errors", description: "Some fields need your attention." });
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
          barcode,
          status,
          loanPolicy,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to add book");
      }
      pushToast({ type: "success", title: "Book added", description: `${data.book?.title || title} saved.` });
      // Reset form after success
      setTitle("");
      setAuthor("");
      setYear("");
      setShelf("");
      setIsbn("");
      setPublisher("");
      setFormat("");
      setBarcode("");
      setStatus("available");
      setLoanPolicy("standard");
      setErrors({});
      // Optionally navigate to dashboard or a list page later
    } catch (err) {
      pushToast({ type: "error", title: "Add failed", description: err?.message || "Unknown error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar
        heading="Library Catalog"
        tagline="Admin"
        links={navigationLinks}
        variant="light"
        footer="Add new titles to keep your shelves up to date."
        SignOutComponent={SignOutButton}
      />

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
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.author ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g., François Chollet"
                  aria-invalid={!!errors.author}
                  data-field="author"
                />
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
                <span className="text-zinc-700">Shelf</span>
                <input
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.shelf ? "border-rose-400" : "border-zinc-200"}`}
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  placeholder="e.g., A3"
                  aria-invalid={!!errors.shelf}
                  data-field="shelf"
                />
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
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  type="text"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  placeholder="e.g., Book, eBook, Journal"
                />
              </label>
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
                <span className="text-zinc-700">Loan Policy</span>
                <select
                  value={loanPolicy}
                  onChange={(e) => setLoanPolicy(e.target.value)}
                  className={`rounded-xl border bg-white px-4 py-3 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 ${errors.loanPolicy ? "border-rose-400" : "border-zinc-200"}`}
                  aria-invalid={!!errors.loanPolicy}
                  data-field="loanPolicy"
                >
                  <option value="standard">Standard</option>
                  <option value="short-loan">Short loan</option>
                  <option value="reference-only">Reference only</option>
                  <option value="staff-only">Staff only</option>
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

        <ToastContainer
          toasts={toasts}
          onClose={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
          position="top-right"
        />
      </main>
    </div>
  );
}
