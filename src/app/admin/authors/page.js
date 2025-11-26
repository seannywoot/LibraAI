"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Edit as EditIcon, Trash2, Plus, X } from "@/components/icons";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
import ConfirmDialog from "@/components/confirm-dialog";
import UnsavedChangesDialog from "@/components/unsaved-changes-dialog";
import Link from "next/link";

function RowActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">
        <EditIcon className="h-3.5 w-3.5" />
        Edit
      </button>
      <button onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50">
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </button>
    </div>
  );
}

export default function AdminAuthorsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: ""
  });

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingCloseAction, setPendingCloseAction] = useState(null);
  const initialFormDataRef = useRef(null);

  const navigationLinks = useMemo(() => getAdminLinks(), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (searchInput) params.set("s", searchInput);

      const res = await fetch(`/api/admin/authors?${params.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load authors");

      const authors = data.items || [];

      // Fetch book counts for each author
      const authorsWithCounts = await Promise.all(
        authors.map(async (author) => {
          try {
            const booksRes = await fetch(`/api/admin/authors/${author._id}/books?pageSize=1`, { cache: "no-store" });
            const booksData = await booksRes.json().catch(() => ({}));
            return { ...author, bookCount: booksData?.total || 0 };
          } catch {
            return { ...author, bookCount: 0 };
          }
        })
      );

      setItems(authorsWithCounts);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchInput]);

  useEffect(() => { load(); }, [load]);

  const openAddModal = () => {
    const newFormData = { name: "", bio: "" };
    setFormData(newFormData);
    initialFormDataRef.current = newFormData;
    setShowAddModal(true);
    setHasUnsavedChanges(false);
  };

  const openEditModal = (author) => {
    setEditingAuthor(author);
    const newFormData = {
      name: author.name,
      bio: author.bio || ""
    };
    setFormData(newFormData);
    initialFormDataRef.current = newFormData;
    setHasUnsavedChanges(false);
  };

  const handleFormChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  const closeModal = () => {
    if (hasUnsavedChanges) {
      setPendingCloseAction(() => () => {
        setShowAddModal(false);
        setEditingAuthor(null);
        setFormData({ name: "", bio: "" });
        setHasUnsavedChanges(false);
        initialFormDataRef.current = null;
      });
      setShowUnsavedDialog(true);
    } else {
      setShowAddModal(false);
      setEditingAuthor(null);
      setFormData({ name: "", bio: "" });
      initialFormDataRef.current = null;
    }
  };

  async function handleAddAuthor(e) {
    e.preventDefault();
    const n = formData.name.trim();
    if (!n) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n, bio: formData.bio })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Create failed");
      showToast(`Author "${n}" added successfully!`, "success");
      setShowAddModal(false);
      setFormData({ name: "", bio: "" });
      setHasUnsavedChanges(false);
      initialFormDataRef.current = null;
      await load();
    } catch (e) {
      showToast(e?.message || "Failed to add author", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateAuthor(e) {
    e.preventDefault();
    const n = formData.name.trim();
    if (!n) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/authors/${editingAuthor._id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: n, bio: formData.bio })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Update failed");
      showToast(`Author "${n}" updated successfully!`, "success");
      setEditingAuthor(null);
      setFormData({ name: "", bio: "" });
      setHasUnsavedChanges(false);
      initialFormDataRef.current = null;
      await load();
    } catch (e) {
      showToast(e?.message || "Failed to update author", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteAuthor(id) {
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/authors/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Delete failed");
      showToast("Author deleted successfully", "success");
      setPendingDelete(null);
      await load();
    } catch (e) {
      showToast(e?.message || "Failed to delete author", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isDeletingCurrent = pendingDelete ? deletingId === pendingDelete._id : false;

  return (
    <div className="min-h-screen bg-(--bg-1) px-4 pt-20 pb-8 lg:p-8 lg:pl-[300px] text-(--text)">
      <ToastContainer position="top-right" />
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
        onNavigate={(callback) => {
          if (hasUnsavedChanges) {
            setPendingCloseAction(() => callback);
            setShowUnsavedDialog(true);
            return false;
          }
          callback();
          return true;
        }}
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-4 lg:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Authors</h1>
              <p className="text-sm text-zinc-600">Create, edit, and delete canonical authors.</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--btn-primary)] text-white rounded-xl font-medium hover:bg-[var(--btn-primary-hover)] transition"
            >
              <Plus className="h-4 w-4" />
              Add Author
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
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
              placeholder="Search authors by name..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading authors…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">No existing author</h2>
            <p className="text-sm text-zinc-600">
              {searchInput
                ? "Try searching for other authors or consult with the librarian for assistance."
                : "Click \"Add Author\" to add a new author to the system."}
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Books</th>
                    <th className="px-4 py-2">Bio</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((author) => (
                    <tr key={author._id} className="rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        <Link href={`/admin/authors/${encodeURIComponent(author.slug || author._id)}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {author.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/authors/${encodeURIComponent(author.slug || author._id)}`} className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 font-medium">
                          <span className="inline-flex items-center justify-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-800">
                            {author.bookCount ?? 0}
                          </span>
                          <span className="text-xs text-zinc-500">{author.bookCount === 1 ? 'book' : 'books'}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{author.bio || "—"}</td>
                      <td className="px-4 py-3">
                        <RowActions
                          onEdit={() => openEditModal(author)}
                          onDelete={() => setPendingDelete(author)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {items.map((author) => (
                <div key={author._id} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin/authors/${encodeURIComponent(author.slug || author._id)}`}
                        className="font-medium text-zinc-900 hover:text-blue-600 hover:underline"
                      >
                        {author.name}
                      </Link>
                      <div className="mt-1">
                        <Link href={`/admin/authors/${encodeURIComponent(author.slug || author._id)}`} className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 font-medium">
                          <span className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 border border-zinc-200">
                            {author.bookCount ?? 0}
                          </span>
                          <span className="text-xs text-zinc-500">{author.bookCount === 1 ? 'book' : 'books'}</span>
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(author)}
                        className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 rounded-lg transition"
                        aria-label="Edit author"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(author)}
                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition"
                        aria-label="Delete author"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {author.bio && (
                    <p className="text-sm text-zinc-600 line-clamp-2">
                      {author.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">Page {page} of {Math.max(1, Math.ceil(total / pageSize))} · {total} total</p>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
                <button className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.max(1, Math.ceil(total / pageSize))}>Next</button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingAuthor) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-zinc-900">
                {editingAuthor ? "Edit Author" : "Add New Author"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-zinc-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={editingAuthor ? handleUpdateAuthor : handleAddAuthor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange({ name: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  placeholder="e.g., Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <div className="flex items-center justify-between">
                    <span>Bio</span>
                    <span className={`text-xs ${formData.bio.length >= 200 ? 'text-rose-600 font-semibold' : 'text-zinc-500'}`}>
                      {formData.bio.length}/200
                    </span>
                  </div>
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleFormChange({ bio: e.target.value })}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 min-h-[120px]"
                  placeholder="Short biography"
                  maxLength={200}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-[var(--btn-primary)] text-white rounded-xl font-medium hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 transition"
                >
                  {submitting ? "Saving..." : editingAuthor ? "Update Author" : "Add Author"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:bg-zinc-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete Author"
        description={pendingDelete ? `Are you sure you want to delete "${pendingDelete.name}"? This cannot be undone.` : ""}
        confirmLabel={isDeletingCurrent ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        destructive
        loading={isDeletingCurrent}
        onCancel={() => {
          if (!isDeletingCurrent) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete && !isDeletingCurrent) {
            void deleteAuthor(pendingDelete._id);
          }
        }}
      />

      <UnsavedChangesDialog
        hasUnsavedChanges={hasUnsavedChanges}
        showDialog={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          if (pendingCloseAction) {
            pendingCloseAction();
            setPendingCloseAction(null);
          }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingCloseAction(null);
        }}
      />
    </div>
  );
}
