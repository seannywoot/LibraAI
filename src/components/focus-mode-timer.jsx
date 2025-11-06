"use client";

import { useEffect, useState } from "react";
import { X, Play, Pause, RotateCcw } from "lucide-react";

export default function FocusModeTimer({ onClose }) {
  const [duration, setDuration] = useState(25); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // Play notification sound or show alert
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Reading Session Complete! 📚", {
                body: "Great work! Time to take a break and reflect on what you've learned.",
                icon: "/favicon.ico",
              });
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = () => {
    if (isConfiguring) {
      setTimeLeft(duration * 60);
      setIsConfiguring(false);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsConfiguring(true);
    setTimeLeft(duration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = isConfiguring ? 100 : (timeLeft / (duration * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-(--stroke) bg-white dark:bg-(--bg-2) p-8 shadow-2xl transition-colors">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-(--subtext) transition hover:bg-(--bg-2) hover:text-(--text)"
          aria-label="Close reading timer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-(--text)">Reading Focus Timer</h2>
            <p className="mt-2 text-sm text-(--subtext)">
              {isConfiguring ? "Set your reading session duration" : isRunning ? "Keep reading, you're doing great!" : "Paused"}
            </p>
          </div>

          {isConfiguring ? (
            <div className="space-y-4">
              <label className="block text-center">
                <span className="text-sm font-medium text-(--subtext)">Duration (minutes)</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setDuration(val);
                    setTimeLeft(val * 60);
                  }}
                  className="mt-2 w-full rounded-xl border border-(--stroke) bg-white dark:bg-(--bg-1) px-4 py-3 text-center text-lg font-semibold text-(--text) outline-none transition focus:border-(--dark-stroke) focus:ring-2 focus:ring-(--dark-stroke)/10"
                />
              </label>
              <div className="flex gap-2">
                {[15, 25, 45, 60].map((min) => (
                  <button
                    key={min}
                    onClick={() => {
                      setDuration(min);
                      setTimeLeft(min * 60);
                    }}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      duration === min
                        ? "border-(--dark-stroke) bg-(--dark-stroke) text-white"
                        : "border-(--stroke) bg-white dark:bg-(--bg-1) text-(--text) hover:bg-(--bg-2)"
                    }`}
                  >
                    {min}m
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="mx-auto flex h-48 w-48 items-center justify-center">
                <svg className="absolute h-48 w-48 -rotate-90 transform">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-(--stroke)"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                    className="text-(--dark-stroke) transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center">
                  <div className="text-4xl font-bold text-(--text)">{formatTime(timeLeft)}</div>
                  <div className="mt-1 text-sm text-(--subtext)">{duration} min session</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!isConfiguring && (
              <button
                onClick={resetTimer}
                className="flex items-center justify-center gap-2 rounded-xl border border-(--stroke) bg-white dark:bg-(--bg-1) px-4 py-3 text-sm font-semibold text-(--text) transition hover:bg-(--bg-2)"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-(--dark-stroke) bg-(--dark-stroke) px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {isConfiguring ? "Start" : "Resume"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
