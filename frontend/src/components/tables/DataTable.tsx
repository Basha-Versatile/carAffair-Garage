"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronUp, ChevronDown, Filter, Search } from "lucide-react";

/* ── Public types ── */

export interface DataColumn<T> {
  key: string;
  header: string | React.ReactNode;
  render: (row: T) => React.ReactNode;
  /** Return the string value used for checkbox-filter. Omit = not filterable. */
  filterValue?: (row: T) => string;
  /** Return a comparable value used for sorting. Omit = not sortable. */
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Wrapper class. Defaults to "glass-card overflow-hidden". */
  className?: string;
  /** Optional footer rendered as <tfoot> inside the table. */
  footer?: React.ReactNode;
}

/* ── Component ── */

type SortDir = "asc" | "desc" | null;

export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, data, keyExtractor, onRowClick, className, footer } = props;

  /* sort state */
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  /* filter state: colKey -> set of selected values */
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});

  /* dropdown state */
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set());
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* close dropdown on outside click */
  useEffect(() => {
    if (!openFilter) return;
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [openFilter]);

  /* helpers */
  function getUniqueValues(col: DataColumn<T>): string[] {
    if (!col.filterValue) return [];
    const s = new Set<string>();
    data.forEach((r) => {
      const v = col.filterValue!(r);
      if (v) s.add(v);
    });
    return Array.from(s).sort();
  }

  function handleOpenFilter(colKey: string, e: React.MouseEvent) {
    if (openFilter === colKey) {
      setOpenFilter(null);
      return;
    }
    const col = columns.find((c) => c.key === colKey);
    if (!col) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 240) });
    setOpenFilter(colKey);
    setFilterSearch("");
    const cur = filters[colKey];
    setTempSelected(cur ? new Set(cur) : new Set(getUniqueValues(col)));
  }

  function handleApplyFilter(colKey: string) {
    const col = columns.find((c) => c.key === colKey);
    if (!col) return;
    const all = getUniqueValues(col);
    if (tempSelected.size === all.length || tempSelected.size === 0) {
      setFilters((p) => {
        const n = { ...p };
        delete n[colKey];
        return n;
      });
    } else {
      setFilters((p) => ({ ...p, [colKey]: new Set(tempSelected) }));
    }
    setOpenFilter(null);
  }

  function handleToggleSort(colKey: string) {
    if (sortKey === colKey) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(colKey);
      setSortDir("asc");
    }
  }

  /* processed (filtered + sorted) data */
  const processed = useMemo(() => {
    let res = [...data];
    for (const [ck, sel] of Object.entries(filters)) {
      const c = columns.find((x) => x.key === ck);
      if (c?.filterValue) res = res.filter((r) => sel.has(c.filterValue!(r)));
    }
    if (sortKey && sortDir) {
      const c = columns.find((x) => x.key === sortKey);
      if (c?.sortValue) {
        res.sort((a, b) => {
          const va = c.sortValue!(a);
          const vb = c.sortValue!(b);
          if (typeof va === "number" && typeof vb === "number")
            return sortDir === "asc" ? va - vb : vb - va;
          return sortDir === "asc"
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
        });
      }
    }
    return res;
  }, [data, filters, sortKey, sortDir, columns]);

  const activeCol = openFilter
    ? columns.find((c) => c.key === openFilter)
    : null;

  /* active filter count badge */
  const activeFilterCount = Object.keys(filters).length;

  return (
    <>
      {/* Active filter indicator */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 mb-2 text-xs text-muted">
          <Filter className="w-3.5 h-3.5 text-brand-500" />
          <span>
            {activeFilterCount} column filter{activeFilterCount > 1 ? "s" : ""}{" "}
            active
          </span>
          <span className="text-muted/60">
            ({processed.length} of {data.length} records)
          </span>
          <button
            onClick={() => setFilters({})}
            className="text-brand-500 hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className={className ?? "glass-card overflow-hidden"}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-edge bg-dim/50">
                {columns.map((col) => {
                  const sortable = !!col.sortValue;
                  const filterable = !!col.filterValue;
                  const filtered = !!filters[col.key];
                  const sorted = sortKey === col.key;
                  const ac =
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                        ? "text-center"
                        : "text-left";
                  const jc =
                    col.align === "right"
                      ? "justify-end"
                      : col.align === "center"
                        ? "justify-center"
                        : "";

                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-3 font-medium text-muted whitespace-nowrap ${ac}`}
                    >
                      <div className={`flex items-center gap-1 ${jc}`}>
                        <span>{col.header}</span>

                        {sortable && (
                          <button
                            onClick={() => handleToggleSort(col.key)}
                            className={`p-0.5 rounded hover:bg-hover/80 transition-colors ${sorted ? "text-brand-500" : "text-muted/40 hover:text-muted"}`}
                          >
                            {sorted && sortDir === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : sorted && sortDir === "desc" ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <span className="flex flex-col -space-y-1">
                                <ChevronUp className="w-3 h-3" />
                                <ChevronDown className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        )}

                        {filterable && (
                          <button
                            onClick={(e) => handleOpenFilter(col.key, e)}
                            className={`p-0.5 rounded hover:bg-hover/80 transition-colors ${filtered ? "text-brand-500" : "text-muted/40 hover:text-muted"}`}
                          >
                            <Filter className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {processed.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-sm text-muted"
                  >
                    No matching records
                  </td>
                </tr>
              ) : (
                processed.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`border-b border-edge-light last:border-0 hover:bg-hover/50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {footer}
          </table>
        </div>
      </div>

      {/* ── Filter dropdown (portal) ── */}
      {openFilter &&
        activeCol &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              zIndex: 9999,
            }}
            className="bg-background border border-edge rounded-lg shadow-lg w-56 p-2.5 animate-fade-in"
          >
            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-edge rounded bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Select All / Clear All */}
            <div className="flex justify-between mb-2">
              <button
                onClick={() =>
                  setTempSelected(new Set(getUniqueValues(activeCol)))
                }
                className="text-[11px] text-brand-500 hover:underline"
              >
                Select All
              </button>
              <button
                onClick={() => setTempSelected(new Set())}
                className="text-[11px] text-error-500 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Checkbox list */}
            <div className="max-h-44 overflow-y-auto space-y-0.5 mb-2">
              {getUniqueValues(activeCol)
                .filter(
                  (v) =>
                    !filterSearch ||
                    v.toLowerCase().includes(filterSearch.toLowerCase()),
                )
                .map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-hover cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={tempSelected.has(val)}
                      onChange={() => {
                        setTempSelected((p) => {
                          const n = new Set(p);
                          if (n.has(val)) n.delete(val);
                          else n.add(val);
                          return n;
                        });
                      }}
                      className="w-3.5 h-3.5 rounded border-edge text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-foreground truncate">
                      {val}
                    </span>
                  </label>
                ))}
            </div>

            {/* Apply */}
            <button
              onClick={() => handleApplyFilter(openFilter)}
              className="w-full py-1.5 text-xs font-medium bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
            >
              Apply
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
