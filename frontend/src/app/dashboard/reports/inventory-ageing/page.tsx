"use client";

import { useState, useCallback } from "react";
import ReportShell, { ReportDateRange, ExportColumn } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getParts, Part } from "@/lib/api-inventory";

const TABLE_CLS = "glass-card overflow-hidden";

const columns: DataColumn<Part>[] = [
  { key: "name", header: "Part", render: (p) => <div><p className="font-medium text-foreground">{p.name}</p><p className="text-xs text-muted font-mono">{p.partNumber || "-"}</p></div>, sortValue: (p) => p.name },
  { key: "category", header: "Category", render: (p) => <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{p.category || "-"}</span>, filterValue: (p) => p.category || "" },
  { key: "stockQty", header: "Stock", align: "right", render: (p) => <span className={`font-semibold tabular-nums ${(p.stockQty ?? 0) <= (p.minStockQty ?? 0) ? "text-bad" : "text-foreground"}`}>{p.stockQty ?? 0}</span>, sortValue: (p) => p.stockQty ?? 0 },
  { key: "unit", header: "Unit", render: (p) => <span className="text-muted">{p.unit || "-"}</span> },
  { key: "mrp", header: "MRP", align: "right", render: (p) => <span className="text-muted tabular-nums">₹{(p.mrp ?? 0).toLocaleString("en-IN")}</span>, sortValue: (p) => p.mrp ?? 0 },
  { key: "value", header: "Stock Value", align: "right", render: (p) => <span className="font-semibold text-foreground tabular-nums">₹{((p.stockQty ?? 0) * (p.purchasePrice || p.mrp || 0)).toLocaleString("en-IN")}</span>, sortValue: (p) => (p.stockQty ?? 0) * (p.purchasePrice || p.mrp || 0) },
  { key: "rackNumber", header: "Rack", render: (p) => <span className="text-muted">{p.rackNumber || "-"}</span> },
];

const exportCols: ExportColumn<Part>[] = [
  { header: "Part Name", value: (p) => p.name || "" },
  { header: "Part Number", value: (p) => p.partNumber || "" },
  { header: "Category", value: (p) => p.category || "" },
  { header: "Stock Qty", value: (p) => p.stockQty ?? 0 },
  { header: "Unit", value: (p) => p.unit || "" },
  { header: "MRP", value: (p) => p.mrp ?? 0 },
  { header: "Stock Value", value: (p) => (p.stockQty ?? 0) * (p.purchasePrice || p.mrp || 0) },
  { header: "Rack", value: (p) => p.rackNumber || "" },
];

export default function InventoryAgeingReport() {
  const [data, setData] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (_range: ReportDateRange) => {
    setLoading(true);
    try {
      const parts = await getParts();
      const sorted = (parts || []).filter((p) => (p.stockQty ?? 0) > 0).sort((a, b) => (b.stockQty ?? 0) - (a.stockQty ?? 0));
      setData(sorted);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  return (
    <ReportShell title="Inventory Ageing Report" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={data}>
      <DataTable columns={columns} data={data} keyExtractor={(p) => p.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
