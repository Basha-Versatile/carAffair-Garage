"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getPublicPayment, confirmPayment,
  type Order, type OrderLineItem,
} from "@/lib/api-orders";
import {
  Car, Phone, IndianRupee, CheckCircle2, XCircle,
  Loader2, CreditCard,
} from "lucide-react";

export default function PublicPaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPublicPayment(token)
      .then((data) => {
        setOrder(data);
        if (data.status === "completed") {
          setPaid(true);
        }
      })
      .catch(() => setError("Payment link not found or has expired"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handlePay() {
    setConfirming(true);
    try {
      const updated = await confirmPayment(token);
      setOrder(updated);
      setPaid(true);
    } catch {
      setError("Failed to process payment. Please try again.");
    } finally {
      setConfirming(false);
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
          <p className="text-lg font-semibold text-gray-900">Payment Link Not Found</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">Car Affair</h1>
          <p className="text-sm text-gray-500">Service Payment</p>
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
        </div>

        {/* Amount Due */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-sm text-gray-500 mb-1">Amount Due</p>
          <p className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-1">
            <IndianRupee className="w-7 h-7" />
            {(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Line Items */}
        {order.lineItems && order.lineItems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Service Details</h3>
            <div className="space-y-2">
              {order.lineItems.map((item: OrderLineItem, idx: number) => (
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
                    {item.gstAmount > 0 && (
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
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-gray-900">₹{(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pay Button or Success */}
        {paid ? (
          <div className="bg-green-50 rounded-xl border border-green-200 p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="text-lg font-semibold text-green-800">Payment Successful</p>
            <p className="text-sm text-green-600 mt-1">
              Thank you! Your invoice will be sent to your email shortly.
            </p>
          </div>
        ) : (
          <button
            onClick={handlePay}
            disabled={confirming}
            className="w-full py-4 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {confirming ? "Processing..." : `Pay ₹${(order.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          </button>
        )}

        {error && !paid && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center pb-4">
          Powered by Car Affair
        </p>
      </div>
    </div>
  );
}
