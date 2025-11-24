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
  const [sortBy, setSortBy] = useState("code"); // 'code', 'bookCount', 'location'
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

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
  }, [page, pageSize, sortBy, selectedLocation]);

  // Load unique locations on mount
  useEffect(() => {
    loadLocations();
     
  }, []);

  async function loadShelves() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        pageSize: pageSize.toString(),
        sortBy: sortBy
      });
      if (searchInput) params.append("search", searchInput);
      if (selectedLocation) params.append("location", selectedLocation);
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

  async function loadLocations() {
    try {
      const res = await fetch("/api/student/shelves/locations", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setLocations(data.locations || []);
      }
    } catch (e) {
      console.error("Failed to load locations:", e);
    }
  }

  function handleClearSearch() {
    setSearchInput("");
  }

  function handleClearFilters() {
    setSortBy("code");
    setSelectedLocation("");
    setSearchInput("");
    setPage(1);
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

          <div className="space-y-4">
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
                placeholder="Search by code or location..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  <option value="code">Shelf Code</option>
                  <option value="bookCount">Book Count</option>
                  <option value="location">Location</option>
                </select>
              </div>

              {locations.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-zinc-700">Location:</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              )}

              {(sortBy !== "code" || selectedLocation || searchInput) && (
                <button
                  onClick={handleClearFilters}
                  className="ml-auto text-sm text-zinc-600 hover:text-zinc-900 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 space-y-3 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-zinc-200 p-2 w-9 h-9" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-zinc-200 rounded w-24" />
                    <div className="h-4 bg-zinc-200 rounded w-32" />
                    <div className="h-3 bg-zinc-200 rounded w-20" />
                    <div className="h-3 bg-zinc-200 rounded w-16 mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center">
            <div className="rounded-full bg-white p-3 shadow text-zinc-500">
              <LibraryIcon className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900">No existing shelf</h2>
            <p className="text-sm text-zinc-600">Try searching for other shelf codes or locations, or consult with the librarian for assistance.</p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((shelf) => (
                <Link
                  key={shelf._id}
                  href={`/student/shelves/${encodeURIComponent(shelf.slug || shelf.code || shelf._id)}`}
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
