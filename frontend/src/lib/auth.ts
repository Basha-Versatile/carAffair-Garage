export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  garageId: string | null;
  garageName: string;
  permissions?: string[];
  financialModules?: string[];
  garageRoleId?: string;
  staffTitle?: string;
}

interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

const AUTH_KEY = "garrage_auth";

function getAuthData(): AuthData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

export function getUser(): User | null {
  return getAuthData()?.user ?? null;
}

export function setAuth(data: { user: User; accessToken: string; refreshToken: string }): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

export function getAccessToken(): string | null {
  return getAuthData()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return getAuthData()?.refreshToken ?? null;
}

export function clearUser(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn(): boolean {
  const data = getAuthData();
  return data !== null && !!data.user && !!data.accessToken;
}

export function isSuperAdmin(): boolean {
  const user = getUser();
  return user?.role === "super_admin";
}

export function isGarageAdmin(): boolean {
  const user = getUser();
  return user?.role === "garage_admin";
}

export function isGarageStaff(): boolean {
  const user = getUser();
  return user?.role === "garage_staff";
}

/** Returns true for garage_admin (the owner). */
export function isGarageOwner(): boolean {
  return isGarageAdmin();
}

/**
 * Maps new granular module names back to their legacy parent module.
 * Allows old JWTs (issued before migration) to still grant access.
 */
const LEGACY_MODULE_MAP: Record<string, string> = {
  SERVICE_REMINDERS: "REMINDERS",
  SERVICE_FEEDBACKS: "REMINDERS",
  INSURANCE_DUE: "REMINDERS",
};

/** Check if the current user has a specific permission. */
export function hasPermission(permission: string): boolean {
  const user = getUser();
  if (!user) return false;
  // super_admin and garage_admin have implicit full access
  if (user.role === "super_admin" || user.role === "garage_admin") return true;
  if (user.role !== "garage_staff") return false;
  const perms = user.permissions ?? [];
  if (perms.includes(permission)) return true;

  const [mod, action] = permission.split(":");

  // MANAGE implies VIEW
  if (action === "VIEW" && perms.includes(`${mod}:MANAGE`)) return true;

  // Backward compat: check legacy module name for old JWT tokens
  const legacyMod = LEGACY_MODULE_MAP[mod];
  if (legacyMod) {
    if (perms.includes(`${legacyMod}:${action}`)) return true;
    if (action === "VIEW" && perms.includes(`${legacyMod}:MANAGE`)) return true;
  }

  return false;
}

/** Check if the user can view a module (e.g., "ORDERS"). */
export function canView(module: string): boolean {
  return hasPermission(`${module}:VIEW`);
}

/** Check if the user can manage (create/edit/delete) a module. */
export function canManage(module: string): boolean {
  return hasPermission(`${module}:MANAGE`);
}

/** Check if the user can see financial data (prices, totals, GST) in a specific module. */
export function canViewFinancial(module: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "garage_admin") return true;
  if (user.role !== "garage_staff") return false;
  return (user.financialModules ?? []).includes(module);
}

/** Route order for staff — used to find the first accessible page after login. */
const MODULE_ROUTES: { module: string; path: string }[] = [
  { module: "DASHBOARD", path: "/dashboard" },
  { module: "ORDERS", path: "/dashboard/orders" },
  { module: "INVOICES", path: "/dashboard/invoices" },
  { module: "INVENTORY", path: "/dashboard/inventory" },
  { module: "ACCOUNTS", path: "/dashboard/accounts" },
  { module: "CUSTOMERS", path: "/dashboard/customers" },
  { module: "VENDORS", path: "/dashboard/vendors" },
  { module: "VEHICLES", path: "/dashboard/vehicle-search" },
  { module: "APPOINTMENTS", path: "/dashboard/appointments" },
  { module: "SERVICE_REMINDERS", path: "/dashboard/service-reminders" },
  { module: "REPORTS", path: "/dashboard/reports" },
  { module: "ATTENDANCE", path: "/dashboard/attendance" },
  { module: "LEAVES", path: "/dashboard/leaves" },
  { module: "SETTINGS", path: "/dashboard/settings" },
];

/** Returns the first route the current user has VIEW permission for. */
export function getFirstPermittedRoute(): string {
  const user = getUser();
  if (!user) return "/login";
  // Non-staff users always go to /dashboard
  if (user.role !== "garage_staff") return "/dashboard";
  for (const { module, path } of MODULE_ROUTES) {
    if (canView(module)) return path;
  }
  // Fallback if no permissions at all
  return "/dashboard";
}
