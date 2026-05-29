import { api, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

// ── Types ──

export interface OrderLineItem {
  id: string;
  itemType: "service" | "part";
  serviceId?: string;
  partId?: string;
  packageId?: string;
  description: string;
  hsnSac?: string;
  qty: number;
  rate: number;
  discountPercent: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

export interface ServiceAssignment {
  lineItemId: string;
  assignedUserId: string;
  assignedUserName: string;
  status: "pending" | "in_progress" | "completed";
  assignedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface Order {
  id: string;
  garageId?: string;
  jobCard: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  phone?: string;
  vehicleId?: string;
  vehicle: string;
  vehicleNumber: string;
  status: OrderStatus;
  amount: number;
  date: string;
  services?: string[];

  // Inspection
  odometerReading?: number;
  fuelLevel?: string;
  inspectionNotes?: string;
  customerRemarks?: string[];
  imageIds?: string[];
  inspectionCompletedAt?: string;

  // Estimate
  lineItems?: OrderLineItem[];
  estimateType?: "gst" | "proforma";
  placeOfSupply?: string;
  subtotal?: number;
  discountAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalGst?: number;
  grandTotal?: number;
  estimatedDeliveryDate?: string;
  estimateToken?: string;
  estimateSentAt?: string;

  // Customer response
  customerApproved?: boolean;
  customerRejectionNote?: string;
  customerRespondedAt?: string;

  // Assignments
  serviceAssignments?: ServiceAssignment[];

  // Payment
  paymentToken?: string;
  paymentSentAt?: string;

  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus = "open" | "wip" | "payment_due" | "completed" | "cancelled";

export type TabKey = OrderStatus;

export const tabs: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "wip", label: "WIP" },
  { key: "payment_due", label: "Payment Due" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export interface VehicleAnalytics {
  id: string;
  garageId: string;
  brandId: string;
  brandName: string;
  count: number;
}

// ── Helpers ──

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    phone: order.customerPhone ?? order.phone,
  };
}

// ── API Functions ──

export async function getOrders(): Promise<Order[]> {
  const orders = await api.get<Order[]>("/api/orders");
  return orders.map(normalizeOrder);
}

export async function getOrdersByStatus(status: TabKey): Promise<Order[]> {
  const orders = await api.get<Order[]>(`/api/orders?status=${status}`);
  return orders.map(normalizeOrder);
}

export async function getOrderCountByStatus(status: TabKey): Promise<number> {
  const counts = await getOrderCounts();
  return counts[status] ?? 0;
}

export async function getOrderCounts(): Promise<Record<string, number>> {
  return api.get<Record<string, number>>("/api/orders/counts");
}

export async function addOrder(
  order: Omit<Order, "id" | "jobCard">
): Promise<Order> {
  const created = await api.post<Order>("/api/orders", order);
  return normalizeOrder(created);
}

export async function updateOrder(
  id: string,
  updates: Partial<Order>
): Promise<Order> {
  const updated = await api.put<Order>(`/api/orders/${id}`, updates);
  return normalizeOrder(updated);
}

export async function getOrderById(id: string): Promise<Order> {
  const order = await api.get<Order>(`/api/orders/${id}`);
  return normalizeOrder(order);
}

// ── Inspection ──

export async function completeInspection(
  orderId: string,
  data: { customerRemarks?: string[]; inspectionNotes?: string }
): Promise<Order> {
  const order = await api.put<Order>(`/api/orders/${orderId}/inspection`, data);
  return normalizeOrder(order);
}

// ── Image upload ──

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function uploadOrderImages(
  orderId: string,
  files: File[]
): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const token = getAccessToken();
  const response = await fetch(
    `${API_BASE_URL}/api/orders/${orderId}/images`,
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload images");
  }

  const json = await response.json();
  return json.data;
}

export function getImageUrl(fileId: string): string {
  return `${API_BASE_URL}/api/images/${fileId}`;
}

export function getPublicImageUrl(token: string, fileId: string): string {
  return `${API_BASE_URL}/api/public/estimate/${token}/images/${fileId}`;
}

export async function deleteOrderImage(
  orderId: string,
  fileId: string
): Promise<void> {
  await api.delete(`/api/orders/${orderId}/images/${fileId}`);
}

// ── Estimate ──

export async function saveEstimate(
  orderId: string,
  estimate: {
    lineItems: OrderLineItem[];
    estimateType: string;
    placeOfSupply?: string;
    estimatedDeliveryDate?: string;
    subtotal: number;
    discountAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalGst: number;
    grandTotal: number;
  }
): Promise<Order> {
  const order = await api.put<Order>(`/api/orders/${orderId}/estimate`, estimate);
  return normalizeOrder(order);
}

export async function sendEstimate(orderId: string): Promise<Order> {
  const order = await apiFetch<Order>(`/api/orders/${orderId}/send-estimate`, {
    method: "POST",
  });
  return normalizeOrder(order);
}

export async function resendEstimate(orderId: string): Promise<Order> {
  const order = await apiFetch<Order>(`/api/orders/${orderId}/resend-estimate`, {
    method: "POST",
  });
  return normalizeOrder(order);
}

export async function getEstimateLink(orderId: string): Promise<string> {
  return api.get<string>(`/api/orders/${orderId}/estimate-link`);
}

// ── Public estimate (no auth) ──

export async function getPublicEstimate(token: string): Promise<Order> {
  const url = `${API_BASE_URL}/api/public/estimate/${token}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Estimate not found");
  const json = await response.json();
  return json.data;
}

export async function respondToEstimate(
  token: string,
  approved: boolean,
  rejectionNote?: string
): Promise<Order> {
  const url = `${API_BASE_URL}/api/public/estimate/${token}/respond`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved, rejectionNote }),
  });
  if (!response.ok) throw new Error("Failed to submit response");
  const json = await response.json();
  return json.data;
}

// ── Service Assignment ──

export async function assignService(
  orderId: string,
  lineItemId: string,
  staffUserId: string,
  staffUserName: string
): Promise<Order> {
  const order = await api.put<Order>(`/api/orders/${orderId}/assign`, {
    lineItemId,
    staffUserId,
    staffUserName,
  });
  return normalizeOrder(order);
}

export async function updateAssignmentStatus(
  orderId: string,
  lineItemId: string,
  status: string,
  notes?: string
): Promise<Order> {
  const order = await api.put<Order>(`/api/orders/${orderId}/assignment-status`, {
    lineItemId,
    status,
    notes,
  });
  return normalizeOrder(order);
}

// ── Payment ──

export async function markPaymentDue(orderId: string): Promise<Order> {
  const order = await apiFetch<Order>(`/api/orders/${orderId}/mark-payment-due`, {
    method: "POST",
  });
  return normalizeOrder(order);
}

export async function getPublicPayment(token: string): Promise<Order> {
  const url = `${API_BASE_URL}/api/public/payment/${token}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Payment link not found");
  const json = await response.json();
  return json.data;
}

export async function confirmPayment(token: string): Promise<Order> {
  const url = `${API_BASE_URL}/api/public/payment/${token}/confirm`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Failed to confirm payment");
  const json = await response.json();
  return json.data;
}

// ── Delivery alerts ──

export async function getDeliveryAlerts(): Promise<Order[]> {
  const orders = await api.get<Order[]>("/api/orders/delivery-alerts");
  return orders.map(normalizeOrder);
}

// ── Vehicle Analytics ──

export async function getVehicleAnalytics(): Promise<VehicleAnalytics[]> {
  return api.get<VehicleAnalytics[]>("/api/orders/vehicle-analytics");
}

// ── GST States ──

export async function getIndianStates(): Promise<string[]> {
  return api.get<string[]>("/api/gst/states");
}
