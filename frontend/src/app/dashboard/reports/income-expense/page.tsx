"use client";

import { useState, useMemo, useCallback } from "react";
import ReportShell, { ReportDateRange, ExportColumn } from "@/components/reports/ReportShell";
import { DataTable, DataColumn } from "@/components/tables/DataTable";
import { getAccountTransactions } from "@/lib/api-accounts";

interface Row { id: string; date: string; type: string; comment: string; amount: number; channel: string; user: string; }

const TABLE_CLS = "glass-card overflow-hidden";

const exportCols: ExportColumn<Row>[] = [
  { header: "Date", value: (r) => r.date },
  { header: "Type", value: (r) => r.type === "income" ? "Income" : "Expense" },
  { header: "Description", value: (r) => r.comment || "-" },
  { header: "Channel", value: (r) => r.channel || "-" },
  { header: "User", value: (r) => r.user || "-" },
  { header: "Amount", value: (r) => r.amount },
];

const columns: DataColumn<Row>[] = [
  { key: "date", header: "Date", render: (r) => <span className="text-muted whitespace-nowrap">{r.date}</span>, sortValue: (r) => r.date },
  { key: "type", header: "Type", render: (r) => <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${r.type === "income" ? "bg-ok-light text-ok" : "bg-bad-light text-bad"}`}>{r.type === "income" ? "Income" : "Expense"}</span>, filterValue: (r) => r.type },
  { key: "comment", header: "Description", render: (r) => <span className="text-foreground">{r.comment || "-"}</span> },
  { key: "channel", header: "Channel", render: (r) => <span className="text-muted">{r.channel || "-"}</span>, filterValue: (r) => r.channel },
  { key: "user", header: "User", render: (r) => <span className="text-muted">{r.user || "-"}</span> },
  { key: "amount", header: "Amount", align: "right", render: (r) => <span className={`font-semibold tabular-nums ${r.type === "income" ? "text-ok" : "text-bad"}`}>{r.type === "income" ? "+" : "-"}₹{Math.abs(r.amount).toLocaleString("en-IN")}</span>, sortValue: (r) => r.amount },
];

export default function IncomeExpenseReport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async (range: ReportDateRange) => {
    setLoading(true);
    try {
      const [cash, bank] = await Promise.all([
        getAccountTransactions("Cash", range.from, range.to).catch(() => []),
        getAccountTransactions("Bank", range.from, range.to).catch(() => []),
      ]);
      const all = [...cash, ...bank].map((t) => ({
        id: t.id, date: t.date, type: t.type, comment: t.comment,
        amount: t.amount, channel: t.channel, user: t.user || "-",
      }));
      all.sort((a, b) => b.date.localeCompare(a.date));
      setRows(all);
      setGenerated(true);
    } finally { setLoading(false); }
  }, []);

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
    const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
    return { income, expense, net: income - expense };
  }, [rows]);

  return (
    <ReportShell title="Income / Expense Reports" loading={loading} generated={generated} onGenerate={generate} exportColumns={exportCols} exportData={rows}>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-ok-light rounded-lg p-4"><p className="text-xs text-ok font-medium">Total Income</p><p className="text-lg font-bold text-ok mt-1">₹{totals.income.toLocaleString("en-IN")}</p></div>
        <div className="bg-bad-light rounded-lg p-4"><p className="text-xs text-bad font-medium">Total Expense</p><p className="text-lg font-bold text-bad mt-1">₹{totals.expense.toLocaleString("en-IN")}</p></div>
        <div className="bg-primary-light rounded-lg p-4"><p className="text-xs text-primary font-medium">Net</p><p className="text-lg font-bold text-primary mt-1">₹{totals.net.toLocaleString("en-IN")}</p></div>
      </div>
      <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} className={TABLE_CLS} />
    </ReportShell>
  );
}
