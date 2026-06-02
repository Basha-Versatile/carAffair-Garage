"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOrdersByStatus, type Order } from "@/lib/api-orders";
import { CalendarX, Loader2, Car, Phone, User, IndianRupee } from "lucide-react";
import { Pagination, PAGE_SIZES, type PageSize } from "@/components/tables/Pagination";

export default function CancelledOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZES[0]);

  useEffect(() => {
    getOrdersByStatus("cancelled")
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-3">
        <CalendarX className="w-5 h-5 text-bad" />
        <h1 className="text-base font-semibold text-foreground">Cancelled Orders</h1>
        <span className="bg-hover text-muted text-xs font-medium px-2 py-0.5 rounded-full">{orders.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <CalendarX className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-foreground font-medium">No cancelled orders</p>
            <p className="text-sm text-muted mt-1">Orders rejected by customers will appear here.</p>
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
            const safePage = Math.min(page, totalPages);
            const start = (safePage - 1) * pageSize;
            const paged = orders.slice(start, start + pageSize);
            return (
              <div className="max-w-4xl mx-auto space-y-3">
                {paged.map((order) => (
                  <button key={order.id}
                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                    className="w-full bg-background rounded-xl border border-edge p-5 text-left hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{order.jobCard}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                          <span className="flex items-center gap-1"><Car className="w-3 h-3" />{order.vehicle}</span>
                          <span className="font-mono">{order.vehicleNumber}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-bad/10 text-bad">
                        Cancelled
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customerName}</span>
                      {order.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{order.phone}</span>}
                      {order.grandTotal !== undefined && order.grandTotal > 0 && (
                        <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{order.grandTotal.toLocaleString("en-IN")}</span>
                      )}
                      <span>{order.date}</span>
                    </div>
                    {order.customerRejectionNote && (
                      <p className="text-xs text-bad mt-2 pt-2 border-t border-edge-light">
                        Reason: {order.customerRejectionNote}
                      </p>
                    )}
                  </button>
                ))}
                <div className="bg-background rounded-lg border border-edge overflow-hidden">
                  <Pagination total={orders.length} page={safePage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
