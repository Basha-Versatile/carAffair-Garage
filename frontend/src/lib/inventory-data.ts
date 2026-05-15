// ── Types ──

export interface Part {
  id: string;
  name: string;
  partNumber: string;
  brand: string;
  category: PartCategory;
  mrp: number;
  sellingPrice: number;
  purchasePrice: number;
  stockQty: number;
  minStockQty: number;
  rackNumber: string;
  hsnCode: string;
  gstRate: number;
  unit: string;
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
  "Engine Parts", "Brake System", "Electrical", "Filters",
  "Body Parts", "Lubricants", "Suspension", "Tires", "AC Parts", "Clutch",
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

// ── Dummy Data ──

const DEFAULT_PARTS: Part[] = [
  { id: "p1", name: "Engine Oil 5W-30", partNumber: "EO-5W30-1L", brand: "Castrol", category: "Lubricants", mrp: 650, sellingPrice: 600, purchasePrice: 480, stockQty: 45, minStockQty: 10, rackNumber: "A1-01", hsnCode: "27101990", gstRate: 18, unit: "Ltr" },
  { id: "p2", name: "Oil Filter", partNumber: "OF-HY-001", brand: "Bosch", category: "Filters", mrp: 350, sellingPrice: 320, purchasePrice: 220, stockQty: 30, minStockQty: 5, rackNumber: "A1-02", hsnCode: "84212300", gstRate: 18, unit: "Pcs" },
  { id: "p3", name: "Air Filter", partNumber: "AF-MR-001", brand: "Mann", category: "Filters", mrp: 450, sellingPrice: 400, purchasePrice: 280, stockQty: 20, minStockQty: 5, rackNumber: "A1-03", hsnCode: "84212300", gstRate: 18, unit: "Pcs" },
  { id: "p4", name: "Brake Pad Set (Front)", partNumber: "BP-FR-001", brand: "Brembo", category: "Brake System", mrp: 2800, sellingPrice: 2500, purchasePrice: 1800, stockQty: 12, minStockQty: 3, rackNumber: "B1-01", hsnCode: "68132090", gstRate: 18, unit: "Set" },
  { id: "p5", name: "Brake Pad Set (Rear)", partNumber: "BP-RR-001", brand: "Brembo", category: "Brake System", mrp: 2200, sellingPrice: 2000, purchasePrice: 1500, stockQty: 8, minStockQty: 3, rackNumber: "B1-02", hsnCode: "68132090", gstRate: 18, unit: "Set" },
  { id: "p6", name: "Spark Plug Iridium", partNumber: "SP-IR-001", brand: "NGK", category: "Engine Parts", mrp: 550, sellingPrice: 500, purchasePrice: 350, stockQty: 40, minStockQty: 10, rackNumber: "C1-01", hsnCode: "85111000", gstRate: 18, unit: "Pcs" },
  { id: "p7", name: "AC Compressor", partNumber: "AC-CP-001", brand: "Denso", category: "AC Parts", mrp: 12000, sellingPrice: 11000, purchasePrice: 8500, stockQty: 3, minStockQty: 1, rackNumber: "D1-01", hsnCode: "84159010", gstRate: 28, unit: "Pcs" },
  { id: "p8", name: "Coolant 1L", partNumber: "CL-1L-001", brand: "Motul", category: "Lubricants", mrp: 380, sellingPrice: 350, purchasePrice: 250, stockQty: 25, minStockQty: 5, rackNumber: "A2-01", hsnCode: "38200000", gstRate: 18, unit: "Ltr" },
  { id: "p9", name: "Clutch Plate", partNumber: "CL-PL-001", brand: "Valeo", category: "Clutch", mrp: 4500, sellingPrice: 4000, purchasePrice: 3000, stockQty: 5, minStockQty: 2, rackNumber: "E1-01", hsnCode: "87089900", gstRate: 28, unit: "Pcs" },
  { id: "p10", name: "Headlight Bulb H4", partNumber: "HL-H4-001", brand: "Osram", category: "Electrical", mrp: 450, sellingPrice: 400, purchasePrice: 280, stockQty: 35, minStockQty: 8, rackNumber: "C2-01", hsnCode: "85392990", gstRate: 18, unit: "Pcs" },
  { id: "p11", name: "Battery 65Ah", partNumber: "BT-65-001", brand: "Amaron", category: "Electrical", mrp: 5500, sellingPrice: 5000, purchasePrice: 4000, stockQty: 6, minStockQty: 2, rackNumber: "F1-01", hsnCode: "85071000", gstRate: 28, unit: "Pcs" },
  { id: "p12", name: "Wiper Blade 22\"", partNumber: "WB-22-001", brand: "Bosch", category: "Body Parts", mrp: 650, sellingPrice: 580, purchasePrice: 400, stockQty: 18, minStockQty: 4, rackNumber: "G1-01", hsnCode: "85124000", gstRate: 18, unit: "Pcs" },
  { id: "p13", name: "Shock Absorber (Front)", partNumber: "SA-FR-001", brand: "Monroe", category: "Suspension", mrp: 3200, sellingPrice: 2900, purchasePrice: 2200, stockQty: 7, minStockQty: 2, rackNumber: "H1-01", hsnCode: "87088000", gstRate: 28, unit: "Pcs" },
  { id: "p14", name: "Tyre 185/65R15", partNumber: "TR-185-001", brand: "MRF", category: "Tires", mrp: 4800, sellingPrice: 4500, purchasePrice: 3600, stockQty: 10, minStockQty: 4, rackNumber: "I1-01", hsnCode: "40111000", gstRate: 28, unit: "Pcs" },
  { id: "p15", name: "Cabin Filter", partNumber: "CF-UN-001", brand: "Mann", category: "Filters", mrp: 500, sellingPrice: 450, purchasePrice: 300, stockQty: 15, minStockQty: 5, rackNumber: "A1-04", hsnCode: "84212300", gstRate: 18, unit: "Pcs" },
];

const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po1", poNumber: "PO-2025-001", vendorId: "vn_1", vendorName: "AutoParts India", date: "2025-05-12", status: "ordered",
    items: [
      { partId: "p1", partName: "Engine Oil 5W-30", partNumber: "EO-5W30-1L", qty: 20, rate: 480, amount: 9600, gstRate: 18, gstAmount: 1728 },
      { partId: "p2", partName: "Oil Filter", partNumber: "OF-HY-001", qty: 15, rate: 220, amount: 3300, gstRate: 18, gstAmount: 594 },
    ],
    totalAmount: 12900, gstAmount: 2322, grandTotal: 15222,
  },
  {
    id: "po2", poNumber: "PO-2025-002", vendorId: "vn_2", vendorName: "BrakeMasters", date: "2025-05-10", status: "received",
    items: [
      { partId: "p4", partName: "Brake Pad Set (Front)", partNumber: "BP-FR-001", qty: 5, rate: 1800, amount: 9000, gstRate: 18, gstAmount: 1620 },
      { partId: "p5", partName: "Brake Pad Set (Rear)", partNumber: "BP-RR-001", qty: 5, rate: 1500, amount: 7500, gstRate: 18, gstAmount: 1350 },
    ],
    totalAmount: 16500, gstAmount: 2970, grandTotal: 19470,
  },
  {
    id: "po3", poNumber: "PO-2025-003", vendorId: "vn_3", vendorName: "SparkZone Electricals", date: "2025-05-14", status: "draft",
    items: [
      { partId: "p10", partName: "Headlight Bulb H4", partNumber: "HL-H4-001", qty: 20, rate: 280, amount: 5600, gstRate: 18, gstAmount: 1008 },
      { partId: "p11", partName: "Battery 65Ah", partNumber: "BT-65-001", qty: 3, rate: 4000, amount: 12000, gstRate: 28, gstAmount: 3360 },
    ],
    totalAmount: 17600, gstAmount: 4368, grandTotal: 21968,
  },
];

const DEFAULT_COUNTER_SALES: CounterSale[] = [
  {
    id: "cs1", invoiceNumber: "CS-2025-001", customerName: "Rajesh Kumar", customerPhone: "9876543210", date: "2025-05-14",
    placeOfSupply: "Telangana", items: [
      { partId: "p1", name: "Engine Oil 5W-30", qty: 4, rate: 600, amount: 2400, gstRate: 18, gstAmount: 432 },
      { partId: "p2", name: "Oil Filter", qty: 1, rate: 320, amount: 320, gstRate: 18, gstAmount: 57.6 },
    ], services: [
      { name: "Oil Change Service", qty: 1, rate: 500, amount: 500, gstRate: 18, gstAmount: 90 },
    ],
    totalAmount: 3220, gstAmount: 579.6, grandTotal: 3799.6, discount: 0, paymentStatus: "paid", tags: ["Walk-in"],
  },
  {
    id: "cs2", invoiceNumber: "CS-2025-002", customerName: "Priya Sharma", customerPhone: "9876543212", date: "2025-05-13",
    placeOfSupply: "Telangana", items: [
      { partId: "p10", name: "Headlight Bulb H4", qty: 2, rate: 400, amount: 800, gstRate: 18, gstAmount: 144 },
    ], services: [],
    totalAmount: 800, gstAmount: 144, grandTotal: 944, discount: 0, paymentStatus: "paid", tags: ["Regular"],
  },
];

const DEFAULT_STOCK_IN: StockInRecord[] = [
  {
    id: "si1", date: "2025-05-10", invoiceNumber: "INV-AP-2025-045", vendorId: "vn_1", vendorName: "AutoParts India",
    isGstBill: true, paymentChannel: "bank", placeOfSupply: "Telangana",
    items: [
      { partId: "p1", partName: "Engine Oil 5W-30", partNumber: "EO-5W30-1L", qty: 20, rate: 480, amount: 9600, gstRate: 18, gstAmount: 1728 },
      { partId: "p3", partName: "Air Filter", partNumber: "AF-MR-001", qty: 10, rate: 280, amount: 2800, gstRate: 18, gstAmount: 504 },
    ],
    totalAmount: 12400, gstAmount: 2232, grandTotal: 14632,
  },
  {
    id: "si2", date: "2025-05-08", invoiceNumber: "INV-BM-2025-012", vendorId: "vn_2", vendorName: "BrakeMasters",
    isGstBill: true, paymentChannel: "credit", placeOfSupply: "Telangana",
    items: [
      { partId: "p4", partName: "Brake Pad Set (Front)", partNumber: "BP-FR-001", qty: 5, rate: 1800, amount: 9000, gstRate: 18, gstAmount: 1620 },
    ],
    totalAmount: 9000, gstAmount: 1620, grandTotal: 10620,
  },
];

const DEFAULT_REMINDERS: ServiceReminder[] = [
  { id: "sr1", customerName: "Rajesh Kumar", customerPhone: "9876543210", vehicleNumber: "TS 09 AB 1234", vehicleName: "Hyundai i20", serviceType: "General Service", dueDate: "2025-05-15", status: "due", lastServiceDate: "2025-02-15", kmsDue: 10000 },
  { id: "sr2", customerName: "Srinivas Rao", customerPhone: "9876543211", vehicleNumber: "TS 07 CD 5678", vehicleName: "Maruti Swift", serviceType: "Oil Change", dueDate: "2025-05-10", status: "overdue", lastServiceDate: "2025-01-10", kmsDue: 5000 },
  { id: "sr3", customerName: "Priya Sharma", customerPhone: "9876543212", vehicleNumber: "AP 28 EF 9012", vehicleName: "Honda City", serviceType: "AC Service", dueDate: "2025-05-20", status: "due", lastServiceDate: "2024-11-20" },
  { id: "sr4", customerName: "Venkat Reddy", customerPhone: "9876543213", vehicleNumber: "TS 08 GH 3456", vehicleName: "Toyota Innova", serviceType: "Brake Inspection", dueDate: "2025-04-25", status: "overdue", lastServiceDate: "2024-10-25", notes: "Customer reported squeaking noise" },
  { id: "sr5", customerName: "Anil Prakash", customerPhone: "9876543214", vehicleNumber: "TS 10 IJ 7890", vehicleName: "Kia Seltos", serviceType: "Periodic Maintenance", dueDate: "2025-04-01", status: "done", lastServiceDate: "2025-04-01", kmsDue: 15000 },
  { id: "sr6", customerName: "Meena Devi", customerPhone: "9876543215", vehicleNumber: "TS 09 KL 2345", vehicleName: "Tata Nexon", serviceType: "Tyre Rotation", dueDate: "2025-05-18", status: "due", lastServiceDate: "2024-11-18" },
  { id: "sr7", customerName: "Suresh Babu", customerPhone: "9876543216", vehicleNumber: "AP 31 MN 6789", vehicleName: "Mahindra XUV700", serviceType: "General Service", dueDate: "2025-03-15", status: "done", lastServiceDate: "2025-03-15", kmsDue: 10000 },
  { id: "sr8", customerName: "Lakshmi Narayana", customerPhone: "9876543217", vehicleNumber: "TS 07 OP 0123", vehicleName: "VW Polo", serviceType: "Oil Change", dueDate: "2025-05-05", status: "overdue", lastServiceDate: "2025-01-05" },
];

const DEFAULT_FEEDBACKS: ServiceFeedback[] = [
  { id: "fb1", customerName: "Rajesh Kumar", customerPhone: "9876543210", vehicleNumber: "TS 09 AB 1234", vehicleName: "Hyundai i20", rating: 5, comment: "Excellent service! My car runs like new after the general service. Very professional team.", date: "2025-05-12", jobCard: "JC-2025-001", status: "reviewed", services: ["General Service"] },
  { id: "fb2", customerName: "Srinivas Rao", customerPhone: "9876543211", vehicleNumber: "TS 07 CD 5678", vehicleName: "Maruti Swift", rating: 4, comment: "Good work on the engine oil change and brake pads. Slightly delayed but quality was great.", date: "2025-05-11", jobCard: "JC-2025-002", status: "reviewed", services: ["Engine Oil Change", "Brake Pad Replacement"] },
  { id: "fb3", customerName: "Priya Sharma", customerPhone: "9876543212", vehicleNumber: "AP 28 EF 9012", vehicleName: "Honda City", rating: 3, comment: "AC repair was okay, but the coolant flush could have been done better. Will visit again.", date: "2025-05-10", jobCard: "JC-2025-003", status: "pending", services: ["AC Repair", "Coolant Flush"] },
  { id: "fb4", customerName: "Anil Prakash", customerPhone: "9876543214", vehicleNumber: "TS 10 IJ 7890", vehicleName: "Kia Seltos", rating: 5, comment: "Top-notch maintenance work. They found and fixed issues I didn't even know about.", date: "2025-05-09", jobCard: "JC-2025-005", status: "reviewed", services: ["Periodic Maintenance"] },
  { id: "fb5", customerName: "Venkat Reddy", customerPhone: "9876543213", vehicleNumber: "TS 08 GH 3456", vehicleName: "Toyota Innova", rating: 4, comment: "Wheel alignment done perfectly. Car drives smooth now.", date: "2025-05-08", jobCard: "JC-2025-004", status: "scheduled", services: ["Wheel Alignment", "Tyre Rotation"] },
  { id: "fb6", customerName: "Lakshmi Narayana", customerPhone: "9876543217", vehicleNumber: "TS 07 OP 0123", vehicleName: "VW Polo", rating: 2, comment: "Oil change was fine but the waiting time was too long. Need to improve turnaround.", date: "2025-05-07", jobCard: "JC-2025-008", status: "pending", services: ["Oil Change"] },
];

// ── Storage Helpers ──

const PARTS_KEY = "garrage_parts";
const PO_KEY = "garrage_purchase_orders";
const CS_KEY = "garrage_counter_sales";
const SI_KEY = "garrage_stock_in";
const REMINDERS_KEY = "garrage_reminders";
const FEEDBACKS_KEY = "garrage_feedbacks";

function loadFromStorage<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  const stored = localStorage.getItem(key);
  if (!stored) { localStorage.setItem(key, JSON.stringify(defaults)); return defaults; }
  try { return JSON.parse(stored); } catch { return defaults; }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Parts ──

export function getParts(): Part[] { return loadFromStorage(PARTS_KEY, DEFAULT_PARTS); }

export function getPartById(id: string): Part | undefined { return getParts().find((p) => p.id === id); }

export function addPart(part: Omit<Part, "id">): Part {
  const parts = getParts();
  const np: Part = { ...part, id: `p_${Date.now()}` };
  parts.push(np); saveToStorage(PARTS_KEY, parts); return np;
}

export function updatePart(id: string, updates: Partial<Part>): void {
  const parts = getParts();
  const idx = parts.findIndex((p) => p.id === id);
  if (idx >= 0) { parts[idx] = { ...parts[idx], ...updates }; saveToStorage(PARTS_KEY, parts); }
}

// ── Purchase Orders ──

export function getPurchaseOrders(): PurchaseOrder[] { return loadFromStorage(PO_KEY, DEFAULT_PURCHASE_ORDERS); }

export function addPurchaseOrder(po: Omit<PurchaseOrder, "id">): PurchaseOrder {
  const pos = getPurchaseOrders();
  const np: PurchaseOrder = { ...po, id: `po_${Date.now()}` };
  pos.push(np); saveToStorage(PO_KEY, pos); return np;
}

// ── Counter Sales ──

export function getCounterSales(): CounterSale[] { return loadFromStorage(CS_KEY, DEFAULT_COUNTER_SALES); }

export function addCounterSale(cs: Omit<CounterSale, "id">): CounterSale {
  const sales = getCounterSales();
  const ns: CounterSale = { ...cs, id: `cs_${Date.now()}` };
  sales.push(ns); saveToStorage(CS_KEY, sales); return ns;
}

// ── Stock In ──

export function getStockInRecords(): StockInRecord[] { return loadFromStorage(SI_KEY, DEFAULT_STOCK_IN); }

export function addStockInRecord(si: Omit<StockInRecord, "id">): StockInRecord {
  const records = getStockInRecords();
  const nr: StockInRecord = { ...si, id: `si_${Date.now()}` };
  records.push(nr); saveToStorage(SI_KEY, records); return nr;
}

// ── Service Reminders ──

export function getServiceReminders(): ServiceReminder[] { return loadFromStorage(REMINDERS_KEY, DEFAULT_REMINDERS); }

export function addServiceReminder(r: Omit<ServiceReminder, "id">): ServiceReminder {
  const reminders = getServiceReminders();
  const nr: ServiceReminder = { ...r, id: `sr_${Date.now()}` };
  reminders.push(nr); saveToStorage(REMINDERS_KEY, reminders); return nr;
}

export function updateReminder(id: string, updates: Partial<ServiceReminder>): void {
  const reminders = getServiceReminders();
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx >= 0) { reminders[idx] = { ...reminders[idx], ...updates }; saveToStorage(REMINDERS_KEY, reminders); }
}

// ── Service Feedbacks ──

export function getServiceFeedbacks(): ServiceFeedback[] { return loadFromStorage(FEEDBACKS_KEY, DEFAULT_FEEDBACKS); }

export function addServiceFeedback(fb: Omit<ServiceFeedback, "id">): ServiceFeedback {
  const feedbacks = getServiceFeedbacks();
  const nf: ServiceFeedback = { ...fb, id: `fb_${Date.now()}` };
  feedbacks.push(nf); saveToStorage(FEEDBACKS_KEY, feedbacks); return nf;
}
