import { api } from "@/lib/api";

// ── Account Summary & Daybook Types ──

export interface AccountSummary {
  cashInHand: number;
  totalReceivable: number;
  totalPayable: number;
  expenses: number;
}

export type VoucherType = "Payment" | "Receipt" | "Journal" | "Contra";

export interface DaybookEntry {
  id: string;
  date: string;
  details: string;
  voucherNo: string;
  voucherType: VoucherType;
  debit: number;
  credit: number;
}

// ── Expense Types ──

export interface ExpenseLabel {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  voucherNo: string;
  date: string;
  amount: number;
  labelId: string;
  labelName: string;
  vendorId?: string;
  vendorName?: string;
  repairOrderId?: string;
  repairOrderJobCard?: string;
  paymentChannel: string;
  /** "PAID" or "CREDIT" */
  paidStatus?: string;
  /** Only when paidStatus = "CREDIT" */
  advancePaidAmount?: number;
  paymentDate?: string;
  referenceNumber?: string;
  comment?: string;
  gstApplicable: boolean;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  hsnSac?: string;
  placeOfSupply?: string;
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
}

// ── Account Transaction Types ──

export type TransactionChannel = "Cash" | "Bank";
export type TransactionType = "Payment" | "Receipt" | "Expense" | "Transfer" | "Refund";

export interface AccountTransaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  channel: TransactionChannel;
  comment: string;
  user: string;
}

// ── Dummy data for Account Book ──

const DUMMY_CASH_TRANSACTIONS: AccountTransaction[] = [
  { id: "c1", date: "2026-05-19", amount: 2500, type: "Payment", channel: "Cash", comment: "Paid electrician for wiring repair", user: "Admin" },
  { id: "c2", date: "2026-05-18", amount: 8200, type: "Receipt", channel: "Cash", comment: "Service charge - Ravi Kumar (Swift)", user: "Admin" },
  { id: "c3", date: "2026-05-17", amount: 1500, type: "Expense", channel: "Cash", comment: "Office supplies purchased", user: "Kiran" },
  { id: "c4", date: "2026-05-16", amount: 15000, type: "Receipt", channel: "Cash", comment: "Full service - Suresh (Innova)", user: "Admin" },
  { id: "c5", date: "2026-05-15", amount: 3200, type: "Payment", channel: "Cash", comment: "Paid vendor - spare brake pads", user: "Admin" },
  { id: "c6", date: "2026-05-14", amount: 6800, type: "Receipt", channel: "Cash", comment: "AC repair charge - Mahesh", user: "Kiran" },
  { id: "c7", date: "2026-05-12", amount: 12500, type: "Payment", channel: "Cash", comment: "Monthly rent payment", user: "Admin" },
  { id: "c8", date: "2026-05-10", amount: 4500, type: "Receipt", channel: "Cash", comment: "Oil change + filter - Ramesh", user: "Admin" },
  { id: "c9", date: "2026-05-08", amount: 950, type: "Expense", channel: "Cash", comment: "Tea & snacks for staff", user: "Kiran" },
  { id: "c10", date: "2026-05-05", amount: 22000, type: "Receipt", channel: "Cash", comment: "Engine overhaul partial - Ajay", user: "Admin" },
  { id: "c11", date: "2026-05-03", amount: 7500, type: "Payment", channel: "Cash", comment: "Tyre purchase from vendor", user: "Admin" },
  { id: "c12", date: "2026-05-01", amount: 3000, type: "Expense", channel: "Cash", comment: "Workshop cleaning service", user: "Kiran" },
];

const DUMMY_BANK_TRANSACTIONS: AccountTransaction[] = [
  { id: "b1", date: "2026-05-19", amount: 45000, type: "Receipt", channel: "Bank", comment: "NEFT - Honda full service payment", user: "Admin" },
  { id: "b2", date: "2026-05-18", amount: 18000, type: "Payment", channel: "Bank", comment: "IMPS to vendor - Auto Parts Co.", user: "Admin" },
  { id: "b3", date: "2026-05-17", amount: 12000, type: "Receipt", channel: "Bank", comment: "GPAY - Clutch replacement charge", user: "Kiran" },
  { id: "b4", date: "2026-05-15", amount: 35000, type: "Transfer", channel: "Bank", comment: "Transfer to savings account", user: "Admin" },
  { id: "b5", date: "2026-05-14", amount: 9800, type: "Receipt", channel: "Bank", comment: "PhonePe - Suspension work", user: "Admin" },
  { id: "b6", date: "2026-05-12", amount: 28000, type: "Payment", channel: "Bank", comment: "NEFT to paint supplier", user: "Admin" },
  { id: "b7", date: "2026-05-10", amount: 65000, type: "Receipt", channel: "Bank", comment: "RTGS - Fleet maintenance contract", user: "Kiran" },
  { id: "b8", date: "2026-05-08", amount: 5500, type: "Expense", channel: "Bank", comment: "Software subscription renewal", user: "Admin" },
  { id: "b9", date: "2026-05-05", amount: 15000, type: "Payment", channel: "Bank", comment: "IMPS to lubricant vendor", user: "Admin" },
  { id: "b10", date: "2026-05-02", amount: 42000, type: "Receipt", channel: "Bank", comment: "NEFT - Insurance claim received", user: "Admin" },
];

export async function getAccountSummary(): Promise<AccountSummary> {
  return {
    cashInHand: 42400,
    totalReceivable: 75200,
    totalPayable: 18600,
    expenses: 42400,
  };
}

export async function getAccountTransactions(
  channel: TransactionChannel,
  from?: string,
  to?: string,
): Promise<AccountTransaction[]> {
  let entries = channel === "Cash" ? DUMMY_CASH_TRANSACTIONS : DUMMY_BANK_TRANSACTIONS;
  if (from) entries = entries.filter((e) => e.date >= from);
  if (to) entries = entries.filter((e) => e.date <= to);
  return entries;
}

export async function getCashInHand(): Promise<number> {
  return 42400;
}

export async function getBankBalance(): Promise<number> {
  return 189300;
}

// kept for backward compatibility
export async function getDaybookEntries(
  from?: string,
  to?: string
): Promise<DaybookEntry[]> {
  return [];
}

// ── Expense API functions (real backend) ──

export async function getExpenses(): Promise<Expense[]> {
  return api.get<Expense[]>("/api/expenses");
}

export async function createExpense(
  expense: Omit<Expense, "id" | "voucherNo" | "createdAt">
): Promise<Expense> {
  return api.post<Expense>("/api/expenses", expense);
}

// ── Expense Label API functions ──

export async function getExpenseLabels(): Promise<ExpenseLabel[]> {
  return api.get<ExpenseLabel[]>("/api/expense-labels");
}

export async function createExpenseLabel(name: string): Promise<ExpenseLabel> {
  return api.post<ExpenseLabel>("/api/expense-labels", { name });
}

// ── Part Purchase Types ──

export interface PartPurchase {
  id: string;
  voucherNo: string;
  vendorId?: string;
  vendorName?: string;
  repairOrderId?: string;
  repairOrderJobCard?: string;
  amount: number;
  date: string;
  comment?: string;
  paidStatus?: string;
  advancePaidAmount?: number;
  paymentChannel: string;
  paymentDate?: string;
  referenceNumber?: string;
  gstApplicable: boolean;
  gstRate?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  hsnSac?: string;
  placeOfSupply?: string;
  imageUrl?: string;
  notes?: string;
  createdAt?: string;
}

// ── Part Purchase API functions ──

export async function getPartPurchases(): Promise<PartPurchase[]> {
  return api.get<PartPurchase[]>("/api/part-purchases");
}

export async function createPartPurchase(
  purchase: Omit<PartPurchase, "id" | "voucherNo" | "createdAt">
): Promise<PartPurchase> {
  return api.post<PartPurchase>("/api/part-purchases", purchase);
}
