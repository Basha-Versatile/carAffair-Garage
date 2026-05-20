"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  GarageRegistration,
  getGarageRegistrations,
} from "@/lib/api-garage-registration";
import { DataTable, DataColumn } from "@/components/tables/DataTable";

type TabFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const tabs: { label: string; value: TabFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-warn-light text-warn">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
    case "APPROVED":
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-ok-light text-ok">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    case "REJECTED":
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bad-light text-bad">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    default:
      return null;
  }
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const TABLE_CLS =
  "bg-background rounded-lg border border-edge overflow-hidden";

const columns: DataColumn<GarageRegistration>[] = [
  {
    key: "name",
    header: "Garage Name",
    render: (r) => (
      <span className="font-medium text-foreground">{r.name}</span>
    ),
    sortValue: (r) => r.name,
  },
  {
    key: "owner",
    header: "Owner",
    render: (r) => <span className="text-secondary">{r.ownerName || "-"}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    render: (r) => <span className="text-muted">{r.phone || "-"}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (r) => (
      <span className="text-muted truncate max-w-[180px] block">
        {r.email || "-"}
      </span>
    ),
  },
  {
    key: "submitted",
    header: "Submitted",
    render: (r) => (
      <span className="text-muted text-xs">
        {r.createdAt ? formatDate(r.createdAt) : "-"}
      </span>
    ),
    sortValue: (r) => r.createdAt || "",
  },
  {
    key: "status",
    header: "Status",
    render: (r) => statusBadge(r.status),
    filterValue: (r) => r.status,
  },
  {
    key: "actions",
    header: "Actions",
    render: (r) => (
      <Link
        href={`/dashboard/super-admin/garage-requests/${r.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <Eye className="w-3.5 h-3.5" />
        View
      </Link>
    ),
  },
];

export default function GarageRequestsPage() {
  const [registrations, setRegistrations] = useState<GarageRegistration[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabFilter>("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getGarageRegistrations();
        setRegistrations(data || []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load registrations"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = registrations.filter((r) => {
    if (tab !== "ALL" && r.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.ownerName ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = registrations.filter(
    (r) => r.status === "PENDING"
  ).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">
            Garage Requests
          </h1>
          {pendingCount > 0 && (
            <span className="bg-warn-light text-warn text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Tabs + Search */}
        <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 border border-edge rounded-lg p-0.5">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  tab === t.value
                    ? "bg-primary text-white"
                    : "text-muted hover:text-foreground hover:bg-hover"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, or owner"
              className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-bad">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <ClipboardList className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted text-sm">
              {registrations.length === 0
                ? "No registration requests yet."
                : "No requests match your filter."}
            </p>
          </div>
        ) : (
          <div className="px-6 py-4">
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(r) => r.id}
              className={TABLE_CLS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
