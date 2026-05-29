"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getPublicEstimate, respondToEstimate, getPublicImageUrl,
  type Order, type OrderLineItem,
} from "@/lib/api-orders";
import {
  Car, Phone, User, IndianRupee, CheckCircle2, XCircle,
  Calendar, Gauge, Fuel, StickyNote, Loader2, ImageIcon,
} from "lucide-react";

export default function PublicEstimatePage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [responding, setResponding] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [requestProforma, setRequestProforma] = useState(false);
  const [responded, setResponded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getPublicEstimate(token)
      .then((data) => {
        setOrder(data);
        if (data.customerApproved !== undefined && data.customerApproved !== null) {
          setResponded(true);
        }
      })
      .catch(() => setError("Estimate not found or has expired"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setResponding(true);
    try {
      const updated = await respondToEstimate(token, true);
      setOrder(updated);
      setResponded(true);
    } catch {
      setError("Failed to submit response. Please try again.");
    } finally {
      setResponding(false);
    }
  }

  async function handleReject() {
    setResponding(true);
    try {
      const updated = await respondToEstimate(token, false, rejectionNote, requestProforma);
      setOrder(updated);
      setResponded(true);
    } catch {
      setError("Failed to submit response. Please try again.");
    } finally {
      setResponding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-900">Estimate Not Found</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isProforma = order.estimateType === "proforma";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">Car Affair</h1>
          <p className="text-sm text-gray-500">Repair Estimate</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Job Card & Vehicle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{order.jobCard}</h2>
              <p className="text-xs text-gray-500">{order.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Vehicle</p>
              <p className="font-medium text-gray-900">{order.vehicle}</p>
              <p className="text-gray-500 font-mono text-xs">{order.vehicleNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Customer</p>
              <p className="font-medium text-gray-900">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-gray-500 text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{order.customerPhone}</p>
              )}
            </div>
          </div>

          {/* Inspection info */}
          {(order.odometerReading || order.fuelLevel) && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
              {order.odometerReading && (
                <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {order.odometerReading.toLocaleString()} km</span>
              )}
              {order.fuelLevel && (
                <span className="flex items-center gap-1 capitalize"><Fuel className="w-3 h-3" /> {order.fuelLevel.replace("_", " ")}</span>
              )}
            </div>
          )}
        </div>

        {/* Inspection Images */}
        {order.imageIds && order.imageIds.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Inspection Images
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {order.imageIds.map((fileId) => (
                <button key={fileId} onClick={() => setSelectedImage(fileId)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <img src={getPublicImageUrl(token, fileId)} alt="Inspection"
                    className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Line Items */}
        {order.lineItems && order.lineItems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Estimate Details</h3>
            <div className="space-y-2">
              {order.lineItems.map((item, idx) => (
                <div key={item.id || idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm text-gray-900">{item.description}</p>
                    <p className="text-xs text-gray-400">
                      {item.itemType === "service" ? "Service" : "Part"} &middot; Qty: {item.qty} &times; ₹{item.rate.toLocaleString("en-IN")}
                      {item.discountPercent > 0 && ` (-${item.discountPercent}%)`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">₹{item.amount.toLocaleString("en-IN")}</p>
                    {!isProforma && item.gstAmount > 0 && (
                      <p className="text-xs text-gray-400">+GST ₹{item.gstAmount.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">₹{(order.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {!isProforma && (
                <>
                  {(order.cgstAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CGST</span>
                      <span className="text-gray-900">₹{(order.cgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {(order.sgstAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">SGST</span>
                      <span className="text-gray-900">₹{(order.sgstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {(order.igstAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">IGST</span>
                      <span className="text-gray-900">₹{(order.igstAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-gray-900">₹{(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Date */}
        {order.estimatedDeliveryDate && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Estimated Delivery</p>
              <p className="text-sm text-blue-700">
                {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Response Buttons or Status */}
        {responded ? (
          <div className={`rounded-xl border p-5 text-center ${
            order.customerApproved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          }`}>
            {order.customerApproved ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-green-800">Estimate Accepted</p>
                <p className="text-sm text-green-600 mt-1">Thank you! The garage will begin work on your vehicle.</p>
              </>
            ) : (
              <>
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-red-800">Estimate Declined</p>
                <p className="text-sm text-red-600 mt-1">The garage has been notified. They may contact you with a revised estimate.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {!showReject ? (
              <div className="flex gap-3">
                <button onClick={handleAccept} disabled={responding}
                  className="flex-1 py-3.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {responding ? "Submitting..." : "Accept Estimate"}
                </button>
                <button onClick={() => setShowReject(true)} disabled={responding}
                  className="flex-1 py-3.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-sm font-semibold text-gray-900 mb-2">Reason for rejection (optional)</p>
                <textarea value={rejectionNote} onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Tell us why you're declining..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-300 focus:border-transparent resize-none mb-3" />
                <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                  <input type="checkbox" checked={requestProforma}
                    onChange={(e) => setRequestProforma(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">I prefer billing without GST (Proforma)</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={handleReject} disabled={responding}
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
                    {responding ? "Submitting..." : "Confirm Rejection"}
                  </button>
                  <button onClick={() => setShowReject(false)}
                    className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}>
          <img src={getPublicImageUrl(token, selectedImage)} alt="Inspection"
            className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
