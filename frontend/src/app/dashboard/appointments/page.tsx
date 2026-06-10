"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  X,
  Search,
  Car,
  Phone,
  Mail,
  User,
  MessageSquare,
  Truck,
  Loader2,
  CalendarDays,
  ChevronRight,
  Wrench,
} from "lucide-react";
import { getAccessToken, canManage } from "@/lib/auth";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

/* ── Types ─────────────────────────────────────────── */

interface Booking {
  id: string;
  bookingId: string;
  garageId: string;
  service: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address?: string;
  vehicleRegNumber: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleFuelType?: string;
  vehicleYear?: string;
  preferredDate: string;
  preferredTime: string;
  concerns?: string;
  customerMessage?: string;
  pickDrop: boolean;
  status: string;
  adminNotes?: string;
  suggestedDate?: string;
  suggestedTime?: string;
  confirmedAt?: string;
  createdAt: string;
}

type Tab = "pending" | "confirmed" | "rescheduled";

/* ── API helpers ───────────────────────────────────── */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function fetchBookings(): Promise<Booking[]> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.data || [];
}

async function updateBooking(id: string, body: Record<string, string>): Promise<Booking> {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/api/admin/bookings/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.data;
}

/* ── Page Component ────────────────────────────────── */

export default function AppointmentsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionMode, setActionMode] = useState<"" | "confirm" | "reschedule">("");
  const [adminNotes, setAdminNotes] = useState("");
  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedTime, setSuggestedTime] = useState("");
  const [updating, setUpdating] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState<PageSize>(PAGE_SIZES[0]);

  function handleConvertToOrder(booking: Booking) {
    sessionStorage.setItem("booking_to_order", JSON.stringify({
      regNumber: booking.vehicleRegNumber,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      customerMessage: booking.customerMessage || "",
      vehicleBrand: booking.vehicleBrand || "",
      vehicleModel: booking.vehicleModel || "",
    }));
    router.push("/dashboard/create-order");
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { setListPage(1); }, [tab, search]);

  const filtered = bookings
    .filter((b) => b.status === tab)
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.vehicleRegNumber.toLowerCase().includes(q) ||
        b.bookingId.toLowerCase().includes(q)
      );
    });

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    rescheduled: bookings.filter((b) => b.status === "rescheduled").length,
  };

  async function handleConfirm() {
    if (!selectedBooking) return;
    setUpdating(true);
    try {
      await updateBooking(selectedBooking.id, { status: "confirmed", adminNotes });
      setSelectedBooking(null);
      setActionMode("");
      setAdminNotes("");
      await loadBookings();
    } catch { /* ignore */ }
    finally { setUpdating(false); }
  }

  async function handleReschedule() {
    if (!selectedBooking || !suggestedDate || !suggestedTime) return;
    setUpdating(true);
    try {
      await updateBooking(selectedBooking.id, {
        status: "rescheduled",
        adminNotes,
        suggestedDate,
        suggestedTime,
      });
      setSelectedBooking(null);
      setActionMode("");
      setAdminNotes("");
      setSuggestedDate("");
      setSuggestedTime("");
      await loadBookings();
    } catch { /* ignore */ }
    finally { setUpdating(false); }
  }

  const inputCls = "w-full px-3 py-2 border border-edge rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold text-foreground">Appointments</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-6 border-b border-edge">
        {(["pending", "confirmed", "rescheduled"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t ? "text-primary border-primary" : "text-muted border-transparent hover:text-foreground"
            }`}
          >
            {t === "pending" ? "Requested" : t}
            {counts[t] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                tab === t ? "bg-primary text-white" : "bg-dim text-muted"
              }`}>
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-6 py-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, vehicle..."
            className="w-full pl-9 pr-3 py-2 border border-edge rounded-lg text-sm bg-background placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">No {tab === "pending" ? "requested" : tab} appointments</p>
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(filtered.length / listPageSize));
            const safePage = Math.min(listPage, totalPages);
            const start = (safePage - 1) * listPageSize;
            const paged = filtered.slice(start, start + listPageSize);
            return (
              <div className="bg-background rounded-lg border border-edge overflow-hidden">
                {/* List Header */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-dim border-b border-edge text-xs font-medium text-muted uppercase tracking-wide">
                  <span>Customer</span>
                  <span>Vehicle</span>
                  <span>Date & Time</span>
                  <span>Service</span>
                  <span className="w-6" />
                </div>
                {/* List Rows */}
                <div className="divide-y divide-edge">
                  {paged.map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => { setSelectedBooking(booking); setActionMode(""); }}
                      className="px-4 py-3 cursor-pointer hover:bg-hover transition-colors sm:grid sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center gap-3"
                    >
                      {/* Customer */}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{booking.customerName}</p>
                        <p className="text-xs text-muted truncate">{booking.customerPhone}</p>
                      </div>
                      {/* Vehicle */}
                      <div className="min-w-0 mt-1 sm:mt-0">
                        <p className="text-sm text-foreground truncate">{booking.vehicleRegNumber}</p>
                        <p className="text-xs text-muted truncate">{booking.vehicleBrand} {booking.vehicleModel || ""}</p>
                      </div>
                      {/* Date & Time */}
                      <div className="min-w-0 mt-1 sm:mt-0">
                        <p className="text-sm text-foreground">{booking.preferredDate}</p>
                        <p className="text-xs text-muted">{booking.preferredTime}</p>
                      </div>
                      {/* Service + badges */}
                      <div className="min-w-0 mt-1 sm:mt-0 flex items-center gap-2">
                        <span className="text-sm text-foreground truncate">{booking.service}</span>
                        {booking.pickDrop && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary-light px-1.5 py-0.5 rounded shrink-0">
                            <Truck className="w-2.5 h-2.5" /> Pickup
                          </span>
                        )}
                      </div>
                      {/* Arrow */}
                      <div className="hidden sm:flex items-center w-6 justify-center">
                        <ChevronRight className="w-4 h-4 text-muted" />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                <Pagination total={filtered.length} page={safePage} pageSize={listPageSize} onPageChange={setListPage} onPageSizeChange={setListPageSize} />
              </div>
            );
          })()
        )}
      </div>

      {/* ─── Booking Detail Panel ─── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Modal Header */}
            <div className="sticky top-0 bg-background px-5 py-4 border-b border-edge flex items-center justify-between z-10">
              <div>
                <p className="text-xs text-primary font-mono">{selectedBooking.bookingId}</p>
                <h3 className="text-base font-semibold text-foreground">{selectedBooking.customerName}</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Detail Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Vehicle */}
              <div className="flex items-center gap-3 p-3 bg-dim rounded-lg">
                <Car className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedBooking.vehicleRegNumber}</p>
                  <p className="text-xs text-muted">{selectedBooking.vehicleBrand} {selectedBooking.vehicleModel} {selectedBooking.vehicleFuelType && `• ${selectedBooking.vehicleFuelType}`}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-muted" /><span className="text-secondary">Date & Time:</span><span className="font-medium text-foreground ml-auto">{selectedBooking.preferredDate} at {selectedBooking.preferredTime}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted" /><span className="text-secondary">Phone:</span><span className="font-medium text-foreground ml-auto">{selectedBooking.customerPhone}</span></div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted" /><span className="text-secondary">Email:</span><span className="font-medium text-foreground ml-auto text-xs">{selectedBooking.customerEmail}</span></div>
                <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-muted" /><span className="text-secondary">Pickup & Drop:</span><span className={`font-medium ml-auto ${selectedBooking.pickDrop ? "text-primary" : "text-muted"}`}>{selectedBooking.pickDrop ? "Yes" : "No"}</span></div>
              </div>

              {/* Service */}
              <div className="p-3 bg-primary-light rounded-lg">
                <p className="text-xs text-muted mb-0.5">Service</p>
                <p className="text-sm font-semibold text-primary">{selectedBooking.service}</p>
              </div>

              {/* Customer Message */}
              {selectedBooking.customerMessage && (
                <div className="p-3 border border-edge rounded-lg">
                  <p className="text-xs text-muted mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Customer Message</p>
                  <p className="text-sm text-foreground">{selectedBooking.customerMessage}</p>
                </div>
              )}

              {/* Admin Notes (for confirmed/rescheduled) */}
              {selectedBooking.adminNotes && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-1">Admin Notes</p>
                  <p className="text-sm text-green-800">{selectedBooking.adminNotes}</p>
                </div>
              )}
              {selectedBooking.suggestedDate && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium mb-1">Suggested Alternative</p>
                  <p className="text-sm text-amber-800">{selectedBooking.suggestedDate} at {selectedBooking.suggestedTime}</p>
                </div>
              )}

              {/* Actions for pending bookings */}
              {selectedBooking.status === "pending" && !actionMode && canManage("APPOINTMENTS") && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setActionMode("confirm")}
                    className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Acknowledge
                  </button>
                  <button
                    onClick={() => setActionMode("reschedule")}
                    className="flex-1 py-2.5 border border-edge text-foreground rounded-lg text-sm font-medium hover:bg-hover flex items-center justify-center gap-2"
                  >
                    <CalendarIcon className="w-4 h-4" /> Suggest Alternative
                  </button>
                </div>
              )}

              {/* Confirm Form */}
              {actionMode === "confirm" && (
                <div className="space-y-3 pt-2 border-t border-edge">
                  <p className="text-sm font-medium text-foreground">Confirm this appointment</p>
                  <div>
                    <label className="text-xs text-muted block mb-1">Note to customer (optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g., Please arrive 10 min early..."
                      rows={2}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActionMode("")} className="flex-1 py-2.5 border border-edge rounded-lg text-sm font-medium text-foreground hover:bg-hover">Cancel</button>
                    <button onClick={handleConfirm} disabled={updating} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2">
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirm & Send Email
                    </button>
                  </div>
                </div>
              )}

              {/* Reschedule Form */}
              {actionMode === "reschedule" && (
                <div className="space-y-3 pt-2 border-t border-edge">
                  <p className="text-sm font-medium text-foreground">Suggest an alternative time</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted block mb-1">Date</label>
                      <input type="date" value={suggestedDate} onChange={(e) => setSuggestedDate(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Time</label>
                      <input type="text" value={suggestedTime} onChange={(e) => setSuggestedTime(e.target.value)} placeholder="e.g., 10:00 AM" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted block mb-1">Note to customer</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g., Sorry, that slot is full. Can you come on..."
                      rows={2}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActionMode("")} className="flex-1 py-2.5 border border-edge rounded-lg text-sm font-medium text-foreground hover:bg-hover">Cancel</button>
                    <button onClick={handleReschedule} disabled={updating || !suggestedDate || !suggestedTime} className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                      {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
                      Reschedule & Send Email
                    </button>
                  </div>
                </div>
              )}

              {/* Convert to Job Card */}
              {!actionMode && canManage("APPOINTMENTS") && (
                <div className="pt-3 mt-1 border-t border-edge">
                  <button
                    onClick={() => handleConvertToOrder(selectedBooking)}
                    className="w-full py-2.5 border border-edge text-foreground rounded-lg text-sm font-medium hover:bg-hover flex items-center justify-center gap-2 transition-colors"
                  >
                    <Wrench className="w-4 h-4" /> Convert to Job Card
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
