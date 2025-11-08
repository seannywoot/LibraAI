"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { Library as LibraryIcon } from "@/components/icons";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";

export default function StudentShelvesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const navigationLinks = getStudentLinks();

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadShelves();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    loadShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  async function loadShelves() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
      if (searchInput) params.append("search", searchInput);
      const res = await fetch(`/api/student/shelves?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load shelves");
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleClearSearch() {
    setSearchInput("");
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-6 border-b border-(--stroke) pb-6">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Student</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Browse Shelves</h1>
            <p className="text-sm text-zinc-600">Explore library shelves and discover books by location.</p>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search shelves..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">Loading shelves…</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <LibraryIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No shelves available</h2>
            <p className="text-sm text-zinc-600">Check back later for shelf information.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((shelf) => (
                <Link
                  key={shelf._id}
                  href={`/student/shelves/${shelf._id}`}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3 hover:bg-zinc-100 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-white p-2 shadow-sm">
                      <LibraryIcon className="h-5 w-5 text-zinc-700" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-zinc-900">{shelf.code}</h3>
                      {shelf.name && <p className="text-sm text-zinc-600">{shelf.name}</p>}
                      {shelf.location && (
                        <p className="text-xs text-zinc-500">📍 {shelf.location}</p>
                      )}
                      <p className="text-xs font-medium text-zinc-700 pt-1">
                        {shelf.bookCount || 0} {shelf.bookCount === 1 ? 'book' : 'books'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
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
