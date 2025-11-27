"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { getStudentLinks } from "@/components/navLinks";
import SignOutButton from "@/components/sign-out-button";
import { Book, Clock, AlertCircle, BookOpen, Library } from "@/components/icons";
import { ChartBarDefault } from "@/components/student-bar-chart";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
  const [refreshingRecommendations, setRefreshingRecommendations] = useState(false);
  const [lastRecommendationUpdate, setLastRecommendationUpdate] = useState(null);
  const navigationLinks = getStudentLinks();

  useEffect(() => {
    loadDashboardData();
    loadStats();

    // Auto-refresh recommendations every 60 seconds
    const refreshInterval = setInterval(() => {
      loadRecommendations(false);
    }, 60000);

    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load borrowed books
      const borrowedRes = await fetch("/api/student/books/borrowed", {
        cache: "no-store",
      });
      const borrowedData = await borrowedRes.json().catch(() => ({}));
      if (borrowedRes.ok && borrowedData?.ok) {
        // Filter only borrowed books (not pending or rejected)
        const activeBorrowed = (borrowedData.items || []).filter(
          (item) =>
            item.status === "borrowed" || item.status === "return-requested"
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
      await loadRecommendations(true);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecommendations(isInitialLoad = false) {
    if (!isInitialLoad) {
      setRefreshingRecommendations(true);
    }

    try {
      // Always shuffle recommendations for variety (including on login/initial load)
      const recsRes = await fetch(
        `/api/student/books/recommendations?limit=6&shuffle=true`,
        { cache: "no-store" }
      );
      const recsData = await recsRes.json().catch(() => ({}));
      if (recsRes.ok && recsData?.ok) {
        setRecommendations(recsData.recommendations || []);
        setLastRecommendationUpdate(new Date());
      }
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      if (!isInitialLoad) {
        setRefreshingRecommendations(false);
      }
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
  const criticalBooks = borrowedBooks.filter((book) => {
    const daysUntil = getDaysUntilDue(book.dueDate);
    return daysUntil !== null && daysUntil <= 1;
  });

  // Books due within 2-3 days (yellow warning)
  const dueSoonBooks = borrowedBooks.filter((book) => {
    const daysUntil = getDaysUntilDue(book.dueDate);
    return daysUntil !== null && daysUntil >= 2 && daysUntil <= 3;
  });
  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-20 pb-8 lg:p-8 min-[1440px]:pl-[300px] min-[1440px]:pt-4">
      <DashboardSidebar
        heading="LibraAI"
        links={navigationLinks}
        variant="light"
        SignOutComponent={SignOutButton}
      />

      <main className="space-y-6">
        {/* Header */}
        < header className="space-y-2" >
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
            STUDENT DASHBOARD
          </p>
          <h1 className="text-4xl font-bold text-orange-600">Welcome back!</h1>
          <p className="text-sm text-gray-600">
            Here&apos;s an overview of your borrowed books and personalized
            recommendations.
          </p>
        </header >

        {/* Reading Statistics Widget */}
        {
          !statsLoading && stats && (
            <section className="grid gap-4 md:grid-cols-3">
              {/* Total Borrowed */}
              <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Borrowed
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {stats.totalBorrowed}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </div>
                  <div className="rounded-full bg-orange-100 p-3">
                    <Book className="h-6 w-6 text-[var(--btn-primary)]" />
                  </div>
                </div>
              </div>

              {/* Currently Borrowed */}
              <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Currently Reading
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {stats.currentlyBorrowed}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.pendingRequests > 0 &&
                        `${stats.pendingRequests} pending`}
                    </p>
                  </div>
                  <div className="rounded-full bg-orange-100 p-3">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>

              {/* Books Returned */}
              <div className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Books Returned
                    </p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {stats.totalReturned}
                    </p>
                    {stats.totalReturned > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(
                          (stats.onTimeReturns / stats.totalReturned) * 100
                        )}
                        % on time
                      </p>
                    )}
                  </div>
                  <div className="rounded-full bg-green-100 p-3">
                    <Book className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
            </section>
          )
        }

        {/* Bar Chart and Quick Actions Section */}
        <section className="grid gap-4 md:grid-cols-2">
          <ChartBarDefault
            favoriteCategories={stats?.favoriteCategories || []}
          />

          {/* Quick Actions */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>

            <Link
              href="/student/books"
              className="group block rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-200 p-2 group-hover:bg-orange-100 transition-colors">
                  <Book className="h-5 w-5 text-gray-700 group-hover:text-orange-600 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">Browse Catalog</h4>
                  <p className="text-xs text-gray-600">Explore available books</p>
                </div>
              </div>
            </Link>

            <Link
              href="/student/library"
              className="group block rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-200 p-2 group-hover:bg-orange-100 transition-colors">
                  <BookOpen className="h-5 w-5 text-gray-700 group-hover:text-orange-600 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">My Library</h4>
                  <p className="text-xs text-gray-600">View your collection</p>
                </div>
              </div>
            </Link>

            <Link
              href="/student/shelves"
              className="group block rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gray-200 p-2 group-hover:bg-orange-100 transition-colors">
                  <Library className="h-5 w-5 text-gray-700 group-hover:text-orange-600 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">Browse Shelves</h4>
                  <p className="text-xs text-gray-600">Explore by category</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Alerts Section */}
        {
          !loading && (criticalBooks.length > 0 || dueSoonBooks.length > 0) && (
            <div className="space-y-3">
              {criticalBooks.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-rose-900">
                        {criticalBooks.length}{" "}
                        {criticalBooks.length === 1 ? "book" : "books"} due today
                        or overdue
                      </h3>
                      <p className="text-sm text-rose-700 mt-1">
                        Please return{" "}
                        {criticalBooks.length === 1 ? "this book" : "these books"}{" "}
                        as soon as possible to avoid penalties.
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
                        {dueSoonBooks.length}{" "}
                        {dueSoonBooks.length === 1 ? "book is" : "books are"} due
                        soon
                      </h3>
                      <p className="text-sm text-amber-700 mt-1">
                        {dueSoonBooks.length === 1
                          ? "This book is"
                          : "These books are"}{" "}
                        due within 2-3 days.
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
          )
        }

        {/* Borrowed Books Section */}
        <section className="rounded-lg bg-white border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Currently Borrowed ({borrowedBooks.length})
            </h2>
            <Link
              href="/student/library?tab=borrowed"
              className="inline-flex items-center justify-center rounded-lg bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
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
                const isDueSoon =
                  daysUntil !== null && daysUntil >= 2 && daysUntil <= 3;

                return (
                  <Link
                    key={transaction._id}
                    href="/student/library?tab=borrowed"
                    className={`block rounded-lg border p-4 hover:shadow-md transition-shadow ${isCritical
                      ? "border-rose-200 bg-rose-50"
                      : isDueSoon
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200 bg-white"
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-16 shrink-0 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                        {transaction.bookCoverImage || transaction.bookThumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={transaction.bookCoverImage || transaction.bookThumbnail}
                            alt={`Cover of ${transaction.bookTitle}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs">Book</span>';
                            }}
                          />
                        ) : (
                          <span>Book</span>
                        )}
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
                            className={`font-medium ${isCritical
                              ? "text-rose-700"
                              : isDueSoon
                                ? "text-amber-700"
                                : "text-gray-700"
                              }`}
                          >
                            Due: {formatDate(transaction.dueDate)}
                            {daysUntil !== null &&
                              daysUntil < 0 &&
                              ` (${Math.abs(daysUntil)} days overdue)`}
                            {daysUntil !== null &&
                              daysUntil >= 0 &&
                              daysUntil <= 3 &&
                              ` (${daysUntil} ${daysUntil === 1 ? "day" : "days"
                              } left)`}
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Recommended for You
              </h2>
              {lastRecommendationUpdate && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated {formatTimeAgo(lastRecommendationUpdate)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadRecommendations(false)}
                disabled={refreshingRecommendations}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                title="Refresh recommendations"
              >
                <svg
                  className={`w-4 h-4 ${refreshingRecommendations ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {refreshingRecommendations ? 'Updating...' : 'Refresh'}
              </button>
              <Link
                href="/student/books"
                className="inline-flex items-center justify-center rounded-lg bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
              >
                Browse all →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Loading recommendations...
            </div>
          ) : refreshingRecommendations && recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              Updating recommendations...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600">
                No recommendations available yet. Browse books to get
                personalized suggestions.
              </p>
            </div>
          ) : (
            <div className="relative">
              {refreshingRecommendations && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-lg">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C86F26]"></div>
                    <span className="text-sm text-gray-700">Updating...</span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {recommendations.map((book) => (
                  <Link
                    key={book._id}
                    href={`/student/books/${book._id}`}
                    className="group rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs mb-2 overflow-hidden">
                      {book.coverImage || book.coverImageUrl || book.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverImage || book.coverImageUrl || book.thumbnail}
                          alt={book.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<span class="text-gray-400 text-xs">Book</span>';
                          }}
                        />
                      ) : (
                        <span>Book</span>
                      )}
                    </div>
                    <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-700">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {book.author}
                    </p>
                    {book.matchReasons && book.matchReasons.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <svg
                          className="w-3 h-3 text-[var(--btn-primary)] shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <p className="text-xs text-[var(--btn-primary)] font-medium line-clamp-1">
                          {book.matchReasons[0]}
                        </p>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

      </main >
    </div >
  );
}
