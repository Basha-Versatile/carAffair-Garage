"use client";

import { useState, useMemo } from "react";
import ReportShell, { ReportDateRange } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getExpenses, Expense } from "@/lib/api-accounts";

const TABLE_CLS = "bg-background rounded-lg border border-edge overflow-hidden";

const columns: DataColumn<Expense>[] = [
  { key: "voucherNo", header: "Voucher No.", render: (r) => <span className="font-semibold text-foreground">{r.voucherNo || "-"}</span>, sortValue: (r) => r.voucherNo || "" },
  { key: "date", header: "Date", render: (r) => <span className="text-muted whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</span>, sortValue: (r) => r.date || "" },
  { key: "label", header: "Label", render: (r) => <span className="text-xs bg-hover text-muted px-2 py-0.5 rounded">{r.labelName || "-"}</span>, filterValue: (r) => r.labelName || "" },
  { key: "vendor", header: "Vendor", render: (r) => <span className="text-secondary">{r.vendorName || "-"}</span> },
  { key: "channel", header: "Channel", render: (r) => <span className="text-muted">{r.paymentChannel || "-"}</span>, filterValue: (r) => r.paymentChannel || "" },
  { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-semibold text-bad tabular-nums">₹{(r.amount ?? 0).toLocaleString("en-IN")}</span>, sortValue: (r) => r.amount ?? 0 },
];

export default function AccountPayableReport() {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate(range: ReportDateRange) {
    setLoading(true);
    try {
      const expenses = await getExpenses();
      const filtered = (expenses || []).filter((e) => (e.date || "") >= range.from && (e.date || "") <= range.to);
      filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      setData(filtered);
      setGenerated(true);
    } finally { setLoading(false); }
  }

  const total = useMemo(() => data.reduce((s, e) => s + (e.amount ?? 0), 0), [data]);

  return (
    <ReportShell title="Account Payable" loading={loading} generated={generated} onGenerate={generate}>
      <div className="bg-bad-light rounded-lg p-4 mb-4 inline-block"><p className="text-xs text-bad font-medium">Total Payable</p><p className="text-lg font-bold text-bad mt-1">₹{total.toLocaleString("en-IN")}</p></div>
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
