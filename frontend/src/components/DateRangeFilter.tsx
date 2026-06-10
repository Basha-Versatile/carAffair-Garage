"use client";

import { useState, useEffect, useRef } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

export type DateRange = "today" | "7d" | "30d" | "90d" | "all" | "custom";

export interface DateRangeState {
  preset: DateRange;
  customFrom?: string;
  customTo?: string;
}

export const DATE_PRESETS: { key: DateRange; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

export function getDateCutoff(range: DateRange): Date | null {
  if (range === "all" || range === "custom") return null;
  const now = new Date();
  if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === "7d") { now.setDate(now.getDate() - 7); return now; }
  if (range === "30d") { now.setDate(now.getDate() - 30); return now; }
  if (range === "90d") { now.setDate(now.getDate() - 90); return now; }
  return null;
}

export function getPresetLabel(key: DateRange) {
  return DATE_PRESETS.find(p => p.key === key)?.label || "All Time";
}

export function filterByDate<T extends { date?: string; createdAt?: string }>(
  items: T[], range: DateRange, customFrom?: string, customTo?: string,
): T[] {
  if (range === "custom") {
    if (!customFrom && !customTo) return items;
    return items.filter(item => {
      const d = item.date || item.createdAt;
      if (!d) return false;
      const date = new Date(d);
      if (customFrom && date < new Date(customFrom)) return false;
      if (customTo && date > new Date(customTo + "T23:59:59")) return false;
      return true;
    });
  }
  const cutoff = getDateCutoff(range);
  if (!cutoff) return items;
  return items.filter(item => {
    const d = item.date || item.createdAt;
    return d && new Date(d) >= cutoff;
  });
}

export function DateRangeFilter({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
  customFrom?: string;
  customTo?: string;
  onCustomChange?: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayLabel = value === "custom" && customFrom && customTo
    ? `${customFrom} – ${customTo}`
    : value === "custom"
      ? "Custom"
      : getPresetLabel(value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all bg-hover hover:bg-brand-500/10 text-secondary hover:text-foreground border border-transparent hover:border-brand-500/20"
      >
        <CalendarDays className="w-3 h-3" />
        <span className="max-w-[120px] truncate">{displayLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-[var(--surface-bg)] border border-[var(--border-color)] shadow-xl z-50 overflow-hidden animate-scale-in">
          <div className="py-1">
            {DATE_PRESETS.filter(p => p.key !== "custom").map(opt => (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  value === opt.key
                    ? "bg-brand-500/10 text-brand-500 font-semibold"
                    : "text-secondary hover:bg-hover hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="border-t border-edge-light px-3 py-2.5">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-2">Custom Range</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-8 shrink-0">From</span>
                <input
                  type="date"
                  value={customFrom || ""}
                  onChange={e => {
                    const from = e.target.value;
                    onCustomChange?.(from, customTo || "");
                    if (from && customTo) { onChange("custom"); }
                  }}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-md text-[11px] bg-hover border border-edge-light text-foreground focus:outline-none focus:border-brand-500/40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-8 shrink-0">To</span>
                <input
                  type="date"
                  value={customTo || ""}
                  onChange={e => {
                    const to = e.target.value;
                    onCustomChange?.(customFrom || "", to);
                    if (customFrom && to) { onChange("custom"); }
                  }}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-md text-[11px] bg-hover border border-edge-light text-foreground focus:outline-none focus:border-brand-500/40"
                />
              </div>
            </div>
            {customFrom && customTo && (
              <button
                onClick={() => { onChange("custom"); setOpen(false); }}
                className="w-full mt-2 py-1.5 rounded-md text-[11px] font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
