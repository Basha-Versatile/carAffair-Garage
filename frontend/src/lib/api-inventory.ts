import { api } from "@/lib/api";

// ── Types ──

export interface PartApplicableBrand {
  brandId: string;
  brandName: string;
  modelIds: string[];
  modelNames: string[];
}

export interface Part {
  id: string;
  name: string;
  partNumber: string;
  brand: string;
  category: PartCategory | string;
  categoryId?: string;
  manufacturerId?: string;
  manufacturerName?: string;
  taxProfileId?: string;
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  stockQty: number;
  minStockQty: number;
  maxStockQty?: number;
  preferredVendorId?: string;
  preferredVendorName?: string;
  rackNumber: string;
  hsnCode: string;
  gstRate: number;
  unit: string;
  comment?: string;
  isGeneric?: boolean;
  applicableBrands?: PartApplicableBrand[];
}

export interface StockHistory {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  date: string;
  type: "stockin" | "stockout";
  qty: number;
  refNumber?: string;
  changedBy?: string;
  mode: string;
  comment?: string;
  createdAt?: string;
}

export type PartCategory =
  | "Engine Parts"
  | "Brake System"
  | "Electrical"
  | "Filters"
  | "Body Parts"
  | "Lubricants"
  | "Suspension"
  | "Tires"
  | "AC Parts"
  | "Clutch";

export const PART_CATEGORIES: PartCategory[] = [
  "Engine Parts",
  "Brake System",
  "Electrical",
  "Filters",
  "Body Parts",
  "Lubricants",
  "Suspension",
  "Tires",
  "AC Parts",
  "Clutch",
];

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  status: "draft" | "ordered" | "received" | "cancelled";
  items: POItem[];
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  repairOrderId?: string;
}

export interface POItem {
  partId: string;
  partName: string;
  partNumber: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

export interface CounterSale {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  placeOfSupply: string;
  items: CSItem[];
  services: CSService[];
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
  discount: number;
  paymentStatus: "paid" | "pending" | "partial";
  tags: string[];
}

export interface CSItem {
  partId: string;
  name: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

export interface CSService {
  name: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

export interface StockInRecord {
  id: string;
  date: string;
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  isGstBill: boolean;
  paymentChannel: "cash" | "bank" | "upi" | "credit";
  placeOfSupply: string;
  items: StockInItem[];
  totalAmount: number;
  gstAmount: number;
  grandTotal: number;
}

export interface StockInItem {
  partId: string;
  partName: string;
  partNumber: string;
  qty: number;
  rate: number;
  amount: number;
  gstRate: number;
  gstAmount: number;
}

export interface ServiceReminder {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber: string;
  vehicleName: string;
  serviceType: string;
  dueDate: string;
  status: "due" | "overdue" | "done";
  lastServiceDate: string;
  kmsDue?: number;
  notes?: string;
}

export interface ServiceFeedback {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleNumber: string;
  vehicleName: string;
  rating: number;
  comment: string;
  date: string;
  jobCard: string;
  status: "reviewed" | "scheduled" | "pending";
  services: string[];
}

// ── Parts ──

/** Fetch all parts for the current garage. */
export async function getParts(): Promise<Part[]> {
  return api.get<Part[]>("/api/parts");
}

/** Fetch a single part by id. */
export async function getPartById(id: string): Promise<Part> {
  return api.get<Part>(`/api/parts/${id}`);
}

/** Create a new part. */
export async function addPart(part: Omit<Part, "id">): Promise<Part> {
  return api.post<Part>("/api/parts", part);
}

/** Partially update an existing part by id. */
export async function updatePart(
  id: string,
  updates: Partial<Part>
): Promise<void> {
  await api.put<Part>(`/api/parts/${id}`, updates);
}

// ── Stock History ──

/** Fetch stock history for a specific part. */
export async function getStockHistory(partId: string): Promise<StockHistory[]> {
  return api.get<StockHistory[]>(`/api/stock-history/part/${partId}`);
}

/** Fetch all stock history. */
export async function getAllStockHistory(): Promise<StockHistory[]> {
  return api.get<StockHistory[]>("/api/stock-history");
}

// ── Purchase Orders ──

/** Fetch all purchase orders. */
export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  return api.get<PurchaseOrder[]>("/api/purchase-orders");
}

/** Create a new purchase order. */
export async function addPurchaseOrder(
  po: Omit<PurchaseOrder, "id">
): Promise<PurchaseOrder> {
  return api.post<PurchaseOrder>("/api/purchase-orders", po);
}

// ── Counter Sales ──

/** Fetch all counter sales. */
export async function getCounterSales(): Promise<CounterSale[]> {
  return api.get<CounterSale[]>("/api/counter-sales");
}

/** Create a new counter sale. */
export async function addCounterSale(
  cs: Omit<CounterSale, "id">
): Promise<CounterSale> {
  return api.post<CounterSale>("/api/counter-sales", cs);
}

// ── Stock In ──

/** Fetch all stock-in records. */
export async function getStockInRecords(): Promise<StockInRecord[]> {
  return api.get<StockInRecord[]>("/api/stock-in");
}

/** Create a new stock-in record. */
export async function addStockInRecord(
  si: Omit<StockInRecord, "id">
): Promise<StockInRecord> {
  return api.post<StockInRecord>("/api/stock-in", si);
}

// ── Service Reminders ──

/** Fetch all service reminders. */
export async function getServiceReminders(): Promise<ServiceReminder[]> {
  return api.get<ServiceReminder[]>("/api/service-reminders");
}

/** Create a new service reminder. */
export async function addServiceReminder(
  r: Omit<ServiceReminder, "id">
): Promise<ServiceReminder> {
  return api.post<ServiceReminder>("/api/service-reminders", r);
}

/** Partially update an existing service reminder by id. */
export async function updateReminder(
  id: string,
  updates: Partial<ServiceReminder>
): Promise<void> {
  await api.put<ServiceReminder>(`/api/service-reminders/${id}`, updates);
}

// ── Service Feedbacks ──

/** Fetch all service feedbacks. */
export async function getServiceFeedbacks(): Promise<ServiceFeedback[]> {
  return api.get<ServiceFeedback[]>("/api/service-feedbacks");
}

/** Create a new service feedback. */
export async function addServiceFeedback(
  fb: Omit<ServiceFeedback, "id">
): Promise<ServiceFeedback> {
  return api.post<ServiceFeedback>("/api/service-feedbacks", fb);
}
