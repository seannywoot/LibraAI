"use client";

import { useState } from "react";

function StatusChip({ status }) {
  const map = {
    available: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
    },
    "checked-out": {
      bg: "bg-amber-100",
      text: "text-amber-800",
      dot: "bg-amber-500",
    },
    reserved: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
    maintenance: {
      bg: "bg-zinc-200",
      text: "text-zinc-800",
      dot: "bg-zinc-500",
    },
    lost: { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  };
  const c = map[status] || map.available;
  const label = (status || "available")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} aria-hidden />
      {label}
    </span>
  );
}

export default function RecommendationCard({ book, onClick, compact = false }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="w-full text-left rounded-lg bg-white border border-gray-200 p-3 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer"
      >
        <div className="flex gap-3">
          {/* Book Cover */}
          <div className="w-12 h-16 shrink-0 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
            {book.coverImageUrl && !imageError ? (
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <svg
                className="w-6 h-6 text-gray-400"
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
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-1">
              {book.title}
            </h4>
            <p className="text-xs text-gray-600 line-clamp-1 mb-1">
              {book.author}
            </p>
            {book.matchReasons && book.matchReasons.length > 0 && (
              <p className="text-xs text-blue-600 line-clamp-1">
                {book.matchReasons[0]}
              </p>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full text-left rounded-lg bg-white border border-gray-200 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
    >
      {/* Book Cover */}
      <div className="w-full aspect-[2/3] rounded bg-gray-200 flex items-center justify-center overflow-hidden mb-3">
        {book.coverImageUrl && !imageError ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg
            className="w-12 h-12 text-gray-400"
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
        )}
      </div>

      {/* Book Details */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {book.title}
        </h3>
        
        <p className="text-xs text-gray-600 line-clamp-1">
          {book.author}
        </p>

        {book.year && (
          <p className="text-xs text-gray-500">
            {book.year}
          </p>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusChip status={book.status} />
          {book.relevanceScore && (
            <span className="text-xs text-gray-500">
              {book.relevanceScore}% match
            </span>
          )}
        </div>

        {/* Match Reasons */}
        {book.matchReasons && book.matchReasons.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs text-blue-600 line-clamp-2">
                {book.matchReasons.join(" • ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
