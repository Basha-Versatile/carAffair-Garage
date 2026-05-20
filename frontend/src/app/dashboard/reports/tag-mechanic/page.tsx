"use client";

import { useState } from "react";
import ReportShell, { ReportDateRange } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getOrders } from "@/lib/api-orders";

interface Row { id: string; service: string; count: number; totalAmount: number; }

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

const columns: DataColumn<Row>[] = [
  { key: "service", header: "Service / Tag", render: (r) => <span className="font-medium text-foreground">{r.service}</span>, sortValue: (r) => r.service },
  { key: "count", header: "Orders", align: "right", render: (r) => <span className="text-foreground tabular-nums">{r.count}</span>, sortValue: (r) => r.count },
  { key: "totalAmount", header: "Total Amount", align: "right", render: (r) => <span className="font-semibold text-foreground tabular-nums">₹{r.totalAmount.toLocaleString("en-IN")}</span>, sortValue: (r) => r.totalAmount },
];

export default function TagMechanicReport() {
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate(range: ReportDateRange) {
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
      map.forEach((v, k) => rows.push({ id: k, service: k, count: v.count, totalAmount: v.total }));
      rows.sort((a, b) => b.totalAmount - a.totalAmount);
      setData(rows);
      setGenerated(true);
    } finally { setLoading(false); }
  }

  return (
    <ReportShell title="TAG / Mechanic Based" loading={loading} generated={generated} onGenerate={generate}>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
