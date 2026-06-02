"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface PaginationState {
  page: number;
  pageSize: PageSize;
}

export interface PaginationProps {
  total: number;
  page: number;
  pageSize: PageSize;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
}

export function usePaginatedData<T>(data: T[], state: PaginationState) {
  const { page, pageSize } = state;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);
  return { paged, totalPages, safePage, total: data.length };
}

export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  function getVisiblePages(): (number | "...")[] {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (safePage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (safePage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", safePage - 1, safePage, safePage + 1, "...", totalPages);
    }
    return pages;
  }

  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-edge bg-dim/30">
      {/* Left: showing info + page size */}
      <div className="flex items-center gap-3 text-xs text-muted">
        <span>
          Showing <span className="font-medium text-secondary">{start}</span>–
          <span className="font-medium text-secondary">{end}</span> of{" "}
          <span className="font-medium text-secondary">{total}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-muted/70">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value) as PageSize);
              onPageChange(1);
            }}
            className="bg-background border border-edge rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getVisiblePages().map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-1 text-xs text-muted">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors ${
                  p === safePage
                    ? "bg-brand-500 text-white"
                    : "text-secondary hover:bg-hover hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
