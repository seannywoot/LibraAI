"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Book as BookIcon, ArrowLeft } from "@/components/icons";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";

function StatusChip({ status }) {
  const map = {
    available: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
    "checked-out": { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
    reserved: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
    maintenance: { bg: "bg-zinc-200", text: "text-zinc-800", dot: "bg-zinc-500" },
    lost: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  };
  const c = map[status] || map.available;
  const label = (status || "available").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden />
      {label}
    </span>
  );
}

export default function AdminShelfBooksPage() {
  const params = useParams();
  const router = useRouter();
  const shelfId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shelf, setShelf] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const navigationLinks = getAdminLinks();

  useEffect(() => {
    if (shelfId) loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfId, page, pageSize]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/shelves/${shelfId}/books?page=${page}&pageSize=${pageSize}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load books");
      setShelf(data.shelf);
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="flex items-end justify-between gap-4 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <button
              onClick={() => router.push("/admin/shelves")}
              className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Shelves
            </button>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {shelf ? `Shelf ${shelf.code}` : "Loading..."}
            </h1>
            {shelf && (
              <div className="space-y-1">
                {shelf.name && <p className="text-sm text-zinc-600">{shelf.name}</p>}
                {shelf.location && <p className="text-xs text-zinc-500">📍 {shelf.location}</p>}
                {shelf.capacity !== null && shelf.capacity !== undefined && (
                  <p className="text-xs text-zinc-500">Capacity: {shelf.capacity} books</p>
                )}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading books…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <BookIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No books on this shelf</h2>
            <p className="text-sm text-zinc-600">This shelf is currently empty.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Author</th>
                    <th className="px-4 py-2">Year</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">ISBN</th>
                    <th className="px-4 py-2">Barcode</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((book) => (
                    <tr key={book._id} className="rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-800">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        <Link href={`/admin/books/${encodeURIComponent(book.slug || book._id)}/edit`} className="text-blue-600 hover:text-blue-800 hover:underline">
                          {book.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{book.author || "—"}</td>
                      <td className="px-4 py-3">{book.year ?? "—"}</td>
                      <td className="px-4 py-3"><StatusChip status={book.status} /></td>
                      <td className="px-4 py-3">{book.isbn || "—"}</td>
                      <td className="px-4 py-3">{book.barcode || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-zinc-500">Page {page} of {totalPages} · {total} total</p>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </button>
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
