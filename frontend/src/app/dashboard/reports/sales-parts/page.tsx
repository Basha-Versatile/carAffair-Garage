"use client";

import { useState, useCallback } from "react";
import ReportShell, { ReportDateRange, ExportColumn } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getInvoices } from "@/lib/api-invoices";

interface Row { id: string; name: string; qty: number; rate: number; total: number; gst: number; }

const TABLE_CLS = "glass-card overflow-hidden";

const columns: DataColumn<Row>[] = [
  { key: "name", header: "Part Name", render: (r) => <span className="font-medium text-foreground">{r.name}</span>, sortValue: (r) => r.name },
  { key: "qty", header: "Qty", align: "right", render: (r) => <span className="text-foreground tabular-nums">{r.qty}</span>, sortValue: (r) => r.qty },
  { key: "rate", header: "Avg. Rate", align: "right", render: (r) => <span className="text-muted tabular-nums">₹{r.rate.toLocaleString("en-IN")}</span> },
  { key: "gst", header: "GST", align: "right", render: (r) => <span className="text-muted tabular-nums">₹{r.gst.toLocaleString("en-IN")}</span>, sortValue: (r) => r.gst },
  { key: "total", header: "Total", align: "right", render: (r) => <span className="font-semibold text-foreground tabular-nums">₹{r.total.toLocaleString("en-IN")}</span>, sortValue: (r) => r.total },
];

const exportCols: ExportColumn<Row>[] = [
  { header: "Part Name", value: (r) => r.name },
  { header: "Qty", value: (r) => r.qty },
  { header: "Avg Rate", value: (r) => r.rate },
  { header: "GST", value: (r) => r.gst },
  { header: "Total", value: (r) => r.total },
];

export default function SalesPartsReport() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (range: ReportDateRange) => {
    setLoading(true);
    try {
      const invoices = await getInvoices();
      const filtered = (invoices || []).filter((i) => (i.date || "") >= range.from && (i.date || "") <= range.to);
      const map = new Map<string, { qty: number; total: number; gst: number; rateSum: number }>();
      for (const inv of filtered) {
        for (const item of inv.items || []) {
          if (item.itemType !== "part") continue;
          const key = item.description || "Unknown";
          const entry = map.get(key) || { qty: 0, total: 0, gst: 0, rateSum: 0 };
          entry.qty += item.qty;
          entry.total += item.amount;
          entry.gst += item.gstAmount;
          entry.rateSum += item.rate;
          map.set(key, entry);
        }
      }
      const rows: Row[] = [];
      map.forEach((v, k) => rows.push({ id: k, name: k, qty: v.qty, rate: v.qty > 0 ? Math.round(v.rateSum / v.qty) : 0, total: v.total, gst: v.gst }));
      rows.sort((a, b) => b.total - a.total);
      setData(rows);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  return (
    <ReportShell title="Parts Sales Reports" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={data}>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
