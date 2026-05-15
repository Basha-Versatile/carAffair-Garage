import { api } from "@/lib/api";

// ── Types ──

export interface Order {
  id: string;
  jobCard: string;
  customerName: string;
  customerPhone?: string;
  phone?: string; // alias for customerPhone — backward compat
  vehicle: string;
  vehicleNumber: string;
  status: "open" | "wip" | "ready" | "payment_due" | "completed";
  amount: number;
  date: string;
  services: string[];
}

export type TabKey = "open" | "wip" | "ready" | "payment_due" | "completed";

export const tabs: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "wip", label: "WIP" },
  { key: "ready", label: "Ready" },
  { key: "payment_due", label: "Payment Due" },
  { key: "completed", label: "Completed" },
];

// ── Helpers ──

/** Normalize an order from the backend so `phone` mirrors `customerPhone`. */
function normalizeOrder(order: Order): Order {
  return {
    ...order,
    phone: order.customerPhone ?? order.phone,
  };
}

// ── API Functions ──

/** Fetch all orders for the current garage. */
export async function getOrders(): Promise<Order[]> {
  const orders = await api.get<Order[]>("/api/orders");
  return orders.map(normalizeOrder);
}

/** Fetch orders filtered by a single status tab. */
export async function getOrdersByStatus(status: TabKey): Promise<Order[]> {
  const orders = await api.get<Order[]>(`/api/orders?status=${status}`);
  return orders.map(normalizeOrder);
}

/** Fetch the count of orders for a single status. */
export async function getOrderCountByStatus(status: TabKey): Promise<number> {
  const counts = await getOrderCounts();
  return counts[status] ?? 0;
}

/** Fetch counts for every status in one call. */
export async function getOrderCounts(): Promise<Record<TabKey, number>> {
  return api.get<Record<TabKey, number>>("/api/orders/counts");
}

/** Create a new order. The backend assigns `id` and `jobCard`. */
export async function addOrder(
  order: Omit<Order, "id" | "jobCard">
): Promise<Order> {
  const created = await api.post<Order>("/api/orders", order);
  return normalizeOrder(created);
}

/** Partially update an existing order by id. */
export async function updateOrder(
  id: string,
  updates: Partial<Order>
): Promise<Order> {
  const updated = await api.put<Order>(`/api/orders/${id}`, updates);
  return normalizeOrder(updated);
}

/** Fetch a single order by id. */
export async function getOrderById(id: string): Promise<Order> {
  const order = await api.get<Order>(`/api/orders/${id}`);
  return normalizeOrder(order);
}
