"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Book, Clock, AlertCircle } from "@/components/icons";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric",
    timeZone: "Asia/Manila"
  });
}

function getDaysUntilDue(dueDateStr) {
  if (!dueDateStr) return null;
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const navigationLinks = getStudentLinks();

  useEffect(() => {
    loadDashboardData();
    loadStats();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load borrowed books
      const borrowedRes = await fetch("/api/student/books/borrowed", { cache: "no-store" });
      const borrowedData = await borrowedRes.json().catch(() => ({}));
      if (borrowedRes.ok && borrowedData?.ok) {
        // Filter only borrowed books (not pending or rejected)
        const activeBorrowed = (borrowedData.items || []).filter(
          item => item.status === "borrowed" || item.status === "return-requested"
        );
        
        // Sort by due date (closest first)
        activeBorrowed.sort((a, b) => {
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA - dateB;
        });
        
        setBorrowedBooks(activeBorrowed);
      }

      // Load recommendations
      const recsRes = await fetch("/api/student/books/recommendations?limit=6", { cache: "no-store" });
      const recsData = await recsRes.json().catch(() => ({}));
      if (recsRes.ok && recsData?.ok) {
        setRecommendations(recsData.recommendations || []);
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/student/stats", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }

  // Books that are overdue or due within 1 day (red alert)
  const criticalBooks = borrowedBooks.filter(book => {
    const daysUntil = getDaysUntilDue(book.dueDate);
    return daysUntil !== null && daysUntil <= 1;
  });

  // Books due within 2-3 days (yellow warning)
  const dueSoonBooks = borrowedBooks.filter(book => {
    const daysUntil = getDaysUntilDue(book.dueDate);
    return daysUntil !== null && daysUntil >= 2 && daysUntil <= 3;
  });

  return (
    <div className="min-h-screen bg-gray-50 pr-6 pl-[300px] py-8">
      <DashboardSidebar heading="LibraAI" links={navigationLinks} variant="light" SignOutComponent={SignOutButton} />

      <main className="space-y-6">
        {/* Header */}
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            STUDENT DASHBOARD
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back!
          </h1>
          <p className="text-sm text-gray-600">
            Here&apos;s an overview of your borrowed books and personalized recommendations.
          </p>
        </header>

        {/* Reading Statistics Widget */}
        {!statsLoading && stats && (
          <section className="grid gap-4 md:grid-cols-3">
            {/* Total Borrowed */}
            <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Borrowed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBorrowed}</p>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Book className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Currently Borrowed */}
            <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Currently Reading</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.currentlyBorrowed}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.pendingRequests > 0 && `${stats.pendingRequests} pending`}
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </div>

            {/* Books Returned */}
            <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Books Returned</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalReturned}</p>
                  {stats.totalReturned > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round((stats.onTimeReturns / stats.totalReturned) * 100)}% on time
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Book className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Favorite Categories */}
        {!statsLoading && stats && stats.favoriteCategories.length > 0 && (
          <section>
            <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Favorite Categories</h3>
              <div className="space-y-2">
                {stats.favoriteCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{category.name}</span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {category.count} views
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/student/books"
                className="inline-block mt-3 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Explore more →
              </Link>
            </div>
          </section>
        )}

        {/* Alerts Section */}
        {!loading && (criticalBooks.length > 0 || dueSoonBooks.length > 0) && (
          <div className="space-y-3">
            {criticalBooks.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-rose-900">
                      {criticalBooks.length} {criticalBooks.length === 1 ? "book" : "books"} due today or overdue
                    </h3>
                    <p className="text-sm text-rose-700 mt-1">
                      Please return {criticalBooks.length === 1 ? "this book" : "these books"} as soon as possible to avoid penalties.
                    </p>
                  </div>
                  <Link
                    href="/student/library?tab=borrowed"
                    className="text-sm font-medium text-rose-700 hover:text-rose-800 whitespace-nowrap"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            )}
            
            {dueSoonBooks.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-900">
                      {dueSoonBooks.length} {dueSoonBooks.length === 1 ? "book is" : "books are"} due soon
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      {dueSoonBooks.length === 1 ? "This book is" : "These books are"} due within 2-3 days.
                    </p>
                  </div>
                  <Link
                    href="/student/library?tab=borrowed"
                    className="text-sm font-medium text-amber-700 hover:text-amber-800 whitespace-nowrap"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Borrowed Books Section */}
        <section className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Currently Borrowed ({borrowedBooks.length})
            </h2>
            <Link
              href="/student/library?tab=borrowed"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Loading borrowed books...
            </div>
          ) : borrowedBooks.length === 0 ? (
            <div className="text-center py-8">
              <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Book className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">
                You haven&apos;t borrowed any books yet.
              </p>
              <Link
                href="/student/books"
                className="inline-block mt-3 text-sm font-medium text-gray-900 hover:underline"
              >
                Browse catalog
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {borrowedBooks.slice(0, 5).map((transaction) => {
                const daysUntil = getDaysUntilDue(transaction.dueDate);
                // Red: overdue or due within 1 day (0-1 days)
                const isCritical = daysUntil !== null && daysUntil <= 1;
                // Yellow: due within 2-3 days
                const isDueSoon = daysUntil !== null && daysUntil >= 2 && daysUntil <= 3;

                return (
                  <Link
                    key={transaction._id}
                    href="/student/library?tab=borrowed"
                    className={`block rounded-lg border p-4 hover:shadow-md transition-shadow ${
                      isCritical
                        ? "border-rose-200 bg-rose-50"
                        : isDueSoon
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-16 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        Book
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {transaction.bookTitle}
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {transaction.bookAuthor}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-gray-500">
                            Borrowed: {formatDate(transaction.borrowedAt)}
                          </span>
                          <span
                            className={`font-medium ${
                              isCritical
                                ? "text-rose-700"
                                : isDueSoon
                                ? "text-amber-700"
                                : "text-gray-700"
                            }`}
                          >
                            Due: {formatDate(transaction.dueDate)}
                            {daysUntil !== null && daysUntil < 0 && ` (${Math.abs(daysUntil)} days overdue)`}
                            {daysUntil !== null && daysUntil >= 0 && daysUntil <= 3 && ` (${daysUntil} ${daysUntil === 1 ? "day" : "days"} left)`}
                          </span>
                        </div>
                      </div>
                      {(isCritical || isDueSoon) && (
                        <div className="shrink-0">
                          {isCritical ? (
                            <AlertCircle className="h-5 w-5 text-rose-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Books Section */}
        <section className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Recommended for You
            </h2>
            <Link
              href="/student/books"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Browse all →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Loading recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">
                No recommendations available yet. Browse books to get personalized suggestions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.map((book) => (
                <Link
                  key={book._id}
                  href={`/student/books/${book._id}`}
                  className="group rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                >
                  <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs mb-2 overflow-hidden">
                    {book.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverImageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "Book"
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-700">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {book.author}
                  </p>
                  {book.matchReasons && book.matchReasons.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {book.matchReasons[0]}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid gap-4 md:grid-cols-3">
          <Link
            href="/student/books"
            className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-3">
                <Book className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Catalog</h3>
                <p className="text-sm text-gray-600">Explore available books</p>
              </div>
            </div>
          </Link>

          <Link
            href="/student/library"
            className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-3">
                <Book className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Library</h3>
                <p className="text-sm text-gray-600">View your collection</p>
              </div>
            </div>
          </Link>

          <Link
            href="/student/shelves"
            className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-3">
                <Book className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Shelves</h3>
                <p className="text-sm text-gray-600">Explore by category</p>
              </div>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
