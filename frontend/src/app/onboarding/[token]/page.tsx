"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getPublicOnboarding,
  getPublicOnboardingImageUrl,
  type Order,
} from "@/lib/api-orders";
import {
  Car,
  Phone,
  Gauge,
  Fuel,
  StickyNote,
  Loader2,
  ImageIcon,
  XCircle,
  ClipboardList,
} from "lucide-react";

export default function PublicOnboardingPage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getPublicOnboarding(token)
      .then(setOrder)
      .catch(() => setError("This link is not valid or has expired."))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-gray-900">Link Not Found</p>
          <p className="text-sm text-gray-500 mt-1">
            {error || "This link is not valid or has expired."}
          </p>
        </div>
      </div>
    );
  }

  const fuelLabel = order.fuelLevel
    ? order.fuelLevel.replace(/_/g, " ")
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold text-gray-900">Car Affair</h1>
          <p className="text-sm text-gray-500">Vehicle Onboarding</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Vehicle & Customer Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {order.vehicle}
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                {order.vehicleNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Customer</p>
              <p className="font-medium text-gray-900">{order.customerName}</p>
              {order.customerPhone && (
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.customerPhone}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase mb-1">Job Card</p>
              <p className="font-medium text-gray-900">{order.jobCard}</p>
              <p className="text-gray-500 text-xs">{order.date}</p>
            </div>
          </div>

          {/* Inspection info */}
          {(order.odometerReading || fuelLabel) && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
              {order.odometerReading && (
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" />{" "}
                  {order.odometerReading.toLocaleString()} km
                </span>
              )}
              {fuelLabel && (
                <span className="flex items-center gap-1 capitalize">
                  <Fuel className="w-3 h-3" /> {fuelLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Customer Remarks */}
        {order.customerRemarks && order.customerRemarks.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-amber-600" /> Inspection
              Remarks
            </h3>
            <ul className="space-y-2">
              {order.customerRemarks.map((remark, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  {remark}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Inspection Notes */}
        {order.inspectionNotes && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <StickyNote className="w-4 h-4 text-purple-600" /> Inspection
              Notes
            </h3>
            <p className="text-sm text-gray-600">{order.inspectionNotes}</p>
          </div>
        )}

        {/* Inspection Images */}
        {order.imageIds && order.imageIds.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-blue-600" /> Inspection Photos
              <span className="text-xs font-normal text-gray-400">
                ({order.imageIds.length})
              </span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {order.imageIds.map((fileId) => {
                const ts = order.imageTimestamps?.[fileId];
                const dateLabel = ts ? formatImageDate(ts) : null;
                return (
                  <div key={fileId} className="flex flex-col">
                    <button
                      onClick={() => setSelectedImage(fileId)}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <img
                        src={getPublicOnboardingImageUrl(token, fileId)}
                        alt="Inspection"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {dateLabel && (
                      <p className="text-[10px] text-gray-400 text-center mt-1">
                        {dateLabel}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No images message */}
        {(!order.imageIds || order.imageIds.length === 0) &&
          (!order.customerRemarks || order.customerRemarks.length === 0) &&
          !order.inspectionNotes && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Inspection details will appear here once available.
              </p>
            </div>
          )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Please confirm if the inspection details are accurate. Contact us if
            you have any questions.
          </p>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={getPublicOnboardingImageUrl(token, selectedImage)}
            alt="Inspection"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

function formatImageDate(isoStr: string): string {
  try {
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return "";
    const day = date.getDate();
    const month = date.toLocaleString("en-IN", { month: "short" });
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day} ${month} ${hours}:${minutes}`;
  } catch {
    return "";
  }
}
