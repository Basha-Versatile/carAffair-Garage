"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getVehicles, getBrandById, getModelById, getCustomerById, Vehicle } from "@/lib/api-vehicles";
import { Search, Car, User, Phone, Calendar, Shield, Loader2, LayoutGrid, List, Plus } from "lucide-react";
import { canManage } from "@/lib/auth";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

type ViewMode = "cards" | "table";

interface VehicleWithDetails extends Vehicle {
  brandName: string; modelName: string; fuelType: string;
  category: string; customerName: string; customerPhone: string;
}

const vehicleColumns: DataColumn<VehicleWithDetails>[] = [
  {
    key: "regNumber",
    header: "Reg. Number",
    render: (v) => <span className="font-semibold text-primary tracking-wider">{v.registrationNumber}</span>,
    sortValue: (v) => v.registrationNumber,
  },
  {
    key: "brandModel",
    header: "Brand / Model",
    render: (v) => <span className="font-medium text-foreground">{v.brandName} {v.modelName}</span>,
    filterValue: (v) => v.brandName || "",
  },
  {
    key: "fuel",
    header: "Fuel",
    render: (v) => <span className="text-muted">{v.fuelType || "-"}</span>,
    filterValue: (v) => v.fuelType || "",
  },
  {
    key: "category",
    header: "Category",
    render: (v) => <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{v.category || "-"}</span>,
    filterValue: (v) => v.category || "",
  },
  {
    key: "customer",
    header: "Customer",
    render: (v) => <span className="text-secondary">{v.customerName || "Unknown"}</span>,
  },
  {
    key: "phone",
    header: "Phone",
    render: (v) => <span className="text-muted">{v.customerPhone || "-"}</span>,
  },
  {
    key: "purchaseDate",
    header: "Purchase Date",
    render: (v) => <span className="text-muted">{v.purchaseDate || "-"}</span>,
    sortValue: (v) => v.purchaseDate ? new Date(v.purchaseDate).getTime() : 0,
  },
  {
    key: "insurance",
    header: "Insurance Expiry",
    render: (v) => <span className="text-muted">{v.insuranceExpiry || "-"}</span>,
    sortValue: (v) => v.insuranceExpiry ? new Date(v.insuranceExpiry).getTime() : 0,
  },
];

export default function VehicleSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandParam = searchParams.get("brand") || "";
  const [search, setSearch] = useState(brandParam);
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [cardPage, setCardPage] = useState(1);
  const [cardPageSize, setCardPageSize] = useState<PageSize>(PAGE_SIZES[0]);

  useEffect(() => { loadVehicles(); }, []);
  useEffect(() => { setCardPage(1); }, [search]);

  async function loadVehicles() {
    setLoading(true);
    setError("");
    try {
      const raw = await getVehicles();
      const enriched = await Promise.all((raw || []).map(async (v) => {
        let brandName = v.brandName || "";
        let modelName = v.modelName || "";
        let fuelType = v.fuelType || "";
        let category = v.category || "";
        let customerName = "";
        let customerPhone = "";

        try {
          if (!brandName && v.brandId) {
            const brand = await getBrandById(v.brandId);
            brandName = brand?.name || "Unknown";
          }
          if (!modelName && v.modelId) {
            const model = await getModelById(v.modelId);
            modelName = model?.name || "Unknown";
            if (!fuelType) fuelType = model?.fuelType || "";
            if (!category) category = model?.category || "";
          }
          const customer = await getCustomerById(v.customerId);
          customerName = customer?.name || "Unknown";
          customerPhone = customer?.phone || "";
        } catch {
          // silently handle enrichment failures
        }

        return {
          ...v,
          brandName: brandName || "Unknown",
          modelName: modelName || "Unknown",
          fuelType,
          category,
          customerName,
          customerPhone,
        };
      }));
      setVehicles(enriched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  const filtered = (vehicles || []).filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (v.registrationNumber ?? "").toLowerCase().includes(q) || (v.brandName ?? "").toLowerCase().includes(q) ||
      (v.modelName ?? "").toLowerCase().includes(q) || (v.customerName ?? "").toLowerCase().includes(q) || (v.customerPhone ?? "").includes(q);
  });

  const hasSearch = search.trim().length > 0;
  const noResults = hasSearch && filtered.length === 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-foreground">Vehicles</h1>
          <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">
            {vehicles.length}
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
          {canManage("VEHICLES") && (
            <button
              onClick={() => router.push("/dashboard/create-order")}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reg. number, brand, model, customer..."
              className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-bad">{error}</p>
          </div>
        ) : noResults ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Car className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">Vehicle not found</p>
            <p className="text-muted text-sm mb-5">
              No vehicles match &quot;{search}&quot;. You can add it as a new vehicle.
            </p>
            {canManage("VEHICLES") && (
              <button
                onClick={() => router.push("/dashboard/create-order")}
                className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Vehicle
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
              <Car className="w-8 h-8 text-muted" />
            </div>
            <p className="text-foreground font-medium mb-1">No vehicles yet</p>
            <p className="text-muted text-sm mb-5">Create a job card to add vehicles.</p>
            {canManage("VEHICLES") && (
              <button
                onClick={() => router.push("/dashboard/create-order")}
                className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Vehicle
              </button>
            )}
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
                    {paged.map((v) => (
                      <div key={v.id} className="bg-background rounded-lg border border-edge p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary px-3 py-1 rounded-lg text-sm font-semibold tracking-wider">
                            <Car className="w-3.5 h-3.5" />{v.registrationNumber}
                          </span>
                          <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{v.category || "-"}</span>
                        </div>
                        <p className="font-medium text-foreground text-sm">{v.brandName || "Unknown"} {v.modelName || "Unknown"}</p>
                        <p className="text-xs text-muted mt-0.5">{v.fuelType || "-"}</p>
                        <div className="mt-3 pt-3 border-t border-edge-light space-y-1.5">
                          <div className="flex items-center gap-2 text-sm text-secondary">
                            <User className="w-3.5 h-3.5 text-muted" />{v.customerName || "Unknown"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-secondary">
                            <Phone className="w-3.5 h-3.5 text-muted" />{v.customerPhone || "-"}
                          </div>
                        </div>
                        {(v.purchaseDate || v.insuranceExpiry) && (
                          <div className="mt-3 pt-3 border-t border-edge-light flex flex-wrap gap-3 text-xs text-muted">
                            {v.purchaseDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Purchased: {v.purchaseDate}</span>}
                            {v.insuranceExpiry && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Insurance: {v.insuranceExpiry}</span>}
                          </div>
                        )}
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
              columns={vehicleColumns}
              data={filtered}
              keyExtractor={(v) => v.id}
              className={TABLE_CLS}
            />
          </div>
        )}
      </div>
    </div>
  );
}
