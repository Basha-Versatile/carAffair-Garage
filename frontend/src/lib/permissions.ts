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

// ─── Static role defaults (mirrors backend ROLE_DEFAULTS — single source of truth for UI) ───

export interface RoleDefault {
  name: string;
  description: string;
  permissions: string[];
  financialModules: string[];
}

export const ROLE_DEFAULTS: Record<string, RoleDefault> = {
  "General Manager": {
    name: "General Manager",
    description: "Oversees all operations, staff, and reports",
    permissions: [
      "DASHBOARD:MANAGE", "ORDERS:MANAGE", "INVOICES:MANAGE",
      "CUSTOMERS:MANAGE", "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
      "SERVICE_REMINDERS:MANAGE", "SERVICE_FEEDBACKS:MANAGE", "INSURANCE_DUE:MANAGE",
      "REPORTS:MANAGE", "TALLY_EXPORT:MANAGE", "STAFF:MANAGE",
      "ATTENDANCE:MANAGE", "LEAVES:MANAGE", "STAFF_PERFORMANCE:MANAGE",
      "INVENTORY:VIEW", "ACCOUNTS:VIEW", "LOGS:VIEW",
    ],
    financialModules: ["ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS"],
  },
  "Service Advisor": {
    name: "Service Advisor",
    description: "Manages job cards, customers, appointments, and staff",
    permissions: [
      "DASHBOARD:VIEW", "ORDERS:MANAGE", "INVOICES:VIEW",
      "CUSTOMERS:MANAGE", "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
      "SERVICE_REMINDERS:VIEW", "SERVICE_FEEDBACKS:VIEW", "INSURANCE_DUE:VIEW",
      "ATTENDANCE:VIEW", "LEAVES:VIEW",
      "STAFF:MANAGE", "STAFF_PERFORMANCE:VIEW",
    ],
    financialModules: ["ORDERS", "INVOICES"],
  },
  "Technician": {
    name: "Technician",
    description: "Works on assigned tasks, updates progress",
    permissions: [
      "DASHBOARD:VIEW", "ORDERS:VIEW",
      "ATTENDANCE:VIEW", "LEAVES:VIEW",
    ],
    financialModules: [],
  },
  "Store Keeper": {
    name: "Store Keeper",
    description: "Manages inventory, vendors, and purchase orders",
    permissions: [
      "DASHBOARD:VIEW", "INVENTORY:MANAGE", "VENDORS:MANAGE",
      "ORDERS:VIEW", "ATTENDANCE:VIEW", "LEAVES:VIEW",
    ],
    financialModules: ["INVENTORY"],
  },
  "Accountant": {
    name: "Accountant",
    description: "Manages invoices, expenses, accounts, and reports",
    permissions: [
      "DASHBOARD:VIEW", "ORDERS:VIEW", "INVOICES:MANAGE",
      "ACCOUNTS:MANAGE", "INVENTORY:VIEW", "VENDORS:VIEW",
      "REPORTS:MANAGE", "TALLY_EXPORT:MANAGE", "ATTENDANCE:VIEW",
    ],
    financialModules: ["ORDERS", "INVOICES", "INVENTORY", "ACCOUNTS", "DASHBOARD", "REPORTS"],
  },
  "Front Desk Executive": {
    name: "Front Desk Executive",
    description: "Handles customers, appointments, and basic job cards",
    permissions: [
      "DASHBOARD:VIEW", "ORDERS:VIEW", "CUSTOMERS:MANAGE",
      "VEHICLES:MANAGE", "APPOINTMENTS:MANAGE",
      "SERVICE_REMINDERS:VIEW", "SERVICE_FEEDBACKS:VIEW", "INSURANCE_DUE:VIEW",
      "INVOICES:VIEW", "ATTENDANCE:VIEW", "LEAVES:VIEW",
    ],
    financialModules: ["ORDERS", "INVOICES"],
  },
};
