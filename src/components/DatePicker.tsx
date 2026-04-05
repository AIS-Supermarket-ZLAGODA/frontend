import { useState, useRef, useEffect } from "react";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS = [
  "Січень", "Лютий", "Березень", "Квітень",
  "Травень", "Червень", "Липень", "Серпень",
  "Вересень", "Жовтень", "Листопад", "Грудень",
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function formatDisplay(value: string): string {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${d}.${m}.${y}`;
}

function parseInput(input: string): string | null {
  const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(+y, +m - 1, +d);
  if (date.getFullYear() === +y && date.getMonth() === +m - 1 && date.getDate() === +d) {
    return `${y}-${m}-${d}`;
  }
  return null;
}

export default function DatePicker({ value, onChange, className = "" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [inputText, setInputText] = useState(formatDisplay(value));
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = value ? new Date(value) : today;
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  useEffect(() => {
    setInputText(formatDisplay(value));
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (text: string) => {
    setInputText(text);
    const parsed = parseInput(text);
    if (parsed) {
      onChange(parsed);
      const d = new Date(parsed);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } else if (text === "") {
      onChange("");
    }
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const iso = `${viewYear}-${m}-${d}`;
    onChange(iso);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = startDayOfWeek(viewYear, viewMonth);
  const cells: (number | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const selectedDay = value
    ? (() => {
        const d = new Date(value);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth ? d.getDate() : null;
      })()
    : null;

  const todayDay =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth ? today.getDate() : null;

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={inputText}
        placeholder="дд.мм.рррр"
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        className={className}
      />

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
            >
              &larr;
            </button>
            <span className="text-sm font-semibold text-gray-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 cursor-pointer"
            >
              &rarr;
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-xs font-medium text-gray-400 py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`w-8 h-8 rounded-lg text-sm cursor-pointer transition-colors
                      ${day === selectedDay
                        ? "bg-emerald-600 text-white font-bold"
                        : day === todayDay
                          ? "bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {day}
                  </button>
                ) : (
                  <span className="w-8 h-8" />
                )}
              </div>
            ))}
          </div>

          {/* Clear button */}
          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Очистити
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                onChange(iso);
                setViewYear(t.getFullYear());
                setViewMonth(t.getMonth());
                setOpen(false);
              }}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer"
            >
              Сьогодні
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
