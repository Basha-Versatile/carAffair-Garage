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
  { key: "placeOfSupply", header: "Place of Supply", render: (i) => <span className="text-muted text-xs">{i.placeOfSupply || "-"}</span>, filterValue: (i) => i.placeOfSupply || "" },
  { key: "taxable", header: "Taxable", align: "right", render: (i) => <span className="text-foreground tabular-nums">₹{(i.totalAmount ?? 0).toLocaleString("en-IN")}</span>, sortValue: (i) => i.totalAmount ?? 0 },
  { key: "gst", header: "GST", align: "right", render: (i) => <span className="font-semibold text-primary tabular-nums">₹{(i.gstAmount ?? 0).toLocaleString("en-IN")}</span>, sortValue: (i) => i.gstAmount ?? 0 },
  { key: "total", header: "Total", align: "right", render: (i) => <span className="font-semibold text-foreground tabular-nums">₹{(i.grandTotal ?? 0).toLocaleString("en-IN")}</span>, sortValue: (i) => i.grandTotal ?? 0 },
];

const exportCols: ExportColumn<Invoice>[] = [
  { header: "Invoice No", value: (i) => i.invoiceNumber || "" },
  { header: "Customer", value: (i) => i.customerName || "" },
  { header: "Date", value: (i) => i.date || "" },
  { header: "Place of Supply", value: (i) => i.placeOfSupply || "" },
  { header: "Taxable", value: (i) => i.totalAmount ?? 0 },
  { header: "GST", value: (i) => i.gstAmount ?? 0 },
  { header: "Total", value: (i) => i.grandTotal ?? 0 },
];

export default function GSTReport() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (range: ReportDateRange) => {
    setLoading(true);
    try {
      const invoices = await getInvoices();
      const filtered = (invoices || []).filter((i) => i.type === "tax" && (i.date || "") >= range.from && (i.date || "") <= range.to);
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setData(filtered);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  const totals = useMemo(() => ({
    taxable: data.reduce((s, i) => s + (i.totalAmount ?? 0), 0),
    gst: data.reduce((s, i) => s + (i.gstAmount ?? 0), 0),
    total: data.reduce((s, i) => s + (i.grandTotal ?? 0), 0),
  }), [data]);

  return (
    <ReportShell title="GST Reports" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={data}>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-hover rounded-lg p-4"><p className="text-xs text-muted font-medium">Taxable Amount</p><p className="text-lg font-bold text-foreground mt-1">₹{totals.taxable.toLocaleString("en-IN")}</p></div>
        <div className="bg-primary-light rounded-lg p-4"><p className="text-xs text-primary font-medium">Total GST</p><p className="text-lg font-bold text-primary mt-1">₹{totals.gst.toLocaleString("en-IN")}</p></div>
        <div className="bg-ok-light rounded-lg p-4"><p className="text-xs text-ok font-medium">Grand Total</p><p className="text-lg font-bold text-ok mt-1">₹{totals.total.toLocaleString("en-IN")}</p></div>
      </div>
      <DataTable columns={columns} data={data} keyExtractor={(i) => i.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
