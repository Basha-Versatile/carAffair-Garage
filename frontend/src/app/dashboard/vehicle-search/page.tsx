"use client";

import { useState, useEffect } from "react";
import { getVehicles, getBrandById, getModelById, getCustomerById, Vehicle } from "@/lib/api-vehicles";
import { Search, Car, User, Phone, Calendar, Shield, Loader2 } from "lucide-react";

interface VehicleWithDetails extends Vehicle {
  brandName: string; modelName: string; fuelType: string;
  category: string; customerName: string; customerPhone: string;
}

export default function VehicleSearchPage() {
  const [search, setSearch] = useState("");
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    setLoading(true);
    setError("");
    try {
      const raw = await getVehicles();
      const enriched = await Promise.all((raw || []).map(async (v) => {
        const brand = v.brandName ? null : await getBrandById(v.brandId || "");
        const model = v.modelName ? null : await getModelById(v.modelId || "");
        const customer = await getCustomerById(v.customerId);
        return {
          ...v,
          brandName: v.brandName || brand?.name || "Unknown",
          modelName: v.modelName || model?.name || "Unknown",
          fuelType: v.fuelType || model?.fuelType || "",
          category: v.category || model?.category || "",
          customerName: customer?.name || "Unknown",
          customerPhone: customer?.phone || "",
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
    const q = search.toLowerCase();
    return (v.registrationNumber ?? "").toLowerCase().includes(q) || (v.brandName ?? "").toLowerCase().includes(q) ||
      (v.modelName ?? "").toLowerCase().includes(q) || (v.customerName ?? "").toLowerCase().includes(q) || (v.customerPhone ?? "").includes(q);
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground mb-1">Vehicle Search</h1>
        <p className="text-sm text-muted">Search vehicles by registration number, brand, model, or customer</p>
      </div>

      {/* Search */}
      <div className="max-w-md mb-6">
        <div className="relative">
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
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
            <Car className="w-8 h-8 text-muted" />
          </div>
          <p className="text-muted text-sm">
            {vehicles.length === 0 ? "No vehicles added yet. Create a repair order to add vehicles." : "No vehicles match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="bg-background rounded-lg border border-edge p-5 hover:shadow-md transition-shadow">
              {/* Reg number badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary px-3 py-1 rounded-lg text-sm font-semibold tracking-wider">
                  <Car className="w-3.5 h-3.5" />{v.registrationNumber}
                </span>
                <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{v.category || "-"}</span>
              </div>

              {/* Vehicle info */}
              <p className="font-medium text-foreground text-sm">{v.brandName || "Unknown"} {v.modelName || "Unknown"}</p>
              <p className="text-xs text-muted mt-0.5">{v.fuelType || "-"}</p>

              {/* Customer info */}
              <div className="mt-3 pt-3 border-t border-edge-light space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <User className="w-3.5 h-3.5 text-muted" />{v.customerName || "Unknown"}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Phone className="w-3.5 h-3.5 text-muted" />{v.customerPhone || "-"}
                </div>
              </div>

              {/* Extra details */}
              {(v.purchaseDate || v.insuranceExpiry) && (
                <div className="mt-3 pt-3 border-t border-edge-light flex flex-wrap gap-3 text-xs text-muted">
                  {v.purchaseDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Purchased: {v.purchaseDate}</span>}
                  {v.insuranceExpiry && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Insurance: {v.insuranceExpiry}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
