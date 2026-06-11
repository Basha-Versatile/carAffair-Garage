"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  checkin, checkout, getMyStatus, getStaffAttendance,
  type Attendance,
} from "@/lib/api-attendance";
import { getImageUrl } from "@/lib/api-orders";
import { getUser } from "@/lib/auth";
import {
  LogIn, LogOut, Loader2, MapPin, Camera, Clock,
  CheckCircle2, ShieldCheck, ShieldX, AlertTriangle,
  CalendarDays, TrendingUp, Timer,
} from "lucide-react";

export default function CheckInPage() {
  const [status, setStatus] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [inUniform, setInUniform] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [history, setHistory] = useState<Attendance[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getUser();
    getMyStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));

    if (user?.id) {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endDate = now.toISOString().split("T")[0];
      getStaffAttendance(user.id, startDate, endDate)
        .then(setHistory)
        .catch(() => {});
    }
  }, []);

  const stats = useMemo(() => {
    const present = history.filter((a) => a.status === "checked_in" || a.status === "checked_out");
    const totalMinutes = history.reduce((sum, a) => sum + (a.totalWorkMinutes || 0), 0);
    const avgMinutes = present.length > 0 ? Math.round(totalMinutes / present.length) : 0;
    return {
      daysPresent: present.length,
      totalHours: Math.floor(totalMinutes / 60),
      totalMins: totalMinutes % 60,
      avgHours: Math.floor(avgMinutes / 60),
      avgMins: avgMinutes % 60,
    };
  }, [history]);

  function getLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLocation(false);
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          resolve(loc);
        },
        (err) => {
          setGettingLocation(false);
          reject(new Error("Could not get location: " + err.message));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleCheckin() {
    setError("");
    setSubmitting(true);
    try {
      const loc = location || (await getLocation());
      const result = await checkin(loc.lat, loc.lng, photo, inUniform);
      setStatus(result);
      setPhoto(null);
      setPhotoPreview(null);
    } catch (e: any) {
      setError(e.message || "Failed to check in");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckout() {
    setShowCheckoutConfirm(false);
    setError("");
    setSubmitting(true);
    try {
      const loc = location || (await getLocation());
      const result = await checkout(loc.lat, loc.lng, photo);
      setStatus(result);
      setPhoto(null);
      setPhotoPreview(null);
    } catch (e: any) {
      setError(e.message || "Failed to check out");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  const isCheckedIn = status?.checkinTime && !status?.checkoutTime;
  const isCheckedOut = status?.checkoutTime;

  function formatTime(iso?: string) {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString([], { day: "2-digit", month: "short" });
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary" />
        <h1 className="text-base font-semibold text-foreground">Check In / Check Out</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-4">
          {/* Current status card */}
          <div className="bg-background rounded-xl border border-edge p-6 text-center">
            {isCheckedOut ? (
              <>
                <div className="w-16 h-16 bg-ok/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-ok" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Checked Out</h2>
                <p className="text-sm text-muted mt-1">
                  In: {formatTime(status?.checkinTime)} — Out: {formatTime(status?.checkoutTime)}
                </p>
                {status?.totalWorkMinutes != null && (
                  <p className="text-xs text-muted mt-1">
                    Worked {Math.floor(status.totalWorkMinutes / 60)}h {status.totalWorkMinutes % 60}m
                  </p>
                )}
              </>
            ) : isCheckedIn ? (
              <>
                <div className="w-16 h-16 bg-warn/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-warn animate-pulse" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Checked In</h2>
                <p className="text-sm text-muted mt-1">
                  Since {formatTime(status?.checkinTime)}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-dim rounded-full flex items-center justify-center mx-auto mb-3">
                  <LogIn className="w-8 h-8 text-muted" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Not Checked In</h2>
                <p className="text-sm text-muted mt-1">You haven&apos;t checked in today</p>
              </>
            )}
          </div>

          {/* Actions */}
          {!isCheckedOut && (
            <div className="bg-background rounded-xl border border-edge p-5 space-y-4">
              {/* Photo capture */}
              <div>
                <label className="text-xs font-medium text-muted block mb-2">
                  Selfie <span className="text-red-500">*</span>
                </label>
                {photoPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={photoPreview} alt="Selfie" className="w-16 h-16 rounded-xl object-cover border border-edge" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 bg-dim text-foreground rounded-lg text-xs font-medium hover:bg-hover border border-edge">
                      <Camera className="w-4 h-4" />
                      Retake
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 px-4 py-6 bg-dim text-muted rounded-xl text-xs font-medium hover:bg-hover border-2 border-dashed border-edge">
                    <Camera className="w-6 h-6" />
                    Tap to take a selfie
                  </button>
                )}
                {!photo && !isCheckedIn && (
                  <p className="text-[11px] text-red-500 mt-1.5">Selfie is required to check in</p>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" capture="user"
                  className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Uniform toggle (only for check-in) */}
              {!isCheckedIn && (
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted flex items-center gap-2">
                    {inUniform ? <ShieldCheck className="w-4 h-4 text-ok" /> : <ShieldX className="w-4 h-4 text-warn" />}
                    In Uniform
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inUniform}
                    onClick={() => setInUniform(!inUniform)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                      inUniform ? "bg-ok" : "bg-gray-300"
                    }`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                      inUniform ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              )}

              {/* Location info */}
              <div className="flex items-center gap-2 text-xs text-muted">
                <MapPin className="w-3.5 h-3.5" />
                {location
                  ? `Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                  : gettingLocation
                  ? "Getting location..."
                  : "Location will be captured automatically"}
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              {/* Action button */}
              {!isCheckedIn ? (
                <button
                  onClick={handleCheckin}
                  disabled={submitting || !photo}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ok text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {submitting ? "Checking in..." : "Check In"}
                </button>
              ) : (
                <button
                  onClick={() => setShowCheckoutConfirm(true)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-warn text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  {submitting ? "Checking out..." : "Check Out"}
                </button>
              )}
            </div>
          )}

          {/* Monthly attendance summary */}
          {history.length > 0 && (
            <div className="bg-background rounded-xl border border-edge p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                This Month
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-dim rounded-lg p-3 text-center">
                  <CalendarDays className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{stats.daysPresent}</p>
                  <p className="text-[10px] text-muted">Days Present</p>
                </div>
                <div className="bg-dim rounded-lg p-3 text-center">
                  <TrendingUp className="w-4 h-4 text-ok mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{stats.totalHours}h {stats.totalMins}m</p>
                  <p className="text-[10px] text-muted">Total Hours</p>
                </div>
                <div className="bg-dim rounded-lg p-3 text-center">
                  <Timer className="w-4 h-4 text-warn mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{stats.avgHours}h {stats.avgMins}m</p>
                  <p className="text-[10px] text-muted">Avg / Day</p>
                </div>
              </div>

              {/* Recent attendance log */}
              <div className="mt-4 space-y-1.5">
                <h4 className="text-[11px] font-medium text-muted mb-2">Recent Activity</h4>
                {history.slice(0, 7).map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-dim text-xs">
                    <span className="text-foreground font-medium">{formatDate(a.date)}</span>
                    <div className="flex items-center gap-3">
                      {a.checkinTime && (
                        <span className="text-muted">
                          In: {formatTime(a.checkinTime)}
                        </span>
                      )}
                      {a.checkoutTime && (
                        <span className="text-muted">
                          Out: {formatTime(a.checkoutTime)}
                        </span>
                      )}
                      {a.totalWorkMinutes != null && a.totalWorkMinutes > 0 && (
                        <span className="text-ok font-medium">
                          {Math.floor(a.totalWorkMinutes / 60)}h {a.totalWorkMinutes % 60}m
                        </span>
                      )}
                      {a.status === "checked_in" && !a.checkoutTime && (
                        <span className="text-warn font-medium">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout confirmation modal */}
      {showCheckoutConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40">
          <div className="bg-background border border-edge rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="inline-flex items-center justify-center bg-warn/10 p-3.5 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-warn" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Confirm Check Out
            </h3>
            <p className="text-xs text-muted mb-4">
              You won&apos;t be able to check in again today after checking out.
              Are you sure you want to proceed?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowCheckoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-muted border border-edge rounded-lg hover:bg-hover transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="flex items-center gap-1.5 bg-warn text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {submitting ? "Checking out..." : "Yes, Check Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
