"use client";

import { useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Download,
  Loader2,
  FileSpreadsheet,
  FileText,
  ChevronDown,
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
    from: new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0],
    to,
  };
}

export interface ReportDateRange {
  from: string;
  to: string;
}

/** Column definition for export — maps header to a value extractor */
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

interface ReportShellProps<T = unknown> {
  title: string;
  loading: boolean;
  generated: boolean;
  onGenerate: (range: ReportDateRange) => void;
  children: ReactNode;
  /** Columns for CSV/PDF export. If not provided, export buttons are hidden. */
  exportColumns?: ExportColumn<T>[];
  /** Data array for CSV/PDF export. */
  exportData?: T[];
}

/* ── CSV Export ── */

function exportCSV<T>(
  title: string,
  columns: ExportColumn<T>[],
  data: T[],
  range: ReportDateRange
) {
  const headers = columns.map((c) => `"${c.header}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const v = c.value(row);
        return typeof v === "number" ? v : `"${String(v).replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  downloadBlob(blob, `${title} (${range.from} to ${range.to}).csv`);
}

/* ── PDF Export ── */

function exportPDF<T>(
  title: string,
  columns: ExportColumn<T>[],
  data: T[],
  range: ReportDateRange
) {
  // Build a styled HTML table and use the browser print dialog
  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => {
            const v = c.value(row);
            const align = typeof v === "number" ? "right" : "left";
            return `<td style="padding:6px 10px;border-bottom:1px solid #e4e4e7;text-align:${align};font-size:12px">${v}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;margin:24px;color:#18181b}
  h1{font-size:18px;margin:0 0 4px}
  .meta{font-size:12px;color:#71717a;margin-bottom:16px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:8px 10px;background:#f4f4f5;border-bottom:2px solid #e4e4e7;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#52525b}
  tr:nth-child(even){background:#fafafa}
  @media print{body{margin:12px}button{display:none!important}}
</style></head><body>
<h1>${title}</h1>
<p class="meta">${range.from} to ${range.to} &middot; ${data.length} records</p>
<table><thead><tr>${columns
    .map((c) => `<th>${c.header}</th>`)
    .join("")}</tr></thead><tbody>${tableRows}</tbody></table>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onafterprint = () => {
      w.close();
      URL.revokeObjectURL(url);
    };
  }
}

/* ── Download helper ── */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Main Component ── */

export default function ReportShell<T>({
  title,
  loading,
  generated,
  onGenerate,
  children,
  exportColumns,
  exportData,
}: ReportShellProps<T>) {
  const router = useRouter();
  const [preset, setPreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const hasInitiated = useRef(false);

  // Current active range
  const getActiveRange = useCallback((): ReportDateRange => {
    if (preset === "custom") return { from: customFrom, to: customTo };
    return getPresetRange(preset);
  }, [preset, customFrom, customTo]);

  // Auto-generate on mount with default "month" preset
  useEffect(() => {
    if (!hasInitiated.current) {
      hasInitiated.current = true;
      onGenerate(getPresetRange("month"));
    }
  }, [onGenerate]);

  // Re-generate when preset changes (after initial load)
  function handlePresetChange(newPreset: DatePreset) {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      onGenerate(getPresetRange(newPreset));
    }
  }

  // For custom range: apply button
  function handleCustomApply() {
    if (customFrom && customTo) {
      onGenerate({ from: customFrom, to: customTo });
    }
  }

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        exportRef.current &&
        !exportRef.current.contains(e.target as Node)
      ) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const canExport =
    generated && !loading && exportColumns && exportData && exportData.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/reports")}
          className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-hover transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Date presets + export */}
        <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => handlePresetChange(p.key)}
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

          {/* Export dropdown */}
          {canExport && (
            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 bg-background border border-edge rounded-lg shadow-theme-lg z-50 min-w-40 py-1 animate-scale-in">
                  <button
                    onClick={() => {
                      exportCSV(title, exportColumns!, exportData!, getActiveRange());
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-hover transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-ok" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => {
                      exportPDF(title, exportColumns!, exportData!, getActiveRange());
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary hover:bg-hover transition-colors"
                  >
                    <FileText className="w-4 h-4 text-bad" />
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Loading...
            </div>
          )}
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
              <button
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo || loading}
                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && !generated ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="px-6 py-4">{children}</div>
        )}
      </div>
    </div>
  );
}
