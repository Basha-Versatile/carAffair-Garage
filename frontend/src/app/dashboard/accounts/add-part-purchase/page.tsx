"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Search,
  X,
  Camera,
  Trash2,
  Check,
} from "lucide-react";
import SelectModal from "@/components/modals/SelectModal";
import { createPartPurchase } from "@/lib/api-accounts";
import { getVendors, addVendor, Vendor } from "@/lib/api-vehicles";
import { getOrders, Order } from "@/lib/api-orders";

// ── Indian States ──

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const PAYMENT_CHANNELS = [
  "Cash", "GPAY", "PhonePe", "Paytm", "UPI",
  "Bank Transfer", "Debit Card", "Credit Card", "Cheque",
];
const GST_RATES = [5, 12, 18, 28];

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "Select date";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
}

export default function AddPartPurchasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ──
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [repairOrderId, setRepairOrderId] = useState("");
  const [repairOrderJobCard, setRepairOrderJobCard] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [comment, setComment] = useState("");
  const [paidStatus, setPaidStatus] = useState<"PAID" | "CREDIT">("PAID");
  const [advancePaidAmount, setAdvancePaidAmount] = useState("");
  const [paymentChannel, setPaymentChannel] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [gstApplicable, setGstApplicable] = useState(false);
  const [gstRate, setGstRate] = useState<number>(18);
  const [hsnSac, setHsnSac] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");

  // ── Computed GST ──
  const amountNum = parseFloat(amount) || 0;
  const cgst = gstApplicable ? Math.round((amountNum * gstRate) / 200 * 100) / 100 : 0;
  const sgst = cgst;
  const igst = gstApplicable ? Math.round((amountNum * gstRate) / 100 * 100) / 100 : 0;

  // ── Data ──
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // ── Modals ──
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [posModalOpen, setPosModalOpen] = useState(false);

  // ── Inline create vendor ──
  const [showNewVendor, setShowNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorPhone, setNewVendorPhone] = useState("");

  // ── POS filter ──
  const [posFilter, setPosFilter] = useState("");
  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(posFilter.toLowerCase())
  );

  useEffect(() => {
    getVendors().then(setVendors).catch(() => {});
    getOrders().then(setOrders).catch(() => {});
  }, []);

  async function handleCreateVendor() {
    if (!newVendorName.trim() || !newVendorPhone.trim()) return;
    try {
      const vendor = await addVendor({ name: newVendorName.trim(), phone: newVendorPhone.trim(), brands: [] });
      setVendors((prev) => [vendor, ...prev]);
      setVendorId(vendor.id);
      setVendorName(vendor.name);
      setNewVendorName("");
      setNewVendorPhone("");
      setShowNewVendor(false);
      setVendorModalOpen(false);
    } catch {}
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!amount || !date) return;
    setSaving(true);
    try {
      await createPartPurchase({
        vendorId: vendorId || undefined,
        vendorName: vendorName || undefined,
        repairOrderId: repairOrderId || undefined,
        repairOrderJobCard: repairOrderJobCard || undefined,
        amount: amountNum,
        date,
        comment: comment || undefined,
        paidStatus,
        advancePaidAmount: paidStatus === "CREDIT" ? (parseFloat(advancePaidAmount) || 0) : undefined,
        paymentChannel,
        paymentDate: paymentDate || undefined,
        referenceNumber: referenceNumber || undefined,
        gstApplicable,
        gstRate: gstApplicable ? gstRate : undefined,
        cgst: gstApplicable ? cgst : undefined,
        sgst: gstApplicable ? sgst : undefined,
        igst: gstApplicable ? igst : undefined,
        hsnSac: gstApplicable ? hsnSac || undefined : undefined,
        placeOfSupply: gstApplicable ? placeOfSupply || undefined : undefined,
        imageUrl: imageUrl || undefined,
        notes: notes || undefined,
      });
      router.push("/dashboard/accounts");
    } catch {
      setSaving(false);
    }
  }

  /* ── Reusable selector row ── */
  const Row = ({ label, value, placeholder, onClick }: { label: string; value?: string; placeholder: string; onClick: () => void }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between py-3.5 border-b border-edge-light group transition-colors">
      <span className="text-sm text-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-sm">
        <span className={value ? "text-foreground" : "text-muted"}>{value || placeholder}</span>
        <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
      </span>
    </button>
  );

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-hover transition-colors text-muted hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Part Expense</h1>
      </div>

      {/* Form card — centered, wider */}
      <div className="glass-card rounded-xl max-w-3xl mx-auto">
        <div className="px-5 sm:px-8 py-6">
          <h2 className="text-xs font-bold tracking-widest text-brand-500 uppercase mb-4">Part Purchase</h2>

          {/* ── Vendor ── */}
          <Row label="Vendor" value={vendorName} placeholder="Select" onClick={() => setVendorModalOpen(true)} />

          {/* ── Job Card ── */}
          <Row label="Job Card" value={repairOrderJobCard} placeholder="Select" onClick={() => setOrderModalOpen(true)} />

          {/* ── Amount ── */}
          <div className="py-3.5 border-b border-edge-light">
            <label className="block text-xs text-muted mb-1">Amount</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted">₹</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" />
            </div>
          </div>

          {/* ── Expense Date ── */}
          <div className="flex items-center justify-between py-3.5 border-b border-edge-light">
            <label className="text-sm text-foreground shrink-0">Expense Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm text-foreground text-right focus:outline-none cursor-pointer" />
          </div>

          {/* ── Comment ── */}
          <div className="py-3.5 border-b border-edge-light">
            <label className="block text-xs text-muted mb-1">Comment</label>
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" />
          </div>

          {/* ── PAID / CREDIT ── */}
          <div className="py-3.5 border-b border-edge-light">
            <div className="flex gap-3">
              <button type="button" onClick={() => setPaidStatus("PAID")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  paidStatus === "PAID" ? "border-success-500 bg-success-500 text-white" : "border-edge bg-transparent text-muted hover:border-success-300"
                }`}>
                {paidStatus === "PAID" && <Check className="w-4 h-4" />} PAID
              </button>
              <button type="button" onClick={() => setPaidStatus("CREDIT")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                  paidStatus === "CREDIT" ? "border-warning-500 bg-warning-500 text-white" : "border-edge bg-transparent text-muted hover:border-warning-300"
                }`}>
                {paidStatus === "CREDIT" && <Check className="w-4 h-4" />} CREDIT
              </button>
            </div>
          </div>

          {/* ── Advance Paid Amount (CREDIT only) ── */}
          {paidStatus === "CREDIT" && (
            <div className="py-3.5 border-b border-edge-light">
              <label className="block text-xs text-muted mb-1">Advance Paid Amount</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted">₹</span>
                <input type="number" value={advancePaidAmount} onChange={(e) => setAdvancePaidAmount(e.target.value)}
                  placeholder="0.00" className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" />
              </div>
            </div>
          )}

          {/* ── Payment Channel ── */}
          <Row label="Payment Channel" value={paymentChannel} placeholder="Select" onClick={() => setChannelModalOpen(true)} />

          {/* ── Payment Date ── */}
          <div className="flex items-center justify-between py-3.5 border-b border-edge-light">
            <label className="text-sm text-foreground shrink-0">Payment Date</label>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
              className="bg-transparent text-sm text-foreground text-right focus:outline-none cursor-pointer" />
          </div>

          {/* ── Reference Number ── */}
          <div className="py-3.5 border-b border-edge-light">
            <label className="block text-xs text-muted mb-1">Reference Number</label>
            <input type="text" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Transaction / reference no."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none" />
          </div>

          {/* ── GST Applicable ── */}
          <div className="flex items-center justify-between py-3.5 border-b border-edge-light">
            <span className="text-sm text-foreground">Is GST Applicable?</span>
            <button type="button" onClick={() => setGstApplicable(!gstApplicable)}
              className={`relative w-11 h-6 rounded-full transition-colors ${gstApplicable ? "bg-brand-500" : "bg-gray-300 dark:bg-white/20"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${gstApplicable ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* ── GST Section ── */}
          {gstApplicable && (
            <div className="py-4 border-b border-edge-light space-y-4">
              <div className="flex gap-2">
                {GST_RATES.map((rate) => (
                  <button key={rate} type="button" onClick={() => setGstRate(rate)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      gstRate === rate ? "bg-brand-500 text-white" : "bg-dim border border-edge text-foreground hover:border-brand-300"
                    }`}>
                    {rate}%
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">CGST ({gstRate / 2}%)</p>
                  <p className="text-sm font-medium text-foreground">₹{cgst.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">SGST ({gstRate / 2}%)</p>
                  <p className="text-sm font-medium text-foreground">₹{sgst.toLocaleString("en-IN")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-1">IGST ({gstRate}%)</p>
                  <p className="text-sm font-medium text-foreground">₹{igst.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">HSN/SAC Code</label>
                  <input type="text" value={hsnSac} onChange={(e) => setHsnSac(e.target.value)} placeholder="Enter code"
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted border-b border-edge-light pb-1 focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Place of Supply</label>
                  <button type="button" onClick={() => setPosModalOpen(true)} className="w-full text-left text-sm pb-1 border-b border-edge-light">
                    <span className={placeOfSupply ? "text-foreground" : "text-muted"}>{placeOfSupply || "Select state"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Image ── */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          <div className="flex items-center justify-between py-3.5 border-b border-edge-light">
            <span className="text-sm text-foreground">Image</span>
            {imageUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Receipt" className="w-10 h-10 rounded-md object-cover border border-edge" />
                <button type="button" onClick={() => { setImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-error-500 hover:text-error-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500 hover:bg-success-600 text-white text-xs font-semibold rounded-lg transition-colors">
                <Camera className="w-3.5 h-3.5" /> ADD
              </button>
            )}
          </div>

          {/* ── Notes ── */}
          <div className="py-3.5 border-b border-edge-light">
            <label className="block text-xs text-muted mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none resize-none" />
          </div>

          {/* ── Save ── */}
          <button onClick={handleSave} disabled={saving || !amount || !date}
            className="w-full mt-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-theme-xs">
            {saving ? "Saving..." : "Save Part Purchase"}
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <SelectModal open={vendorModalOpen} title="Select Vendor" items={vendors.map((v) => ({ id: v.id, label: v.name, sublabel: v.phone }))} selectedId={vendorId}
        onSelect={(id) => { const f = vendors.find((v) => v.id === id); if (f) { setVendorId(f.id); setVendorName(f.name); } setVendorModalOpen(false); }}
        onClose={() => { setVendorModalOpen(false); setShowNewVendor(false); }}
        actionButton={{ label: "Add New Vendor", onClick: () => setShowNewVendor(true) }} />
      {showNewVendor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowNewVendor(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">New Vendor</h3>
              <button onClick={() => setShowNewVendor(false)} className="p-1.5 text-muted hover:text-foreground rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input type="text" value={newVendorName} onChange={(e) => setNewVendorName(e.target.value)} placeholder="Vendor name" autoFocus
                className="w-full px-3 py-2.5 bg-dim border border-edge rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <input type="tel" value={newVendorPhone} onChange={(e) => setNewVendorPhone(e.target.value)} placeholder="Phone number"
                className="w-full px-3 py-2.5 bg-dim border border-edge rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button onClick={handleCreateVendor} disabled={!newVendorName.trim() || !newVendorPhone.trim()}
              className="w-full mt-3 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">Create Vendor</button>
          </div>
        </div>
      )}

      <SelectModal open={orderModalOpen} title="Select Job Card"
        items={orders.map((o) => ({ id: o.id, label: o.jobCard, sublabel: `${o.customerName} — ${o.vehicleNumber}` }))} selectedId={repairOrderId}
        onSelect={(id) => { const f = orders.find((o) => o.id === id); if (f) { setRepairOrderId(f.id); setRepairOrderJobCard(f.jobCard); } setOrderModalOpen(false); }}
        onClose={() => setOrderModalOpen(false)} />

      <SelectModal open={channelModalOpen} title="Payment Channel" items={PAYMENT_CHANNELS.map((ch) => ({ id: ch, label: ch }))} selectedId={paymentChannel}
        onSelect={(id) => { setPaymentChannel(id); setChannelModalOpen(false); }} onClose={() => setChannelModalOpen(false)} />

      {posModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPosModalOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Place of Supply</h3>
              <button onClick={() => setPosModalOpen(false)} className="p-1.5 text-muted hover:text-foreground rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={posFilter} onChange={(e) => setPosFilter(e.target.value)} placeholder="Search state..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {filteredStates.map((state) => {
                const active = placeOfSupply === state;
                return (
                  <button key={state} onClick={() => { setPlaceOfSupply(state); setPosModalOpen(false); setPosFilter(""); }}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${active ? "bg-primary-light" : "hover:bg-hover"}`}>
                    <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-primary" : "border-edge"}`}>
                      {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm text-foreground">{state}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
