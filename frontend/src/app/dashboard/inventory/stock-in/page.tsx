"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowDownToLine,
  Calendar,
  ChevronDown,
  IndianRupee,
  Upload,
} from "lucide-react";
import { getParts, Part, addStockInRecord } from "@/lib/inventory-data";
import { getVendors, Vendor } from "@/lib/vehicle-data";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

interface StockInItemRow {
  partId: string;
  qty: number;
  priceWithoutGst: number;
  gstRate: number;
}

interface StockInForm {
  date: string;
  invoiceNumber: string;
  vendorId: string;
  isGstBill: boolean;
  paymentChannel: "cash" | "bank" | "upi" | "credit";
  placeOfSupply: string;
  items: StockInItemRow[];
  sendEmail: boolean;
  withMrpDiscount: boolean;
  paidAmount: number;
}

const labelCls =
  "block text-sm font-medium text-secondary mb-1.5";
const inputCls =
  "w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
const selectCls =
  "w-full px-3 py-2.5 border border-edge rounded-lg text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer";

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function StockInPage() {
  const router = useRouter();

  const [parts, setParts] = useState<Part[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<StockInForm>({
    date: todayISO(),
    invoiceNumber: "",
    vendorId: "",
    isGstBill: true,
    paymentChannel: "cash",
    placeOfSupply: "Telangana",
    items: [],
    sendEmail: false,
    withMrpDiscount: false,
    paidAmount: 0,
  });

  useEffect(() => {
    setParts(getParts());
    setVendors(getVendors());
  }, []);

  // ----- helpers -----

  function partById(id: string): Part | undefined {
    return parts.find((p) => p.id === id);
  }

  function updateField<K extends keyof StockInForm>(key: K, value: StockInForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateItem(index: number, patch: Partial<StockInItemRow>) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { partId: "", qty: 1, priceWithoutGst: 0, gstRate: 18 },
      ],
    }));
  }

  function removeItem(index: number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function handlePartSelect(index: number, partId: string) {
    const part = partById(partId);
    if (part) {
      updateItem(index, {
        partId,
        priceWithoutGst: part.purchasePrice,
        gstRate: part.gstRate,
      });
    } else {
      updateItem(index, { partId });
    }
  }

  // ----- calculations -----

  function priceWithGst(item: StockInItemRow) {
    return item.priceWithoutGst * (1 + item.gstRate / 100);
  }

  function totalPurchasePrice(item: StockInItemRow) {
    return priceWithGst(item) * item.qty;
  }

  function itemMrp(item: StockInItemRow): number {
    const part = partById(item.partId);
    return part ? part.mrp : 0;
  }

  function currentStock(item: StockInItemRow): number {
    const part = partById(item.partId);
    return part ? part.stockQty : 0;
  }

  const totalAmount = form.items.reduce(
    (sum, it) => sum + it.priceWithoutGst * it.qty,
    0
  );
  const totalGst = form.items.reduce(
    (sum, it) => sum + it.priceWithoutGst * it.qty * (it.gstRate / 100),
    0
  );
  const grandTotal = totalAmount + totalGst;

  // GST split: if same state (Telangana) => CGST + SGST, else IGST
  const isSameState = form.placeOfSupply === "Telangana";
  const cgst = isSameState ? totalGst / 2 : 0;
  const sgst = isSameState ? totalGst / 2 : 0;
  const igst = isSameState ? 0 : totalGst;

  // ----- save -----

  function handleSave() {
    const errs: string[] = [];
    if (!form.date) errs.push("Date is required.");
    if (!form.invoiceNumber.trim()) errs.push("Invoice number is required.");
    if (!form.vendorId) errs.push("Vendor is required.");
    if (form.items.length === 0) errs.push("Add at least one item.");
    form.items.forEach((it, i) => {
      if (!it.partId) errs.push(`Item ${i + 1}: select a part.`);
      if (it.qty <= 0) errs.push(`Item ${i + 1}: quantity must be > 0.`);
    });

    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    setSaving(true);

    const vendor = vendors.find((v) => v.id === form.vendorId);

    addStockInRecord({
      date: form.date,
      invoiceNumber: form.invoiceNumber.trim(),
      vendorId: form.vendorId,
      vendorName: vendor?.name ?? "",
      isGstBill: form.isGstBill,
      paymentChannel: form.paymentChannel,
      placeOfSupply: form.placeOfSupply,
      items: form.items.map((it) => {
        const part = partById(it.partId);
        const amount = it.priceWithoutGst * it.qty;
        const gstAmount = amount * (it.gstRate / 100);
        return {
          partId: it.partId,
          partName: part?.name ?? "",
          partNumber: part?.partNumber ?? "",
          qty: it.qty,
          rate: it.priceWithoutGst,
          amount,
          gstRate: it.gstRate,
          gstAmount,
        };
      }),
      totalAmount,
      gstAmount: totalGst,
      grandTotal,
    });

    router.push("/dashboard/inventory");
  }

  // ----- render helpers -----

  function Toggle({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-10 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
          checked ? "bg-primary" : "bg-edge"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${
            checked ? "translate-x-5 ml-0.5" : "translate-x-0.5"
          }`}
        />
      </button>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dim animate-fade-in">
      {/* ── Header ── */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/inventory")}
          className="p-1.5 rounded-lg hover:bg-hover transition-colors text-muted hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ArrowDownToLine className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-foreground">
            Stock In Information
          </h1>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6 animate-slide-up">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-background border border-bad/30 rounded-lg p-4 space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-sm text-bad">
                  {e}
                </p>
              ))}
            </div>
          )}

          {/* ── Form Fields ── */}
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date */}
              <div>
                <label className={labelCls}>Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateField("date", e.target.value)}
                    className={`${inputCls} pl-10`}
                  />
                </div>
              </div>

              {/* Invoice No */}
              <div>
                <label className={labelCls}>Invoice No.</label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    updateField("invoiceNumber", e.target.value)
                  }
                  placeholder="Enter invoice number"
                  className={inputCls}
                />
              </div>

              {/* Link existing PO */}
              <div className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  id="linkPo"
                  className="w-4 h-4 rounded border-edge text-primary focus:ring-primary cursor-pointer"
                />
                <label
                  htmlFor="linkPo"
                  className="text-sm text-secondary cursor-pointer select-none"
                >
                  Link existing purchase order
                </label>
              </div>

              {/* Vendor */}
              <div>
                <label className={labelCls}>Vendor</label>
                <div className="relative">
                  <select
                    value={form.vendorId}
                    onChange={(e) => updateField("vendorId", e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select vendor</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Stock In with GST toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-secondary">
                  Stock In with GST?
                </label>
                <Toggle
                  checked={form.isGstBill}
                  onChange={(v) => updateField("isGstBill", v)}
                />
              </div>

              {/* Payment Channel */}
              <div>
                <label className={labelCls}>Payment Channel</label>
                <div className="relative">
                  <select
                    value={form.paymentChannel}
                    onChange={(e) =>
                      updateField(
                        "paymentChannel",
                        e.target.value as StockInForm["paymentChannel"]
                      )
                    }
                    className={selectCls}
                  >
                    <option value="cash">CASH</option>
                    <option value="bank">BANK</option>
                    <option value="upi">UPI</option>
                    <option value="credit">CREDIT</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Place of Supply */}
              <div>
                <label className={labelCls}>Place of Supply</label>
                <div className="relative">
                  <select
                    value={form.placeOfSupply}
                    onChange={(e) =>
                      updateField("placeOfSupply", e.target.value)
                    }
                    className={selectCls}
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                </div>
              </div>

              {/* Add Invoice Image */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-edge rounded-lg text-sm text-muted hover:text-secondary hover:border-edge-light hover:bg-hover transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add Invoice Image
                </button>
              </div>
            </div>
          </div>

          {/* ── Parts Table Section ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Parts / Stock Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Part/Stock
              </button>
            </div>

            {form.items.length === 0 ? (
              <div className="bg-background rounded-lg border border-edge p-10 text-center">
                <div className="inline-flex items-center justify-center bg-hover p-3 rounded-full mb-3">
                  <ArrowDownToLine className="w-6 h-6 text-muted" />
                </div>
                <p className="text-sm text-muted">
                  No parts added yet. Click &quot;Add Part/Stock&quot; to begin.
                </p>
              </div>
            ) : (
              <div className="bg-background rounded-lg border border-edge overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-dim border-b border-edge">
                        <th className="text-left px-3 py-2.5 font-medium text-secondary whitespace-nowrap min-w-[200px]">
                          (P.No.) Name
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          Current Stock
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          New Stock
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          Purch. Price (excl GST)
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          GST %
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          Purch. Price (incl GST)
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          Total Purch. Price
                        </th>
                        <th className="text-right px-3 py-2.5 font-medium text-secondary whitespace-nowrap">
                          MRP
                        </th>
                        <th className="px-3 py-2.5 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge-light">
                      {form.items.map((item, idx) => {
                        const part = partById(item.partId);
                        const inclGst = priceWithGst(item);
                        const total = totalPurchasePrice(item);
                        const mrp = itemMrp(item);
                        const stock = currentStock(item);

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-hover transition-colors"
                          >
                            {/* Part Select */}
                            <td className="px-3 py-2.5">
                              <div className="relative">
                                <select
                                  value={item.partId}
                                  onChange={(e) =>
                                    handlePartSelect(idx, e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 border border-edge rounded text-sm text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer min-w-[180px]"
                                >
                                  <option value="">Select part</option>
                                  {parts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      ({p.partNumber}) {p.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                              </div>
                            </td>

                            {/* Current Stock */}
                            <td className="px-3 py-2.5 text-right text-foreground whitespace-nowrap">
                              {part ? stock : "-"}
                            </td>

                            {/* New Stock (Qty) */}
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={(e) =>
                                  updateItem(idx, {
                                    qty: Math.max(
                                      1,
                                      parseInt(e.target.value) || 1
                                    ),
                                  })
                                }
                                className="w-20 px-2 py-1.5 border border-edge rounded text-sm text-foreground bg-background text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ml-auto block"
                              />
                            </td>

                            {/* Purchase Price excl GST */}
                            <td className="px-3 py-2.5">
                              <div className="relative w-28 ml-auto">
                                <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={item.priceWithoutGst}
                                  onChange={(e) =>
                                    updateItem(idx, {
                                      priceWithoutGst:
                                        parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full pl-6 pr-2 py-1.5 border border-edge rounded text-sm text-foreground bg-background text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                              </div>
                            </td>

                            {/* GST % */}
                            <td className="px-3 py-2.5">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={item.gstRate}
                                onChange={(e) =>
                                  updateItem(idx, {
                                    gstRate:
                                      parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-16 px-2 py-1.5 border border-edge rounded text-sm text-foreground bg-background text-right focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ml-auto block"
                              />
                            </td>

                            {/* Purchase Price incl GST */}
                            <td className="px-3 py-2.5 text-right text-foreground whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 justify-end">
                                <IndianRupee className="w-3 h-3" />
                                {inclGst.toFixed(2)}
                              </span>
                            </td>

                            {/* Total Purchase Price */}
                            <td className="px-3 py-2.5 text-right font-medium text-foreground whitespace-nowrap">
                              <span className="inline-flex items-center gap-0.5 justify-end">
                                <IndianRupee className="w-3 h-3" />
                                {total.toFixed(2)}
                              </span>
                            </td>

                            {/* MRP */}
                            <td className="px-3 py-2.5 text-right text-foreground whitespace-nowrap">
                              {part ? (
                                <span className="inline-flex items-center gap-0.5 justify-end">
                                  <IndianRupee className="w-3 h-3" />
                                  {mrp.toLocaleString("en-IN")}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>

                            {/* Remove */}
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-1.5 rounded hover:bg-hover text-muted hover:text-bad transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── Toggles below table ── */}
          <div className="bg-background rounded-lg border border-edge p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">
                Send Stock In report via email
              </span>
              <Toggle
                checked={form.sendEmail}
                onChange={(v) => updateField("sendEmail", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">
                Stock-in with MRP &amp; Discount
              </span>
              <Toggle
                checked={form.withMrpDiscount}
                onChange={(v) => updateField("withMrpDiscount", v)}
              />
            </div>
          </div>

          {/* ── Footer / Summary ── */}
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GST Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  GST Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">CGST</span>
                    <span className="text-foreground font-medium inline-flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {cgst.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">SGST</span>
                    <span className="text-foreground font-medium inline-flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {sgst.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">IGST</span>
                    <span className="text-foreground font-medium inline-flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {igst.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Paid Amount & Total */}
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Paid Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.paidAmount}
                      onChange={(e) =>
                        updateField(
                          "paidAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                      className={`${inputCls} pl-10 text-right`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-edge">
                  <span className="text-sm font-semibold text-foreground">
                    Total
                  </span>
                  <span className="text-lg font-bold text-foreground inline-flex items-center gap-0.5">
                    <IndianRupee className="w-4 h-4" />
                    {grandTotal.toFixed(2)}
                  </span>
                </div>

                {form.paidAmount > 0 && form.paidAmount < grandTotal && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warn font-medium">Balance Due</span>
                    <span className="text-warn font-medium inline-flex items-center gap-0.5">
                      <IndianRupee className="w-3 h-3" />
                      {(grandTotal - form.paidAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky Save Bar ── */}
      <div className="bg-background border-t border-edge px-6 py-3.5 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/inventory")}
          className="px-5 py-2.5 border border-edge rounded-lg text-sm font-medium text-secondary hover:bg-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowDownToLine className="w-4 h-4" />
          )}
          Save Data
        </button>
      </div>
    </div>
  );
}
