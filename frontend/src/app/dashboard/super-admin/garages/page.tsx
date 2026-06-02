"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Building2, Plus, Search, Phone, Mail, MapPin, CheckCircle, XCircle, LayoutGrid, List,
} from "lucide-react";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

const TABLE_CLS = "glass-card overflow-hidden";

type ViewMode = "cards" | "table";

interface Garage {
  id: string;
  name: string;
  ownerName: string;
  gstNumber: string;
  email: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  adminUserId: string;
  createdAt: string;
  updatedAt: string;
}

const garageColumns: DataColumn<Garage>[] = [
  {
    key: "name",
    header: "Name",
    render: (g) => <span className="font-medium text-foreground">{g.name}</span>,
    sortValue: (g) => g.name,
  },
  {
    key: "owner",
    header: "Owner",
    render: (g) => <span className="text-secondary">{g.ownerName || "-"}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    render: (g) => <span className="text-muted">{g.phone || "-"}</span>,
  },
  {
    key: "email",
    header: "Email",
    render: (g) => <span className="text-muted truncate max-w-[180px] block">{g.email || "-"}</span>,
  },
  {
    key: "address",
    header: "Address",
    render: (g) => <span className="text-muted truncate max-w-[200px] block">{g.address || "-"}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (g) =>
      g.isActive ? (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ok-light text-ok">Active</span>
      ) : (
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-bad-light text-bad">Inactive</span>
      ),
    filterValue: (g) => (g.isActive ? "Active" : "Inactive"),
  },
  {
    key: "actions",
    header: "Actions",
    render: (g) => (
      <Link href={`/dashboard/super-admin/garages/${g.id}`} className="text-sm font-medium text-primary hover:underline">
        View
      </Link>
    ),
  },
];

export default function GaragesPage() {
  const router = useRouter();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [cardPage, setCardPage] = useState(1);
  const [cardPageSize, setCardPageSize] = useState<PageSize>(PAGE_SIZES[0]);

  useEffect(() => {
    async function fetchGarages() {
      try {
        const data = await api.get<Garage[]>("/api/garages");
        setGarages(data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load garages");
      } finally {
        setLoading(false);
      }
    }
    fetchGarages();
  }, []);

  useEffect(() => { setCardPage(1); }, [search]);

  const filtered = (garages || []).filter((g) => {
    const q = search.toLowerCase();
    return (
      (g.name ?? "").toLowerCase().includes(q) ||
      (g.phone ?? "").includes(q) ||
      (g.address ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Garage Management</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">
            {garages.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
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
          <Link
            href="/dashboard/super-admin/garages/create"
            className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Garage
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or address"
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
              <Building2 className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted text-sm">
              {garages.length === 0
                ? "No garages yet. Register your first garage."
                : "No garages match your search."}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="px-6 py-4">
            {(() => {
              const totalPages = Math.max(1, Math.ceil(filtered.length / cardPageSize));
              const safePage = Math.min(cardPage, totalPages);
              const start = (safePage - 1) * cardPageSize;
              const paged = filtered.slice(start, start + cardPageSize);
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paged.map((garage) => (
                      <div
                        key={garage.id}
                        onClick={() => router.push(`/dashboard/super-admin/garages/${garage.id}`)}
                        className="glass-card p-5 hover:shadow-theme-lg transition-shadow cursor-pointer"
                      >
                        {/* Name + Status */}
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {garage.name}
                          </h3>
                          {garage.isActive ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-ok-light text-ok shrink-0">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-bad-light text-bad shrink-0">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Owner */}
                        <p className="text-sm text-secondary mb-2">{garage.ownerName || "-"}</p>

                        {/* Contact */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Phone className="w-3.5 h-3.5 shrink-0" />
                            <span>{garage.phone || "-"}</span>
                          </div>
                          {garage.email && (
                            <div className="flex items-center gap-2 text-sm text-muted">
                              <Mail className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{garage.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{garage.address || "-"}</span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="pt-3 border-t border-edge-light">
                          <Link
                            href={`/dashboard/super-admin/garages/${garage.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-background rounded-lg border border-edge overflow-hidden mt-4">
                    <Pagination total={filtered.length} page={safePage} pageSize={cardPageSize} onPageChange={setCardPage} onPageSizeChange={setCardPageSize} />
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="px-6 py-4">
            <DataTable
              columns={garageColumns}
              data={filtered}
              keyExtractor={(g) => g.id}
              onRowClick={(g) => router.push(`/dashboard/super-admin/garages/${g.id}`)}
              className={TABLE_CLS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
