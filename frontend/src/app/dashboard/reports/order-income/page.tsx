"use client";

import { useState, useMemo, useCallback } from "react";
import ReportShell, { ReportDateRange, ExportColumn } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getOrders, Order } from "@/lib/api-orders";

const TABLE_CLS = "glass-card overflow-hidden";

const columns: DataColumn<Order>[] = [
  { key: "jobCard", header: "Job Card", render: (o) => <span className="font-semibold text-foreground">{o.jobCard || "-"}</span>, sortValue: (o) => o.jobCard || "" },
  { key: "customer", header: "Customer", render: (o) => <div><p className="text-foreground font-medium">{o.customerName || "-"}</p><p className="text-xs text-muted">{o.phone || o.customerPhone || "-"}</p></div> },
  { key: "vehicle", header: "Vehicle", render: (o) => <div><p className="text-secondary">{o.vehicle || "-"}</p><p className="text-xs text-muted font-mono">{o.vehicleNumber || "-"}</p></div> },
  { key: "date", header: "Date", render: (o) => <span className="text-muted whitespace-nowrap">{o.date ? new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</span>, sortValue: (o) => o.date || "" },
  { key: "status", header: "Status", render: (o) => { const m: Record<string, string> = { open: "bg-primary-light text-primary", wip: "bg-warn-light text-warn", ready: "bg-ok-light text-ok", payment_due: "bg-bad-light text-bad", completed: "bg-dim text-muted" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${m[o.status] || "bg-dim text-muted"}`}>{o.status}</span>; }, filterValue: (o) => o.status },
  { key: "amount", header: "Amount", align: "right", render: (o) => <span className="font-semibold text-foreground tabular-nums">₹{(o.amount ?? 0).toLocaleString("en-IN")}</span>, sortValue: (o) => o.amount ?? 0 },
];

const exportCols: ExportColumn<Order>[] = [
  { header: "Job Card", value: (o) => o.jobCard || "" },
  { header: "Customer", value: (o) => o.customerName || "" },
  { header: "Phone", value: (o) => o.phone || o.customerPhone || "" },
  { header: "Vehicle", value: (o) => o.vehicle || "" },
  { header: "Vehicle No", value: (o) => o.vehicleNumber || "" },
  { header: "Date", value: (o) => o.date || "" },
  { header: "Status", value: (o) => o.status || "" },
  { header: "Amount", value: (o) => o.amount ?? 0 },
];

export default function OrderIncomeReport() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (range: ReportDateRange) => {
    setLoading(true);
    try {
      const orders = await getOrders();
      const filtered = (orders || []).filter((o) => (o.date || "") >= range.from && (o.date || "") <= range.to);
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setData(filtered);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  const total = useMemo(() => data.reduce((s, o) => s + (o.amount ?? 0), 0), [data]);

  return (
    <ReportShell title="Order Based Income Reports" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={data}>
      <div className="bg-ok-light rounded-lg p-4 mb-4 inline-block"><p className="text-xs text-ok font-medium">Total Revenue</p><p className="text-lg font-bold text-ok mt-1">₹{total.toLocaleString("en-IN")}</p></div>
      <DataTable columns={columns} data={data} keyExtractor={(o) => o.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
