"use client";

import { useState, useEffect, useMemo } from "react";
import { getServiceFeedbacks, ServiceFeedback } from "@/lib/api-inventory";
import {
  Star, Phone, Car, Calendar, FileText, Search,
  MessageSquare, ThumbsUp, ThumbsDown, User,
} from "lucide-react";

type Tab = "all" | "scheduled" | "pending";

const STATUS_MAP: Record<ServiceFeedback["status"], { label: string; cls: string }> = {
  reviewed:  { label: "Reviewed",  cls: "bg-ok-light text-ok" },
  scheduled: { label: "Scheduled", cls: "bg-accent-light text-accent" },
  pending:   { label: "Pending",   cls: "bg-warn-light text-warn" },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-warn fill-current" : "text-edge"}`}
        />
      ))}
    </div>
  );
}

export default function ServiceFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<ServiceFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getServiceFeedbacks()
      .then((data) => setFeedbacks(data || []))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load service feedbacks");
      })
      .finally(() => setLoading(false));
  }, []);

  const safeFeedbacks = feedbacks || [];

  // -- derived counts --
  const reviewed  = useMemo(() => safeFeedbacks.filter((f) => f.status === "reviewed"), [safeFeedbacks]);
  const scheduled = useMemo(() => safeFeedbacks.filter((f) => f.status === "scheduled"), [safeFeedbacks]);
  const pending   = useMemo(() => safeFeedbacks.filter((f) => f.status === "pending"), [safeFeedbacks]);

  const avgRating = useMemo(() => {
    if (safeFeedbacks.length === 0) return 0;
    return safeFeedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / safeFeedbacks.length;
  }, [safeFeedbacks]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0]; // index 0 = 1-star, index 4 = 5-star
    safeFeedbacks.forEach((f) => { const r = f.rating ?? 0; if (r >= 1 && r <= 5) dist[r - 1]++; });
    return dist;
  }, [safeFeedbacks]);

  const maxRatingCount = Math.max(...ratingDistribution, 1);

  // -- filtered list --
  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return reviewed;
    if (activeTab === "scheduled") return scheduled;
    return pending;
  }, [activeTab, reviewed, scheduled, pending]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tabFiltered;
    const q = search.toLowerCase();
    return tabFiltered.filter(
      (f) =>
        (f.customerName ?? "").toLowerCase().includes(q) ||
        (f.vehicleNumber ?? "").toLowerCase().includes(q),
    );
  }, [search, tabFiltered]);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all",       label: "All Reviews", count: reviewed.length },
    { key: "scheduled", label: "Scheduled",   count: scheduled.length },
    { key: "pending",   label: "Pending",     count: pending.length },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ── Header ── */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Service Feedbacks</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">
            {safeFeedbacks.length}
          </span>
        </div>
        <p className="text-sm text-muted hidden sm:block">Customer reviews &amp; feedback for completed services</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* ── Overview Stats ── */}
            <div className="px-6 pt-5 pb-2">
              <div className="bg-background rounded-xl border border-edge p-5 flex flex-col md:flex-row gap-6">
                {/* Average Rating */}
                <div className="flex flex-col items-center justify-center md:border-r md:border-edge-light md:pr-6 min-w-[140px]">
                  <p className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
                  <StarRating rating={Math.round(avgRating)} />
                  <p className="text-xs text-muted mt-1">Average Rating</p>
                </div>

                {/* Total Reviews */}
                <div className="flex flex-col items-center justify-center md:border-r md:border-edge-light md:pr-6 min-w-[100px]">
                  <div className="flex items-center gap-2 mb-1">
                    <ThumbsUp className="w-5 h-5 text-ok" />
                    <span className="text-2xl font-bold text-foreground">{safeFeedbacks.length}</span>
                  </div>
                  <p className="text-xs text-muted">Total Reviews</p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingDistribution[star - 1];
                    const pct = (count / maxRatingCount) * 100;
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right text-secondary font-medium">{star}</span>
                        <Star className="w-3 h-3 text-warn fill-current" />
                        <div className="flex-1 h-2 bg-dim rounded-full overflow-hidden">
                          <div
                            className="h-full bg-warn rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-5 text-right text-muted">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="px-6 pt-3 pb-1">
              <div className="flex gap-1 border-b border-edge-light">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-secondary hover:border-edge"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? "bg-primary-light text-primary"
                          : "bg-hover text-muted"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Search ── */}
            <div className="px-6 pt-3 pb-2">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by customer name or vehicle number..."
                  className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* ── Feedback Cards ── */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
                  <MessageSquare className="w-8 h-8 text-muted" />
                </div>
                <p className="text-foreground font-medium mb-1">No feedbacks found</p>
                <p className="text-muted text-sm">
                  {search
                    ? "No feedbacks match your search criteria."
                    : `No ${activeTab === "all" ? "reviewed" : activeTab} feedbacks yet.`}
                </p>
              </div>
            ) : (
              <div className="px-6 py-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtered.map((fb, idx) => (
                  <FeedbackCard key={fb.id} feedback={fb} index={idx} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback: fb, index }: { feedback: ServiceFeedback; index: number }) {
  const status = STATUS_MAP[fb.status];

  return (
    <div
      className="bg-background rounded-xl border border-edge p-5 hover:shadow-md transition-shadow animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Top: Rating + Status */}
      <div className="flex items-center justify-between mb-3">
        <StarRating rating={fb.rating} />
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.cls}`}>
          {status.label}
        </span>
      </div>

      {/* Customer Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted flex-shrink-0" />
          <span className="font-medium text-foreground">{fb.customerName || "Unknown"}</span>
          <span className="text-muted">|</span>
          <Phone className="w-3.5 h-3.5 text-muted flex-shrink-0" />
          <span className="text-secondary">{fb.customerPhone || "-"}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-secondary">
          <Car className="w-4 h-4 text-muted flex-shrink-0" />
          <span>{fb.vehicleName || "-"}</span>
          <span className="text-muted">&middot;</span>
          <span className="font-mono text-xs tracking-wider">{fb.vehicleNumber || "-"}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-secondary">
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-muted flex-shrink-0" />
            {fb.jobCard || "-"}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-muted flex-shrink-0" />
            {fb.date || "-"}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="bg-dim rounded-lg px-4 py-3 mb-3">
        <p className="text-sm text-secondary leading-relaxed">{fb.comment || "-"}</p>
      </div>

      {/* Services Tags */}
      <div className="flex flex-wrap gap-1.5">
        {(fb.services || []).map((svc) => (
          <span
            key={svc}
            className="text-xs bg-primary-light text-primary font-medium px-2 py-0.5 rounded-full"
          >
            {svc}
          </span>
        ))}
      </div>
    </div>
  );
}
