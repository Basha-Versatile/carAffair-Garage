"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { getParts, Part, addPurchaseOrder } from "@/lib/inventory-data";
import { getVendors, Vendor } from "@/lib/vehicle-data";

/* ── form state ── */

interface POForm {
  vendorId: string;
  repairOrderId: string;
  items: { partId: string; qty: number; rate: number }[];
  comments: string;
  notifyVendor: boolean;
}

const emptyItem = (): POForm["items"][number] => ({
  partId: "",
  qty: 1,
  rate: 0,
});

/* ── reusable class strings ── */

const inputCls =
  "w-full px-3 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted bg-background focus:outline-none focus:ring-2 focus:ring-primary";

const labelCls = "block text-sm font-medium text-secondary mb-1.5";

/* ── page ── */

export default function PurchaseOrderPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "orders">("create");

  const [form, setForm] = useState<POForm>({
    vendorId: "",
    repairOrderId: "",
    items: [emptyItem()],
    comments: "",
    notifyVendor: false,
  });

  const [errors, setErrors] = useState<{ vendor?: string; items?: string }>({});

  useEffect(() => {
    setVendors(getVendors());
    setParts(getParts());
  }, []);

  /* ── helpers ── */

  function updateItem(
    idx: number,
    field: keyof POForm["items"][number],
    value: string | number
  ) {
    setForm((prev) => {
      const items = [...prev.items];
      const item = { ...items[idx] };

      if (field === "partId") {
        item.partId = value as string;
        const part = parts.find((p) => p.id === value);
        if (part) item.rate = part.purchasePrice;
      } else if (field === "qty") {
        item.qty = Math.max(1, Number(value));
      } else if (field === "rate") {
        item.rate = Math.max(0, Number(value));
      }

      items[idx] = item;
      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(idx: number) {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length ? items : [emptyItem()] };
    });
  }

  /* ── calculations ── */

  function getItemCalcs(item: POForm["items"][number]) {
    const part = parts.find((p) => p.id === item.partId);
    const amount = item.qty * item.rate;
    const gstRate = part?.gstRate ?? 0;
    const gstAmount = amount * (gstRate / 100);
    return { amount, gstRate, gstAmount };
  }

  const totals = form.items.reduce(
    (acc, item) => {
      const { amount, gstAmount } = getItemCalcs(item);
      return {
        totalAmount: acc.totalAmount + amount,
        gstAmount: acc.gstAmount + gstAmount,
      };
    },
    { totalAmount: 0, gstAmount: 0 }
  );

  const grandTotal = totals.totalAmount + totals.gstAmount;

  /* ── submit ── */

  function handleSubmit() {
    const newErrors: typeof errors = {};

    if (!form.vendorId) newErrors.vendor = "Please select a vendor";
    if (!form.items.some((i) => i.partId))
      newErrors.items = "Add at least one part";

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const vendor = vendors.find((v) => v.id === form.vendorId);

    const poItems = form.items
      .filter((i) => i.partId)
      .map((item) => {
        const part = parts.find((p) => p.id === item.partId)!;
        const amount = item.qty * item.rate;
        const gstAmount = amount * (part.gstRate / 100);
        return {
          partId: item.partId,
          partName: part.name,
          partNumber: part.partNumber,
          qty: item.qty,
          rate: item.rate,
          amount,
          gstRate: part.gstRate,
          gstAmount,
        };
      });

    const totalAmount = poItems.reduce((s, i) => s + i.amount, 0);
    const gstAmount = poItems.reduce((s, i) => s + i.gstAmount, 0);

    addPurchaseOrder({
      poNumber: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      vendorId: form.vendorId,
      vendorName: vendor?.name ?? "",
      date: new Date().toISOString().split("T")[0],
      status: "draft",
      items: poItems,
      totalAmount,
      gstAmount,
      grandTotal: totalAmount + gstAmount,
      ...(form.repairOrderId ? { repairOrderId: form.repairOrderId } : {}),
    });

    router.push("/dashboard/inventory");
  }

  /* ── render ── */

  return (
    <div className="h-full flex flex-col bg-background">
      {/* ── Header ── */}
      <div className="bg-background border-b border-edge px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/inventory")}
          className="p-1.5 rounded-md hover:bg-hover transition-colors text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">
          Purchase Order
        </h1>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-background border-b border-edge px-4 flex gap-1">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === "create"
              ? "bg-primary text-white"
              : "text-secondary hover:bg-hover"
          }`}
        >
          CREATE ORDER
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === "orders"
              ? "bg-primary text-white"
              : "text-secondary hover:bg-hover"
          }`}
        >
          ORDERS
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto animate-fade-in">
        <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 animate-slide-up">
          {/* ── Vendor ── */}
          <div>
            <label className={labelCls}>Vendor</label>
            <div className="relative">
              <select
                value={form.vendorId}
                onChange={(e) => {
                  setForm((f) => ({ ...f, vendorId: e.target.value }));
                  if (errors.vendor) setErrors((e) => ({ ...e, vendor: undefined }));
                }}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="">
                  {vendors.length === 0
                    ? "No vendors available"
                    : "Select a vendor"}
                </option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            </div>
            {errors.vendor && (
              <p className="text-bad text-xs mt-1">{errors.vendor}</p>
            )}
          </div>

          {/* ── Job Card ── */}
          <div>
            <label className={labelCls}>Job Card</label>
            <input
              type="text"
              value={form.repairOrderId}
              onChange={(e) =>
                setForm((f) => ({ ...f, repairOrderId: e.target.value }))
              }
              placeholder="Link to job card number (optional)"
              className={inputCls}
            />
          </div>

          {/* ── Parts / Stocks Section ── */}
          <div>
            {/* Section header */}
            <div className="bg-primary rounded-t-md px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-white tracking-wide">
                PARTS / STOCKS
              </span>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-white text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Item rows */}
            <div className="border border-t-0 border-edge rounded-b-md divide-y divide-edge-light bg-background">
              {form.items.map((item, idx) => {
                const { amount } = getItemCalcs(item);
                return (
                  <div
                    key={idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-end gap-3"
                  >
                    {/* Part select */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-muted mb-1">
                        Part
                      </label>
                      <div className="relative">
                        <select
                          value={item.partId}
                          onChange={(e) =>
                            updateItem(idx, "partId", e.target.value)
                          }
                          className={`${inputCls} appearance-none pr-10`}
                        >
                          <option value="">Select part</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.partNumber} - {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                      </div>
                    </div>

                    {/* Qty */}
                    <div className="w-24 shrink-0">
                      <label className="block text-xs font-medium text-muted mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) =>
                          updateItem(idx, "qty", e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>

                    {/* Rate */}
                    <div className="w-28 shrink-0">
                      <label className="block text-xs font-medium text-muted mb-1">
                        Rate
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(idx, "rate", e.target.value)
                        }
                        className={inputCls}
                      />
                    </div>

                    {/* Amount (read-only) */}
                    <div className="w-28 shrink-0">
                      <label className="block text-xs font-medium text-muted mb-1">
                        Amount
                      </label>
                      <div className="px-3 py-2.5 border border-edge rounded-md text-sm text-secondary bg-dim">
                        {amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 rounded-md hover:bg-hover transition-colors text-bad self-end"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {errors.items && (
                <p className="text-bad text-xs px-4 py-2">{errors.items}</p>
              )}

              {/* Subtotal */}
              <div className="px-4 py-3 bg-dim flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {totals.totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">GST</span>
                  <span className="font-medium text-foreground">
                    {totals.gstAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-edge pt-1 mt-1">
                  <span className="font-semibold text-foreground">
                    Grand Total
                  </span>
                  <span className="font-semibold text-foreground">
                    {grandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Comments ── */}
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-muted" />
                Comments / Instructions
              </span>
            </label>
            <textarea
              value={form.comments}
              onChange={(e) =>
                setForm((f) => ({ ...f, comments: e.target.value }))
              }
              rows={3}
              placeholder="Add any comments or special instructions for the vendor..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* ── Notify Vendor ── */}
          <div className="flex items-center justify-between bg-dim px-4 py-3 rounded-md border border-edge">
            <span className="text-sm font-medium text-foreground">
              Notify Vendor (SMS &amp; e-mail)?
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={form.notifyVendor}
              onClick={() =>
                setForm((f) => ({ ...f, notifyVendor: !f.notifyVendor }))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                form.notifyVendor ? "bg-primary" : "bg-edge"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  form.notifyVendor ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* ── Footer / Submit ── */}
          <div className="pb-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-md text-sm font-semibold hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Create Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
