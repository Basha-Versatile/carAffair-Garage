"use client";

import { useState, useMemo, useCallback } from "react";
import ReportShell, { ReportDateRange, ExportColumn } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getInvoices, Invoice } from "@/lib/api-invoices";

const TABLE_CLS = "glass-card overflow-hidden";

const columns: DataColumn<Invoice>[] = [
  { key: "invoiceNumber", header: "Invoice No.", render: (i) => <span className="font-semibold text-foreground">{i.invoiceNumber || "-"}</span>, sortValue: (i) => i.invoiceNumber || "" },
  { key: "customer", header: "Customer", render: (i) => <div><p className="text-foreground font-medium">{i.customerName || "-"}</p><p className="text-xs text-muted">{i.customerPhone || "-"}</p></div> },
  { key: "date", header: "Date", render: (i) => <span className="text-muted whitespace-nowrap">{i.date ? new Date(i.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</span>, sortValue: (i) => i.date || "" },
  { key: "status", header: "Payment Status", render: (i) => { const m: Record<string, string> = { paid: "bg-ok-light text-ok", sent: "bg-warn-light text-warn", draft: "bg-dim text-muted" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${m[i.status] || "bg-dim text-muted"}`}>{i.status}</span>; }, filterValue: (i) => i.status },
  { key: "total", header: "Amount", align: "right", render: (i) => <span className="font-semibold text-foreground tabular-nums">₹{(i.grandTotal ?? 0).toLocaleString("en-IN")}</span>, sortValue: (i) => i.grandTotal ?? 0 },
];

const exportCols: ExportColumn<Invoice>[] = [
  { header: "Invoice No", value: (i) => i.invoiceNumber || "" },
  { header: "Customer", value: (i) => i.customerName || "" },
  { header: "Phone", value: (i) => i.customerPhone || "" },
  { header: "Date", value: (i) => i.date || "" },
  { header: "Status", value: (i) => i.status || "" },
  { header: "Amount", value: (i) => i.grandTotal ?? 0 },
];

export default function PaymentReport() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (range: ReportDateRange) => {
    setLoading(true);
    try {
      const invoices = await getInvoices();
      const filtered = (invoices || []).filter((i) => (i.date || "") >= range.from && (i.date || "") <= range.to);
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setData(filtered);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  const stats = useMemo(() => ({
    paid: data.filter((i) => i.status === "paid").reduce((s, i) => s + (i.grandTotal ?? 0), 0),
    pending: data.filter((i) => i.status !== "paid").reduce((s, i) => s + (i.grandTotal ?? 0), 0),
  }), [data]);

  return (
    <ReportShell title="Payment Reports" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={data}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-ok-light rounded-lg p-4"><p className="text-xs text-ok font-medium">Paid</p><p className="text-lg font-bold text-ok mt-1">₹{stats.paid.toLocaleString("en-IN")}</p></div>
        <div className="bg-warn-light rounded-lg p-4"><p className="text-xs text-warn font-medium">Pending</p><p className="text-lg font-bold text-warn mt-1">₹{stats.pending.toLocaleString("en-IN")}</p></div>
      </div>
      <DataTable columns={columns} data={data} keyExtractor={(i) => i.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
