export interface Order {
  id: string;
  jobCard: string;
  customerName: string;
  phone: string;
  vehicle: string;
  vehicleNumber: string;
  status: "open" | "wip" | "ready" | "payment_due" | "completed";
  amount: number;
  date: string;
  services: string[];
}

const DEFAULT_ORDERS: Order[] = [
  { id: "1", jobCard: "JC-2025-001", customerName: "Rajesh Kumar", phone: "9876543210", vehicle: "Hyundai i20", vehicleNumber: "TS 09 AB 1234", status: "open", amount: 3500, date: "2025-05-14", services: ["General Service"] },
  { id: "2", jobCard: "JC-2025-002", customerName: "Srinivas Rao", phone: "9876543211", vehicle: "Maruti Swift", vehicleNumber: "TS 07 CD 5678", status: "wip", amount: 8200, date: "2025-05-13", services: ["Engine Oil Change", "Brake Pad Replacement"] },
  { id: "3", jobCard: "JC-2025-003", customerName: "Priya Sharma", phone: "9876543212", vehicle: "Honda City", vehicleNumber: "AP 28 EF 9012", status: "payment_due", amount: 12500, date: "2025-05-12", services: ["AC Repair", "Coolant Flush"] },
  { id: "4", jobCard: "JC-2025-004", customerName: "Venkat Reddy", phone: "9876543213", vehicle: "Toyota Innova", vehicleNumber: "TS 08 GH 3456", status: "payment_due", amount: 6800, date: "2025-05-11", services: ["Wheel Alignment", "Tyre Rotation"] },
  { id: "5", jobCard: "JC-2025-005", customerName: "Anil Prakash", phone: "9876543214", vehicle: "Kia Seltos", vehicleNumber: "TS 10 IJ 7890", status: "completed", amount: 4200, date: "2025-05-10", services: ["Periodic Maintenance"] },
  { id: "6", jobCard: "JC-2025-006", customerName: "Meena Devi", phone: "9876543215", vehicle: "Tata Nexon", vehicleNumber: "TS 09 KL 2345", status: "payment_due", amount: 15000, date: "2025-05-10", services: ["Clutch Replacement"] },
  { id: "7", jobCard: "JC-2025-007", customerName: "Suresh Babu", phone: "9876543216", vehicle: "Mahindra XUV700", vehicleNumber: "AP 31 MN 6789", status: "payment_due", amount: 9500, date: "2025-05-09", services: ["Suspension Repair", "Shock Absorber"] },
  { id: "8", jobCard: "JC-2025-008", customerName: "Lakshmi Narayana", phone: "9876543217", vehicle: "VW Polo", vehicleNumber: "TS 07 OP 0123", status: "completed", amount: 2800, date: "2025-05-08", services: ["Oil Change"] },
];

const ORDERS_KEY = "garrage_orders";

function loadOrders(): Order[] {
  if (typeof window === "undefined") return DEFAULT_ORDERS;
  const stored = localStorage.getItem(ORDERS_KEY);
  if (!stored) { localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_ORDERS)); return DEFAULT_ORDERS; }
  try { return JSON.parse(stored); } catch { return DEFAULT_ORDERS; }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getOrders(): Order[] {
  return loadOrders();
}

export function addOrder(order: Omit<Order, "id" | "jobCard">): Order {
  const orders = loadOrders();
  const nextNum = orders.length + 1;
  const newOrder: Order = {
    ...order,
    id: `ord_${Date.now()}`,
    jobCard: `JC-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`,
  };
  orders.unshift(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrder(id: string, updates: Partial<Order>): void {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx >= 0) { orders[idx] = { ...orders[idx], ...updates }; saveOrders(orders); }
}

export type TabKey = "open" | "wip" | "ready" | "payment_due" | "completed";

export const tabs: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "wip", label: "WIP" },
  { key: "ready", label: "Ready" },
  { key: "payment_due", label: "Payment Due" },
  { key: "completed", label: "Completed" },
];

export function getOrdersByStatus(status: TabKey): Order[] {
  return loadOrders().filter((o) => o.status === status);
}

export function getOrderCountByStatus(status: TabKey): number {
  return loadOrders().filter((o) => o.status === status).length;
}
