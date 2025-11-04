"use client";

import { useEffect, useState } from "react";
import RecommendationCard from "./recommendation-card";
import { getBehaviorTracker } from "@/lib/behavior-tracker";
import { getRecommendationService } from "@/lib/recommendation-service";

export default function RecommendationsSidebar({ 
  className = "", 
  maxItems = 10,
  context = "browse",
  onRefresh
}) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const recommendationService = getRecommendationService();

  async function loadRecommendations(showLoader = true, forceRefresh = false) {
    if (showLoader) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await recommendationService.getRecommendations({
        context,
        limit: maxItems,
        forceRefresh
      });

      if (!data?.ok) {
        throw new Error(data?.error || "Failed to load recommendations");
      }

      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setError(err?.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    // Debounce context changes to avoid excessive API calls
    const timer = setTimeout(() => {
      loadRecommendations(false);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  function handleRecommendationClick(book) {
    // Track the view event
    const tracker = getBehaviorTracker();
    tracker.trackBookView(book._id, {
      title: book.title,
      author: book.author,
      categories: book.categories,
      tags: book.tags
    });

    // Navigate to book details (you can customize this)
    // For now, we'll just log it
    console.log("Clicked recommendation:", book.title);
    
    // Optionally trigger a refresh
    if (onRefresh) {
      onRefresh();
    }
  }

  function handleRetry() {
    loadRecommendations(true, true);
  }

  // Loading skeleton
  if (loading) {
    return (
      <aside className={`w-64 shrink-0 ${className}`}>
        <div className="sticky top-8 space-y-4">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recommended for You
              </h2>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="w-full aspect-2/3 rounded bg-gray-200 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Error state
  if (error) {
    return (
      <aside className={`w-64 shrink-0 ${className}`}>
        <div className="sticky top-8">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended for You
            </h2>

            <div className="text-center py-6">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-3">
                Unable to load recommendations
              </p>
              <button
                onClick={handleRetry}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Empty state
  if (recommendations.length === 0) {
    return (
      <aside className={`w-64 shrink-0 ${className}`}>
        <div className="sticky top-8">
          <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended for You
            </h2>

            <div className="text-center py-6">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-1 font-medium">
                No recommendations yet
              </p>
              <p className="text-xs text-gray-500">
                Start browsing books to get personalized suggestions
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Main content with recommendations
  return (
    <aside className={`w-64 shrink-0 ${className}`}>
      <div className="sticky top-8">
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recommended for You
            </h2>
            <button
              onClick={() => setExpanded(!expanded)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Recommendations List */}
          {expanded && (
            <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto relative">
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              )}
              {recommendations.map((book) => (
                <RecommendationCard
                  key={book._id}
                  book={book}
                  onClick={handleRecommendationClick}
                  compact={true}
                />
              ))}
            </div>
          )}

          {/* Refresh Button */}
          {expanded && (
            <button
              onClick={() => loadRecommendations(false, true)}
              className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
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
              Refresh
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
