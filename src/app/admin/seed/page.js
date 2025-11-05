"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getAdminLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";

export default function AdminSeedPage() {
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [fixIndexLoading, setFixIndexLoading] = useState(false);
  const [authorsLoading, setAuthorsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [fixIndexResult, setFixIndexResult] = useState(null);
  const [authorsResult, setAuthorsResult] = useState(null);
  const [error, setError] = useState("");

  const navigationLinks = getAdminLinks();

  async function handleFixIndex() {
    setFixIndexLoading(true);
    setError("");
    setFixIndexResult(null);
    
    try {
      const res = await fetch("/api/admin/shelves/fix-index", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to fix index");
      }
      
      setFixIndexResult(data);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setFixIndexLoading(false);
    }
  }

  async function handleCleanup() {
    setCleanupLoading(true);
    setError("");
    setCleanupResult(null);
    
    try {
      const res = await fetch("/api/admin/shelves/cleanup", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to cleanup shelves");
      }
      
      setCleanupResult(data);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setCleanupLoading(false);
    }
  }

  async function handleSeedAuthors() {
    setAuthorsLoading(true);
    setError("");
    setAuthorsResult(null);
    
    try {
      const res = await fetch("/api/admin/authors/seed", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to seed authors");
      }
      
      setAuthorsResult(data);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setAuthorsLoading(false);
    }
  }

  async function handleSeed() {
    setLoading(true);
    setError("");
    setResult(null);
    
    try {
      const res = await fetch("/api/admin/books/seed", { method: "POST" });
      const data = await res.json();
      
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to seed data");
      }
      
      setResult(data);
    } catch (e) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-(--bg-1) pr-6 pl-[300px] py-8 text-(--text)">
      <DashboardSidebar 
        heading="LibraAI" 
        links={navigationLinks} 
        variant="light" 
        SignOutComponent={SignOutButton} 
      />

      <main className="space-y-8 rounded-3xl border border-(--stroke) bg-white p-10 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
        <header className="space-y-2 border-b border-(--stroke) pb-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Admin</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Seed Database</h1>
          <p className="text-sm text-zinc-600">
            Seed the database with sample books and shelves. Safe to run multiple times.
          </p>
        </header>

        <div className="space-y-6">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-rose-900">🔧 Fix Database Index (Run This First!)</h2>
            <p className="text-sm text-rose-700">
              If you&apos;re getting &quot;E11000 duplicate key error&quot;, click this button to fix the database index.
            </p>
            
            <button
              onClick={handleFixIndex}
              disabled={fixIndexLoading}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {fixIndexLoading ? "Fixing..." : "Fix Index"}
            </button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-amber-900">⚠️ Cleanup Shelves (Optional)</h2>
            <p className="text-sm text-amber-700">
              Remove any invalid shelf entries with null or empty codes.
            </p>
            
            <button
              onClick={handleCleanup}
              disabled={cleanupLoading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {cleanupLoading ? "Cleaning..." : "Cleanup Shelves"}
            </button>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-blue-900">📚 Seed Authors</h2>
            <p className="text-sm text-blue-700">
              This will create canonical author entries with biographies:
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>48 authors from the seeded books</li>
              <li>Complete biographies for each author</li>
              <li>Proper name normalization</li>
            </ul>
            <p className="text-xs text-blue-600 italic">
              Note: Existing authors will be updated with bios if missing.
            </p>
            
            <button
              onClick={handleSeedAuthors}
              disabled={authorsLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {authorsLoading ? "Seeding..." : "Seed Authors"}
            </button>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900">📖 Seed Books & Shelves</h2>
            <p className="text-sm text-zinc-600">
              This will create or update:
            </p>
            <ul className="text-sm text-zinc-600 list-disc list-inside space-y-1">
              <li>48 books across 12 categories</li>
              <li>24 shelves (A1-L2) with locations</li>
              <li>Links between books and shelves</li>
            </ul>
            <p className="text-xs text-zinc-500 italic">
              Note: Existing books (by ISBN) will be updated, not duplicated.
            </p>
            
            <button
              onClick={handleSeed}
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Seeding..." : "Seed Books & Shelves"}
            </button>
          </div>

          {fixIndexResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-2">
              <h3 className="font-semibold text-emerald-900">✅ Index Fixed!</h3>
              <p className="text-sm text-emerald-700">{fixIndexResult.message}</p>
              <div className="text-sm text-emerald-700">
                <p>Deleted: {fixIndexResult.deleted} invalid shelves</p>
                <p>Indexes fixed: {fixIndexResult.droppedIndexes?.length || 0} dropped and recreated</p>
                {fixIndexResult.droppedIndexes?.length > 0 && (
                  <p className="text-xs">({fixIndexResult.droppedIndexes.join(", ")})</p>
                )}
              </div>
              <p className="text-xs text-emerald-600 italic pt-2">
                Now you can safely run &quot;Seed Database&quot; below.
              </p>
            </div>
          )}

          {cleanupResult && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-2">
              <h3 className="font-semibold text-amber-900">Cleanup Complete</h3>
              <p className="text-sm text-amber-700">{cleanupResult.message}</p>
              <div className="text-sm text-amber-700">
                <p>Deleted: {cleanupResult.deleted} invalid shelves</p>
                <p>Updated: {cleanupResult.updated} shelves</p>
              </div>
            </div>
          )}

          {authorsResult && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 space-y-4">
              <h3 className="font-semibold text-blue-900">✅ Authors Seeded!</h3>
              <p className="text-sm text-blue-700">{authorsResult.message}</p>
              
              <div className="rounded-lg bg-white p-4 border border-blue-200">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Authors</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-zinc-700">
                    <span className="font-semibold">{authorsResult.inserted || 0}</span> inserted
                  </p>
                  <p className="text-zinc-700">
                    <span className="font-semibold">{authorsResult.updated || 0}</span> updated
                  </p>
                  <p className="text-zinc-700">
                    <span className="font-semibold">{authorsResult.skipped || 0}</span> skipped
                  </p>
                  <p className="text-zinc-700">
                    <span className="font-semibold">{authorsResult.total || 0}</span> total
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/admin/authors"
                  className="text-sm text-blue-700 hover:text-blue-900 underline"
                >
                  View Authors →
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
              <h3 className="font-semibold text-rose-900 mb-2">Error</h3>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 space-y-4">
              <h3 className="font-semibold text-emerald-900">Success!</h3>
              <p className="text-sm text-emerald-700">{result.message}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-lg bg-white p-4 border border-emerald-200">
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Books</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-zinc-700">
                      <span className="font-semibold">{result.books?.inserted || 0}</span> inserted
                    </p>
                    <p className="text-zinc-700">
                      <span className="font-semibold">{result.books?.updated || 0}</span> updated
                    </p>
                    <p className="text-zinc-700">
                      <span className="font-semibold">{result.books?.total || 0}</span> total
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 border border-emerald-200">
                  <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Shelves</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-zinc-700">
                      <span className="font-semibold">{result.shelves?.created || 0}</span> created
                    </p>
                    <p className="text-zinc-700">
                      <span className="font-semibold">{result.shelves?.total || 0}</span> total
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <p className="text-sm text-emerald-700 font-medium">Next steps:</p>
                <div className="flex gap-2">
                  <Link
                    href="/student/shelves"
                    className="text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    View Shelves →
                  </Link>
                  <span className="text-zinc-400">•</span>
                  <Link
                    href="/student/books"
                    className="text-sm text-emerald-700 hover:text-emerald-900 underline"
                  >
                    Browse Books →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
