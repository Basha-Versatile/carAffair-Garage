"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  FileText,
} from "lucide-react";

type DatePreset = "today" | "week" | "month" | "lastMonth" | "custom";

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

function getPresetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];

  if (preset === "today") return { from: to, to };

  if (preset === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().split("T")[0], to };
  }

  if (preset === "lastMonth") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      from: first.toISOString().split("T")[0],
      to: last.toISOString().split("T")[0],
    };
  }

  // month (default)
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
    to,
  };
}

export interface ReportDateRange {
  from: string;
  to: string;
}

interface ReportShellProps {
  title: string;
  loading: boolean;
  generated: boolean;
  onGenerate: (range: ReportDateRange) => void;
  children: ReactNode;
}

export default function ReportShell({
  title,
  loading,
  generated,
  onGenerate,
  children,
}: ReportShellProps) {
  const router = useRouter();
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  function handleGenerate() {
    if (preset === "custom") {
      onGenerate({ from: customFrom, to: customTo });
    } else {
      onGenerate(getPresetRange(preset));
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Date presets + generate */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                  preset === p.key
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400"
                    : "border-edge text-muted hover:bg-hover"
                }`}
              >
                {p.key === "custom" && <Calendar className="w-3.5 h-3.5" />}
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <button
            onClick={handleGenerate}
            disabled={loading || (preset === "custom" && (!customFrom || !customTo))}
            className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {/* Custom date range */}
        {preset === "custom" && (
          <div className="px-6 pb-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-3 py-2 border border-edge rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              />
              <span className="text-sm text-muted">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-3 py-2 border border-edge rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : !generated ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <FileText className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">Select a date range and generate</p>
            <p className="text-muted text-sm">Choose a period above and click &quot;Generate Report&quot;.</p>
          </div>
        ) : (
          <div className="px-6 py-4">{children}</div>
        )}
      </div>
    </div>
  );
}
