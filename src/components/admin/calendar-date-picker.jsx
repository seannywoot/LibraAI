import { useEffect, useMemo, useRef, useState } from "react";

function formatDisplayDate(value) {
  if (!value) return "Select date";
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "Select date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // align Monday as first column
  const cells = [];
  let current = 1 - startOffset;
  for (let week = 0; week < 6; week += 1) {
    const row = [];
    for (let day = 0; day < 7; day += 1) {
      const cellDate = new Date(year, month, current);
      row.push({
        date: cellDate,
        inMonth: current >= 1 && current <= daysInMonth,
      });
      current += 1;
    }
    cells.push(row);
  }
  return cells;
}

function toInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function CalendarDatePicker({ value, min, onChange }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? null : date;
  }, [value]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const minDate = useMemo(() => {
    if (!min) return null;
    const date = new Date(min + "T00:00:00");
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }, [min]);

  const [viewYear, setViewYear] = useState(() => (parsedValue ? parsedValue.getFullYear() : today.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (parsedValue ? parsedValue.getMonth() : today.getMonth()));

  useEffect(() => {
    function handleClick(event) {
      if (!open) return;
      if (anchorRef.current?.contains(event.target)) return;
      if (popoverRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    if (open) {
      window.addEventListener("mousedown", handleClick);
    }
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const matrix = useMemo(() => getMonthMatrix(viewYear, viewMonth), [viewYear, viewMonth]);

  function moveMonth(step) {
    setViewMonth((prev) => {
      const next = prev + step;
      if (next < 0) {
        setViewYear((year) => year - 1);
        return 11;
      }
      if (next > 11) {
        setViewYear((year) => year + 1);
        return 0;
      }
      return next;
    });
  }

  function isDisabled(date) {
    if (minDate && date < minDate) return true;
    return false;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function handleSelect(date) {
    if (isDisabled(date)) return;
    onChange?.(toInput(date));
    setOpen(false);
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const displayLabel = formatDisplayDate(value);
  const isPlaceholder = displayLabel === "Select date";

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        className={`w-full rounded-xl border border-zinc-300 px-3 py-2 text-left text-sm font-medium shadow-sm transition hover:border-zinc-400 hover:shadow ${
          isPlaceholder ? "text-zinc-400" : "text-zinc-700"
        }`}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            if (!prev) {
              const base = parsedValue || today;
              setViewYear(base.getFullYear());
              setViewMonth(base.getMonth());
            }
            return next;
          })
        }
      >
        {displayLabel}
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 z-20 mt-2 w-[280px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between text-sm font-semibold text-zinc-900">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              &#8249;
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
            >
              &#8250;
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {"Mon Tue Wed Thu Fri Sat Sun".split(" ").map((label) => (
              <div key={label}>{label}</div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1 text-sm">
            {matrix.map((week, index) => (
              <div key={`week-${index}`} className="contents">
                {week.map(({ date, inMonth }) => {
                  const disabled = !inMonth || isDisabled(date);
                  const selected = parsedValue && isSameDay(parsedValue, date);
                  const todayMatch = isSameDay(today, date);
                  const base = selected
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : todayMatch
                    ? "border border-violet-400 text-violet-600 hover:bg-violet-50"
                    : "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900";
                  return (
                    <button
                      key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSelect(date)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 ${
                        disabled
                          ? "cursor-not-allowed text-zinc-300"
                          : base
                      } ${selected ? "font-semibold" : ""}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
