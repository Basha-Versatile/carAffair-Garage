/** All permission modules available in the system. */
export const MODULES = [
  "DASHBOARD",
  "ORDERS",
  "INVOICES",
  "INVENTORY",
  "ACCOUNTS",
  "CUSTOMERS",
  "VENDORS",
  "VEHICLES",
  "APPOINTMENTS",
  "SERVICE_REMINDERS",
  "SERVICE_FEEDBACKS",
  "INSURANCE_DUE",
  "ATTENDANCE",
  "LEAVES",
  "STAFF_PERFORMANCE",
  "REPORTS",
  "TALLY_EXPORT",
  "STAFF",
  "SETTINGS",
  "LOGS",
] as const;

export type Module = (typeof MODULES)[number];

/** Human-readable labels for each module (matches sidebar item names). */
export const MODULE_LABELS: Record<Module, string> = {
  DASHBOARD: "Dashboard",
  ORDERS: "Orders",
  INVOICES: "Invoices",
  INVENTORY: "Inventory",
  ACCOUNTS: "Accounts",
  CUSTOMERS: "Customers",
  VENDORS: "Vendors",
  VEHICLES: "Vehicles",
  APPOINTMENTS: "Appointments",
  SERVICE_REMINDERS: "Service Reminders",
  SERVICE_FEEDBACKS: "Service Feedbacks",
  INSURANCE_DUE: "Insurance Due",
  ATTENDANCE: "Attendance",
  LEAVES: "Leaves",
  STAFF_PERFORMANCE: "Staff Performance",
  REPORTS: "Reports",
  TALLY_EXPORT: "Tally Export",
  STAFF: "Garage Users",
  SETTINGS: "Garage Settings",
  LOGS: "Activity Logs",
};

/** Sub-pages/features controlled by each module permission. */
export const MODULE_SUB_PAGES: Record<Module, string[]> = {
  DASHBOARD: ["Dashboard Overview", "Analytics & Charts"],
  ORDERS: ["Orders", "My Tasks", "Cancelled Orders", "Estimates", "Work Orders"],
  INVOICES: ["Tax Invoices", "Proforma Invoices", "Invoice PDF"],
  INVENTORY: ["Parts Stock", "Stock In", "Stock Out"],
  ACCOUNTS: ["Expenses", "Part Purchases", "Account Ledger"],
  CUSTOMERS: ["Customer List", "Customer Profiles", "Customer History"],
  VENDORS: ["Vendor List", "Vendor Management"],
  VEHICLES: ["Vehicle Search", "Vehicle Records"],
  APPOINTMENTS: ["Appointment Calendar", "Booking Management"],
  SERVICE_REMINDERS: ["Reminder List", "Send Reminders"],
  SERVICE_FEEDBACKS: ["Feedback Collection", "Feedback Reports"],
  INSURANCE_DUE: ["Insurance Expiry List", "Insurance Notifications"],
  ATTENDANCE: ["Daily Attendance", "Check In / Check Out"],
  LEAVES: ["Leave Requests", "Leave Approvals", "Leave Balance"],
  STAFF_PERFORMANCE: ["Performance Dashboard", "Mechanic Reports"],
  REPORTS: ["Order Reports", "Invoice Reports", "Sales Reports", "Payment Reports", "Stock Reports", "Service Reports"],
  TALLY_EXPORT: ["Tally Data Export", "Export Configuration"],
  STAFF: ["Staff List", "Add / Edit / Remove Staff", "Role Assignment"],
  SETTINGS: ["Garage Profile", "Services & Parts Config", "Departments", "Tags"],
  LOGS: ["Activity Logs", "Audit Trail"],
};

/** Permission modules grouped by sidebar sections. */
export interface PermissionGroup {
  title: string;
  modules: Module[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "General",
    modules: ["DASHBOARD"],
  },
  {
    title: "Workshop",
    modules: ["ORDERS", "VEHICLES", "INVOICES"],
  },
  {
    title: "Contacts",
    modules: ["CUSTOMERS", "VENDORS"],
  },
  {
    title: "Stock & Finance",
    modules: ["INVENTORY", "ACCOUNTS"],
  },
  {
    title: "Scheduling",
    modules: ["APPOINTMENTS", "SERVICE_REMINDERS", "SERVICE_FEEDBACKS", "INSURANCE_DUE"],
  },
  {
    title: "Staff",
    modules: ["ATTENDANCE", "LEAVES", "STAFF_PERFORMANCE"],
  },
  {
    title: "Reports",
    modules: ["REPORTS", "TALLY_EXPORT"],
  },
  {
    title: "Administration",
    modules: ["STAFF", "SETTINGS", "LOGS"],
  },
];

/** All valid permission strings. */
export const ALL_PERMISSIONS: string[] = MODULES.flatMap((m) => [
  `${m}:VIEW`,
  `${m}:MANAGE`,
]);

/** Modules that can have per-role financial data visibility toggled. */
export const FINANCIAL_MODULES: Module[] = [
  "ORDERS",
  "INVOICES",
  "INVENTORY",
  "ACCOUNTS",
  "DASHBOARD",
  "REPORTS",
];
