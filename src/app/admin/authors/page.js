"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Edit as EditIcon, Trash2 } from "@/components/icons";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { ToastContainer, showToast } from "@/components/ToastContainer";
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
  const [totalBooks, setTotalBooks] = useState(0);
  const [s, setS] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingBio, setEditingBio] = useState("");

  const navigationLinks = useMemo(() => getAdminLinks(), []);

  const load = useCallback(async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (s) params.set("s", s);
      
      // Fetch authors and stats in parallel
      const [authorsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/authors?${params.toString()}`, { cache: "no-store" }),
        fetch("/api/admin/authors/stats", { cache: "no-store" })
      ]);
      
      const [authorsData, statsData] = await Promise.all([
        authorsRes.json().catch(() => ({})),
        statsRes.json().catch(() => ({}))
      ]);
      
      if (!authorsRes.ok || !authorsData?.ok) throw new Error(authorsData?.error || "Failed to load authors");
      
      const authors = authorsData.items || [];
      
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
      setTotal(authorsData.total || 0);
      setTotalBooks(statsData?.totalBooks || 0);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, s]);

  useEffect(() => { load(); }, [load]);

  async function addAuthor(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    try {
      const res = await fetch("/api/admin/authors", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: n, bio }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Create failed");
      showToast(`Author "${n}" added successfully!`, "success");
      setName(""); setBio("");
      await load();
    } catch (e) { 
      showToast(e?.message || "Failed to add author", "error");
    }
  }

  async function saveEdit(id) {
    const n = editingName.trim();
    if (!n) return;
    try {
      const res = await fetch(`/api/admin/authors/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: n, bio: editingBio }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Update failed");
      showToast(`Author "${n}" updated successfully!`, "success");
      setEditingId(null);
      await load();
    } catch (e) { 
      showToast(e?.message || "Failed to update author", "error");
    }
  }

  async function deleteAuthor(id) {
    if (!confirm("Delete this author? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/authors/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Delete failed");
      showToast("Author deleted successfully", "success");
      await load();
    } catch (e) { 
      showToast(e?.message || "Failed to delete author", "error");
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
  <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-4 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Authors</h1>
            <p className="text-sm text-zinc-600">Create, edit, and delete canonical authors.</p>
          </div>
          {!loading && items.length > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2">
                <span className="font-semibold text-zinc-900">{total}</span>
                <span className="text-zinc-600">{total === 1 ? 'author' : 'authors'}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-2">
                <span className="font-semibold text-blue-900">
                  {totalBooks}
                </span>
                <span className="text-blue-700">total books</span>
              </div>
            </div>
          )}
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <form onSubmit={addAuthor} className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold text-zinc-900">Add author</h2>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-700">Name</span>
              <input className="rounded-xl border border-zinc-200 bg-white px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-zinc-700">Bio (optional)</span>
              <textarea className="min-h-[72px] rounded-xl border border-zinc-200 bg-white px-4 py-3" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short biography" />
            </label>
            <div className="flex justify-end"><button className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800" type="submit">Add</button></div>
          </form>

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="flex items-end gap-2">
              <label className="grid flex-1 gap-2 text-sm">
                <span className="text-zinc-700">Search</span>
                <input className="rounded-xl border border-zinc-200 bg-white px-4 py-3" value={s} onChange={(e) => setS(e.target.value)} placeholder="Filter by name" />
              </label>
              <button onClick={() => { setPage(1); load(); }} className="mt-6 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800">Apply</button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading authors…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-zinc-900">No authors yet</h2>
            <p className="text-sm text-zinc-600">Add your first author using the form above.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="overflow-x-auto">
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
                  {items.map((a) => (
                    <tr key={a._id} className="rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {editingId === a._id ? (
                          <input className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2" value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        ) : (
                          <Link href={`/admin/authors/${a._id}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                            {a.name}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === a._id ? (
                          "—"
                        ) : (
                          <Link href={`/admin/authors/${a._id}`} className="inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900 font-medium">
                            <span className="inline-flex items-center justify-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-800">
                              {a.bookCount ?? 0}
                            </span>
                            <span className="text-xs text-zinc-500">{a.bookCount === 1 ? 'book' : 'books'}</span>
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === a._id ? (
                          <textarea className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2" value={editingBio} onChange={(e) => setEditingBio(e.target.value)} />
                        ) : (
                          a.bio || "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === a._id ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => saveEdit(a._id)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">Save</button>
                            <button onClick={() => setEditingId(null)} className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100">Cancel</button>
                          </div>
                        ) : (
                          <RowActions
                            onEdit={() => { setEditingId(a._id); setEditingName(a.name); setEditingBio(a.bio || ""); }}
                            onDelete={() => deleteAuthor(a._id)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      <ToastContainer position="top-right" />
    </div>
  );
}
