"use client";

import { useState, useCallback } from "react";
import ReportShell, { ReportDateRange, ExportColumn } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getOrders } from "@/lib/api-orders";

interface Row { id: string; service: string; orderCount: number; totalRevenue: number; avgPerOrder: number; }

const TABLE_CLS = "glass-card overflow-hidden";

const columns: DataColumn<Row>[] = [
  { key: "service", header: "Service", render: (r) => <span className="font-medium text-foreground">{r.service}</span>, sortValue: (r) => r.service },
  { key: "orderCount", header: "Orders", align: "right", render: (r) => <span className="text-foreground tabular-nums">{r.orderCount}</span>, sortValue: (r) => r.orderCount },
  { key: "avgPerOrder", header: "Avg / Order", align: "right", render: (r) => <span className="text-muted tabular-nums">₹{r.avgPerOrder.toLocaleString("en-IN")}</span> },
  { key: "totalRevenue", header: "Total Revenue", align: "right", render: (r) => <span className="font-semibold text-foreground tabular-nums">₹{r.totalRevenue.toLocaleString("en-IN")}</span>, sortValue: (r) => r.totalRevenue },
];

const exportCols: ExportColumn<Row>[] = [
  { header: "Service", value: (r) => r.service },
  { header: "Orders", value: (r) => r.orderCount },
  { header: "Avg/Order", value: (r) => r.avgPerOrder },
  { header: "Total Revenue", value: (r) => r.totalRevenue },
];

export default function ServiceReport() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (range: ReportDateRange) => {
    setLoading(true);
    try {
      const orders = await getOrders();
      const filtered = (orders || []).filter((o) => (o.date || "") >= range.from && (o.date || "") <= range.to);
      const map = new Map<string, { count: number; total: number }>();
      for (const o of filtered) {
        for (const s of o.services || []) {
          const entry = map.get(s) || { count: 0, total: 0 };
          entry.count++;
          entry.total += o.amount ?? 0;
          map.set(s, entry);
        }
      }
      const rows: Row[] = [];
      map.forEach((v, k) => rows.push({ id: k, service: k, orderCount: v.count, totalRevenue: v.total, avgPerOrder: v.count > 0 ? Math.round(v.total / v.count) : 0 }));
      rows.sort((a, b) => b.totalRevenue - a.totalRevenue);
      setData(rows);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  return (
    <ReportShell title="Service Reports" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={data}>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
