"use client";

import { useState } from "react";
import { Bookmark } from "./icons";
import { showToast } from "./ToastContainer";

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

export default function RecommendationCard({ 
  book, 
  onClick, 
  compact = false,
  isBookmarked = false,
  onBookmarkToggle 
}) {
  const [imageError, setImageError] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    }
  };

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (onBookmarkToggle) {
      onBookmarkToggle(book._id);
      return;
    }
    
    // Default bookmark handling if no callback provided
    setBookmarking(true);
    try {
      const res = await fetch("/api/student/books/bookmark", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookId: book._id }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        showToast(data.message, "success");
        // Force a re-render by updating a dummy state
        setImageError(prev => prev);
      } else {
        showToast(data?.error || "Failed to toggle bookmark", "error");
      }
    } catch (error) {
      showToast("Failed to toggle bookmark", "error");
    } finally {
      setBookmarking(false);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        {/* Bookmark Button */}
        <button
          onClick={handleBookmarkClick}
          disabled={bookmarking}
          className={`absolute right-1 top-1 z-10 p-0.5 rounded-full transition-colors ${
            isBookmarked
              ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
              : "bg-white/90 text-gray-400 hover:bg-white hover:text-gray-600 shadow-sm"
          } disabled:opacity-50`}
          title={isBookmarked ? "Remove bookmark" : "Bookmark this book"}
        >
          <Bookmark className={`h-2.5 w-2.5 ${isBookmarked ? "fill-current" : ""}`} />
        </button>

        <button
          type="button"
          onClick={handleClick}
          className="w-full text-left rounded-lg bg-white border border-gray-200 p-2 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer"
        >
          <div className="flex gap-2">
            {/* Book Cover - Smaller */}
            <div className="w-10 h-14 shrink-0 rounded bg-gray-200 flex items-center justify-center overflow-hidden">
            {(book.coverImage || book.coverImageUrl || book.thumbnail) && !imageError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverImage || book.coverImageUrl || book.thumbnail}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <svg
                className="w-5 h-5 text-gray-400"
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

          {/* Book Info - Smaller text */}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-gray-900 line-clamp-2 mb-0.5 leading-tight">
              {book.title}
            </h4>
            <p className="text-[10px] text-gray-600 line-clamp-1 mb-0.5">
              {book.author}
            </p>
            {book.matchReasons && book.matchReasons.length > 0 && (
              <p className="text-[10px] text-blue-600 line-clamp-1">
                {book.matchReasons[0]}
              </p>
            )}
          </div>
        </div>
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg bg-white border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Bookmark Button */}
      <button
        onClick={handleBookmarkClick}
        disabled={bookmarking}
        className={`absolute right-2 top-2 z-10 p-1.5 rounded-full transition-colors ${
          isBookmarked
            ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
            : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        } disabled:opacity-50`}
        title={isBookmarked ? "Remove bookmark" : "Bookmark this book"}
      >
        <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
      </button>

      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left cursor-pointer"
      >
        {/* Book Cover */}
        <div className="w-full aspect-2/3 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-medium mb-2 overflow-hidden">
          {(book.coverImage || book.coverImageUrl || book.thumbnail) && !imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverImage || book.coverImageUrl || book.thumbnail}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <span>Book Cover</span>
          )}
        </div>

        {/* Book Details */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug line-clamp-2">
            {book.title}
          </h3>
          <p className="text-[11px] text-gray-600 mb-1 line-clamp-1">
            {book.author}
          </p>
          <div className="text-[11px] text-gray-500 mb-2">
            {book.year && <span>{book.year}</span>}
          </div>

          {/* Status */}
          <div className="mb-2">
            <StatusChip status={book.status} />
          </div>

          {/* Match Reasons */}
          {book.matchReasons && book.matchReasons.length > 0 && (
            <p className="text-[10px] text-blue-600 line-clamp-2 leading-relaxed">
              {book.matchReasons.join(" • ")}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
