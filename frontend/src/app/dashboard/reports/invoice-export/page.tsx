"use client";

import { useState, useMemo } from "react";
import ReportShell, { ReportDateRange } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getInvoices, Invoice } from "@/lib/api-invoices";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

const columns: DataColumn<Invoice>[] = [
  { key: "invoiceNumber", header: "Invoice No.", render: (i) => <span className="font-semibold text-foreground">{i.invoiceNumber || "-"}</span>, sortValue: (i) => i.invoiceNumber || "" },
  { key: "type", header: "Type", render: (i) => <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${i.type === "tax" ? "bg-ok-light text-ok" : "bg-warn-light text-warn"}`}>{i.type === "tax" ? "Tax" : "Proforma"}</span>, filterValue: (i) => i.type },
  { key: "customer", header: "Customer", render: (i) => <div><p className="text-foreground font-medium">{i.customerName || "-"}</p><p className="text-xs text-muted">{i.customerPhone || "-"}</p></div> },
  { key: "date", header: "Date", render: (i) => <span className="text-muted whitespace-nowrap">{i.date ? new Date(i.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</span>, sortValue: (i) => i.date || "" },
  { key: "status", header: "Status", render: (i) => { const m: Record<string, string> = { paid: "bg-ok-light text-ok", sent: "bg-warn-light text-warn", draft: "bg-dim text-muted" }; return <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${m[i.status] || "bg-dim text-muted"}`}>{i.status}</span>; }, filterValue: (i) => i.status },
  { key: "gst", header: "GST", align: "right", render: (i) => <span className="text-muted tabular-nums">₹{(i.gstAmount ?? 0).toLocaleString("en-IN")}</span>, sortValue: (i) => i.gstAmount ?? 0 },
  { key: "total", header: "Grand Total", align: "right", render: (i) => <span className="font-semibold text-foreground tabular-nums">₹{(i.grandTotal ?? 0).toLocaleString("en-IN")}</span>, sortValue: (i) => i.grandTotal ?? 0 },
];

export default function InvoiceExportReport() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate(range: ReportDateRange) {
    setLoading(true);
    try {
      const invoices = await getInvoices();
      const filtered = (invoices || []).filter((i) => (i.date || "") >= range.from && (i.date || "") <= range.to);
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setData(filtered);
      setGenerated(true);
    } finally { setLoading(false); }
  }

  const total = useMemo(() => data.reduce((s, i) => s + (i.grandTotal ?? 0), 0), [data]);

  return (
    <ReportShell title="Invoice Export" loading={loading} generated={generated} onGenerate={generate}>
      <div className="bg-primary-light rounded-lg p-4 mb-4 inline-block"><p className="text-xs text-primary font-medium">Total Invoiced</p><p className="text-lg font-bold text-primary mt-1">₹{total.toLocaleString("en-IN")}</p></div>
      <DataTable columns={columns} data={data} keyExtractor={(i) => i.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
