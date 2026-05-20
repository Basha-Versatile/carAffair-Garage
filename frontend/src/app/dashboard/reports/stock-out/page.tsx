"use client";

import { useState, useMemo } from "react";
import ReportShell, { ReportDateRange } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getAllStockHistory, StockHistory } from "@/lib/api-inventory";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

const columns: DataColumn<StockHistory>[] = [
  { key: "date", header: "Date", render: (r) => <span className="text-muted whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</span>, sortValue: (r) => r.date || "" },
  { key: "partName", header: "Part", render: (r) => <div><p className="font-medium text-foreground">{r.partName || "-"}</p><p className="text-xs text-muted font-mono">{r.partNumber || "-"}</p></div>, sortValue: (r) => r.partName || "" },
  { key: "qty", header: "Qty", align: "right", render: (r) => <span className="font-semibold text-bad tabular-nums">-{r.qty}</span>, sortValue: (r) => r.qty },
  { key: "mode", header: "Mode", render: (r) => <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{r.mode || "-"}</span>, filterValue: (r) => r.mode || "" },
  { key: "refNumber", header: "Ref No.", render: (r) => <span className="text-muted">{r.refNumber || "-"}</span> },
  { key: "changedBy", header: "By", render: (r) => <span className="text-muted">{r.changedBy || "-"}</span> },
  { key: "comment", header: "Comment", render: (r) => <span className="text-muted text-xs">{r.comment || "-"}</span> },
];

export default function StockOutReport() {
  const [data, setData] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate(range: ReportDateRange) {
    setLoading(true);
    try {
      const history = await getAllStockHistory();
      const filtered = (history || [])
        .filter((h) => h.type === "stockout" && (h.date || "") >= range.from && (h.date || "") <= range.to);
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setData(filtered);
      setGenerated(true);
    } finally { setLoading(false); }
  }

  const totalQty = useMemo(() => data.reduce((s, r) => s + r.qty, 0), [data]);

  return (
    <ReportShell title="Inventory Stock Out" loading={loading} generated={generated} onGenerate={generate}>
      <div className="bg-bad-light rounded-lg p-4 mb-4 inline-block"><p className="text-xs text-bad font-medium">Total Stock Out</p><p className="text-lg font-bold text-bad mt-1">{totalQty} items</p></div>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
