"use client";

import { useState, useEffect, useCallback } from "react";
import { getOrders, Order } from "@/lib/api-orders";
import {
  Search,
  FileText,
  Phone,
  Car,
  Calendar,
  IndianRupee,
  Filter,
  X,
  LayoutGrid,
  List,
} from "lucide-react";

type ViewMode = "cards" | "table";

const statusConfig: Record<
  Order["status"],
  { label: string; text: string; bg: string }
> = {
  open: { label: "Open", text: "text-primary", bg: "bg-primary-light" },
  wip: { label: "WIP", text: "text-warn", bg: "bg-warn-light" },
  ready: { label: "Ready", text: "text-ok", bg: "bg-ok-light" },
  payment_due: { label: "Payment Due", text: "text-bad", bg: "bg-bad-light" },
  completed: { label: "Completed", text: "text-muted", bg: "bg-dim" },
};

export default function OrderSearchPage() {
  const today = new Date().toISOString().split("T")[0];
  const [jobCardQuery, setJobCardQuery] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [results, setResults] = useState<Order[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const runSearch = useCallback(async (jcQ: string, vQ: string, from: string, to: string) => {
    setSearching(true);
    setError("");
    try {
      const allOrders = await getOrders();
      const jc = jcQ.trim().toLowerCase();
      const vq = vQ.trim().toLowerCase();

      const filtered = (allOrders || []).filter((order) => {
        if (jc) {
          const matchesJobCard = (order.jobCard ?? "").toLowerCase().includes(jc);
          const matchesCustomer = (order.customerName ?? "").toLowerCase().includes(jc);
          if (!matchesJobCard && !matchesCustomer) return false;
        }
        if (vq) {
          const matchesVehicleNumber = (order.vehicleNumber ?? "").toLowerCase().includes(vq);
          const matchesVehicle = (order.vehicle ?? "").toLowerCase().includes(vq);
          if (!matchesVehicleNumber && !matchesVehicle) return false;
        }
        if (from && (order.date ?? "") < from) return false;
        if (to && (order.date ?? "") > to) return false;
        return true;
      });

      setResults(filtered);
      setHasSearched(true);
    } catch {
      setError("Failed to search orders. Please try again.");
      setResults([]);
      setHasSearched(true);
    }
    finally { setSearching(false); }
  }, []);

  // Auto-fetch today's orders on mount
  useEffect(() => {
    runSearch("", "", today, today);
  }, [runSearch, today]);

  function handleSearch() {
    runSearch(jobCardQuery, vehicleQuery, dateFrom, dateTo);
  }

  function handleClear() {
    setJobCardQuery("");
    setVehicleQuery("");
    setDateFrom(today);
    setDateTo(today);
    runSearch("", "", today, today);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground mb-1">
            Order Search
          </h1>
          <p className="text-sm text-muted">
            Search by Job Card, Invoice, Vehicle, or Customer
          </p>
        </div>
        <div className="flex items-center border border-edge rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("cards")}
            className={`p-2 transition-colors ${viewMode === "cards" ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
            title="Card view">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("table")}
            className={`p-2 transition-colors ${viewMode === "table" ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
            title="Table view">
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Fields */}
      <div className="bg-background border border-edge rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Search Filters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Job Card / RO Search */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Job Card / Customer Name
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={jobCardQuery}
                onChange={(e) => setJobCardQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. JC-2025-001 or Rajesh"
                className="w-full pl-9 pr-4 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Vehicle Number Search */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Vehicle Number
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. TS 09 AB 1234"
                className="w-full pl-9 pr-4 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Date Range
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-2 py-2.5 border border-edge rounded-md text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <span className="text-xs text-muted">to</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-2 py-2.5 border border-edge rounded-md text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {searching ? "Searching..." : "Search"}
          </button>
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-edge text-secondary text-sm font-medium rounded-md hover:bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && !searching && (
        <div className="text-center py-16">
          <p className="text-sm text-bad">{error}</p>
        </div>
      )}

      {/* Results */}
      {hasSearched && !searching && !error && (
        <div>
          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-secondary">
              Found{" "}
              <span className="font-semibold text-foreground">
                {results.length}
              </span>{" "}
              {results.length === 1 ? "result" : "results"}
            </p>
          </div>

          {results.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
                <Search className="w-8 h-8 text-muted" />
              </div>
              <p className="text-muted text-sm">
                No orders match your search criteria. Try adjusting the filters.
              </p>
            </div>
          ) : viewMode === "cards" ? (
            /* Results Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(results || []).map((order) => {
                const status = statusConfig[order.status] ?? { label: order.status ?? "-", text: "text-muted", bg: "bg-dim" };
                return (
                  <div
                    key={order.id}
                    className="animate-slide-up bg-background rounded-lg border border-edge p-5 hover:shadow-md transition-shadow"
                  >
                    {/* Job Card + Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <FileText className="w-4 h-4 text-primary" />
                        {order.jobCard || "-"}
                      </span>
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${status.text} ${status.bg}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1.5 mb-3">
                      <p className="text-sm font-medium text-foreground">
                        {order.customerName || "-"}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-secondary">
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        {order.phone || "-"}
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex items-center gap-1.5 mb-3 text-sm text-secondary">
                      <Car className="w-3.5 h-3.5 text-muted" />
                      <span>
                        {order.vehicle || "-"}{" "}
                        <span className="text-muted">
                          ({order.vehicleNumber || "-"})
                        </span>
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 mb-3 text-xs text-muted">
                      <Calendar className="w-3.5 h-3.5" />
                      {order.date || "-"}
                    </div>

                    {/* Services */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(order.services || []).map((service) => (
                        <span
                          key={service}
                          className="text-xs bg-accent-light text-accent px-2 py-0.5 rounded-md"
                        >
                          {service}
                        </span>
                      ))}
                    </div>

                    {/* Amount */}
                    <div className="pt-3 border-t border-edge-light flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-foreground" />
                      <span className="text-sm font-semibold text-foreground">
                        {(order.amount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Results Table */
            <div className="bg-background rounded-lg border border-edge overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dim border-b border-edge">
                    <th className="text-left px-4 py-3 font-medium text-secondary">Job Card</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Vehicle</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Services</th>
                    <th className="text-left px-4 py-3 font-medium text-secondary">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-secondary">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge-light">
                  {(results || []).map((order) => {
                    const status = statusConfig[order.status] ?? { label: order.status ?? "-", text: "text-muted", bg: "bg-dim" };
                    return (
                      <tr key={order.id} className="hover:bg-hover transition-colors cursor-pointer">
                        <td className="px-4 py-3 font-medium text-foreground">{order.jobCard || "-"}</td>
                        <td className="px-4 py-3 text-secondary">{order.customerName || "-"}</td>
                        <td className="px-4 py-3 text-muted">{order.phone || "-"}</td>
                        <td className="px-4 py-3 text-secondary">
                          {order.vehicle || "-"} <span className="text-muted">({order.vehicleNumber || "-"})</span>
                        </td>
                        <td className="px-4 py-3 text-muted">{order.date || "-"}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(order.services || []).map((s) => (
                              <span key={s} className="text-[11px] bg-accent-light text-accent px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${status.text} ${status.bg}`}>{status.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {(order.amount ?? 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Loading state while searching */}
      {searching && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4 animate-spin">
            <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-muted text-sm">Searching orders...</p>
        </div>
      )}

      {/* Initial state before first search completes */}
      {!hasSearched && !searching && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
            <Search className="w-8 h-8 text-muted" />
          </div>
          <p className="text-muted text-sm">Loading today&apos;s orders...</p>
        </div>
      )}
    </div>
  );
}
