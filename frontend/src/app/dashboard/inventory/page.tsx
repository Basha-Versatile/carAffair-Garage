"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getParts, Part, PART_CATEGORIES,
  getPurchaseOrders, PurchaseOrder,
  getStockInRecords, StockInRecord,
  getCounterSales, CounterSale,
} from "@/lib/api-inventory";
import {
  Search, Plus, Package, ShoppingCart, ArrowDownToLine, Receipt,
  Filter, IndianRupee, MapPin, Hash,
} from "lucide-react";

type TabKey = "parts" | "po" | "stockin" | "countersale";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "parts", label: "Parts", icon: <Package className="w-4 h-4" /> },
  { key: "po", label: "Purchase Orders", icon: <ShoppingCart className="w-4 h-4" /> },
  { key: "stockin", label: "Stock In", icon: <ArrowDownToLine className="w-4 h-4" /> },
  { key: "countersale", label: "Counter Sale", icon: <Receipt className="w-4 h-4" /> },
];

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("parts");
  const [parts, setParts] = useState<Part[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>([]);
  const [counterSales, setCounterSales] = useState<CounterSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      getParts(),
      getPurchaseOrders(),
      getStockInRecords(),
      getCounterSales(),
    ]).then(([p, po, si, cs]) => {
      setParts(p || []);
      setPurchaseOrders(po || []);
      setStockInRecords(si || []);
      setCounterSales(cs || []);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load inventory data");
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5">
        <h1 className="text-base font-semibold text-foreground">Inventory</h1>
      </div>

      {/* Tabs */}
      <div className="bg-background border-b border-edge px-6">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-secondary hover:border-edge"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto animate-fade-in">
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
            {activeTab === "parts" && <PartsTab parts={parts} />}
            {activeTab === "po" && <PurchaseOrdersTab orders={purchaseOrders} onCreatePO={() => router.push("/dashboard/inventory/purchase-order")} />}
            {activeTab === "stockin" && <StockInTab records={stockInRecords} onNewStockIn={() => router.push("/dashboard/inventory/stock-in")} />}
            {activeTab === "countersale" && <CounterSaleTab sales={counterSales} onNewSale={() => router.push("/dashboard/inventory/counter-sale")} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Parts Tab ─────────────────────────── */

function PartsTab({ parts }: { parts: Part[] }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = (parts || []).filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (p.name ?? "").toLowerCase().includes(q) ||
      (p.partNumber ?? "").toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-4 animate-slide-up">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search parts by name, part#, brand..."
            className="w-full pl-10 pr-4 py-2.5 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {PART_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors ml-auto">
          <Plus className="w-4 h-4" />
          Add Part
        </button>
      </div>

      {/* Parts Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">{filtered.length} parts found</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
            <Package className="w-8 h-8 text-muted" />
          </div>
          <p className="text-foreground font-medium mb-1">No parts found</p>
          <p className="text-muted text-sm">
            {parts.length === 0 ? "Add your first part to get started." : "Try adjusting your search or filter."}
          </p>
        </div>
      ) : (
        <div className="bg-background rounded-lg border border-edge overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-dim border-b border-edge">
                  <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Part Name / Part#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Brand</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Category</th>
                  <th className="text-right px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Stock Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-secondary whitespace-nowrap">MRP</th>
                  <th className="text-right px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Selling Price</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">Rack#</th>
                  <th className="text-left px-4 py-2.5 font-medium text-secondary whitespace-nowrap">HSN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge-light">
                {filtered.map((part) => (
                  <tr
                    key={part.id}
                    className="hover:bg-hover transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{part.name}</p>
                      <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                        <Hash className="w-3 h-3" />
                        {part.partNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{part.brand}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block bg-dim text-secondary text-xs font-medium px-2 py-0.5 rounded">
                        {part.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                      (part.stockQty ?? 0) <= (part.minStockQty ?? 0) ? "text-bad" : "text-foreground"
                    }`}>
                      {part.stockQty ?? 0}
                      {(part.stockQty ?? 0) <= (part.minStockQty ?? 0) && (
                        <span className="text-xs text-bad ml-1">(Low)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {(part.mrp ?? 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />
                        {(part.sellingPrice ?? 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-muted text-xs">
                        <MapPin className="w-3 h-3" />
                        {part.rackNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{part.hsnCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Purchase Orders Tab ─────────────────────── */

function poStatusStyle(status: PurchaseOrder["status"]) {
  switch (status) {
    case "draft": return "bg-dim text-secondary";
    case "ordered": return "bg-accent-light text-accent";
    case "received": return "bg-ok-light text-ok";
    case "cancelled": return "bg-bad-light text-bad";
  }
}

function PurchaseOrdersTab({ orders, onCreatePO }: { orders: PurchaseOrder[]; onCreatePO: () => void }) {
  const safeOrders = orders || [];
  return (
    <div className="p-6 space-y-4 animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-secondary">
          {safeOrders.length} purchase order{safeOrders.length !== 1 ? "s" : ""}
        </h2>
        <button onClick={onCreatePO} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" />
          Create PO
        </button>
      </div>

      {safeOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
            <ShoppingCart className="w-8 h-8 text-muted" />
          </div>
          <p className="text-foreground font-medium mb-1">No purchase orders</p>
          <p className="text-muted text-sm">Create your first purchase order to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {safeOrders.map((po) => (
            <div
              key={po.id}
              className="bg-background border border-edge rounded-lg p-4 hover:bg-hover transition-colors cursor-pointer animate-scale-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{po.poNumber}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${poStatusStyle(po.status)}`}>
                      {po.status}
                    </span>
                  </div>
                  <p className="text-sm text-secondary">{po.vendorName}</p>
                  <p className="text-xs text-muted mt-1">{po.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted mb-0.5">{(po.items || []).length} item{(po.items || []).length !== 1 ? "s" : ""}</p>
                  <p className="text-sm font-semibold text-foreground flex items-center justify-end gap-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {(po.grandTotal ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Stock In Tab ─────────────────────────── */

function StockInTab({ records, onNewStockIn }: { records: StockInRecord[]; onNewStockIn: () => void }) {
  const safeRecords = records || [];
  return (
    <div className="p-6 space-y-4 animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-secondary">
          {safeRecords.length} stock-in record{safeRecords.length !== 1 ? "s" : ""}
        </h2>
        <button onClick={onNewStockIn} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" />
          New Stock In
        </button>
      </div>

      {safeRecords.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
            <ArrowDownToLine className="w-8 h-8 text-muted" />
          </div>
          <p className="text-foreground font-medium mb-1">No stock-in records</p>
          <p className="text-muted text-sm">Record your first stock-in entry.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {safeRecords.map((rec) => (
            <div
              key={rec.id}
              className="bg-background border border-edge rounded-lg p-4 hover:bg-hover transition-colors cursor-pointer animate-scale-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{rec.invoiceNumber}</h3>
                    {rec.isGstBill && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ok-light text-ok">GST</span>
                    )}
                  </div>
                  <p className="text-sm text-secondary">{rec.vendorName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-muted">{rec.date}</p>
                    <span className="text-xs font-medium text-muted px-2 py-0.5 rounded bg-dim capitalize">
                      {rec.paymentChannel}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted mb-0.5">{(rec.items || []).length} item{(rec.items || []).length !== 1 ? "s" : ""}</p>
                  <p className="text-sm font-semibold text-foreground flex items-center justify-end gap-0.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {(rec.grandTotal ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Counter Sale Tab ─────────────────────── */

function csPaymentStyle(status: CounterSale["paymentStatus"]) {
  switch (status) {
    case "paid": return "bg-ok-light text-ok";
    case "pending": return "bg-warn-light text-warn";
    case "partial": return "bg-accent-light text-accent";
  }
}

function CounterSaleTab({ sales, onNewSale }: { sales: CounterSale[]; onNewSale: () => void }) {
  const safeSales = sales || [];
  return (
    <div className="p-6 space-y-4 animate-slide-up">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-secondary">
          {safeSales.length} counter sale{safeSales.length !== 1 ? "s" : ""}
        </h2>
        <button onClick={onNewSale} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors">
          <Plus className="w-4 h-4" />
          New Sale
        </button>
      </div>

      {safeSales.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center bg-hover p-4 rounded-full mb-4">
            <Receipt className="w-8 h-8 text-muted" />
          </div>
          <p className="text-foreground font-medium mb-1">No counter sales</p>
          <p className="text-muted text-sm">Create your first counter sale.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {safeSales.map((sale) => {
            const itemCount = (sale.items || []).length;
            const serviceCount = (sale.services || []).length;
            return (
              <div
                key={sale.id}
                className="bg-background border border-edge rounded-lg p-4 hover:bg-hover transition-colors cursor-pointer animate-scale-in"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{sale.invoiceNumber}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${csPaymentStyle(sale.paymentStatus)}`}>
                        {sale.paymentStatus}
                      </span>
                    </div>
                    <p className="text-sm text-secondary">{sale.customerName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-muted">{sale.date}</p>
                      <p className="text-xs text-muted">
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                        {serviceCount > 0 && ` + ${serviceCount} service${serviceCount !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground flex items-center justify-end gap-0.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {(sale.grandTotal ?? 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
