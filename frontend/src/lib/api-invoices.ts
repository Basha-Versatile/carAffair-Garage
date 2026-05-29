import { api } from "@/lib/api";

// ── Types ──

export interface InvoiceItem {
  itemType: "service" | "part";
  serviceId?: string;
  partId?: string;
  description: string;
  hsnSac?: string;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
  gstInclusive: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "proforma" | "tax";
  repairOrderId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  tags?: string[];
  discount?: number;
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  status: "draft" | "sent" | "paid";
  date?: string;
  placeOfSupply?: string;
  createdAt?: string;
}

// ── API Functions ──

export async function getInvoices(): Promise<Invoice[]> {
  return api.get<Invoice[]>("/api/invoices");
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  return api.get<Invoice>(`/api/invoices/${id}`);
}

export async function createInvoice(
  invoice: Omit<Invoice, "id" | "invoiceNumber" | "status" | "createdAt">
): Promise<Invoice> {
  return api.post<Invoice>("/api/invoices", invoice);
}

export async function updateInvoiceStatus(
  id: string,
  status: string
): Promise<Invoice> {
  return api.put<Invoice>(`/api/invoices/${id}/status`, { status });
}

export async function notifyCustomer(id: string): Promise<string> {
  return api.post<string>(`/api/invoices/${id}/notify`, {});
}

export async function getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
  try {
    return await api.get<Invoice>(`/api/invoices/by-order/${orderId}`);
  } catch {
    return null;
  }
}
