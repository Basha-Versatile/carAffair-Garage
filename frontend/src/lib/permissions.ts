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
  "REMINDERS",
  "REPORTS",
  "SETTINGS",
  "LOGS",
] as const;

export type Module = (typeof MODULES)[number];

/** Human-readable labels for each module. */
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
  REMINDERS: "Reminders",
  REPORTS: "Reports",
  SETTINGS: "Settings",
  LOGS: "Activity Logs",
};

/** All valid permission strings. */
export const ALL_PERMISSIONS: string[] = MODULES.flatMap((m) => [
  `${m}:VIEW`,
  `${m}:MANAGE`,
]);
