export interface ModulePermission {
  view: boolean;
  manage: boolean;
  financial: boolean;
}

export type PermissionMap = Record<string, ModulePermission>;

export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  garageId: string | null;
  garageName: string;
  /** Structured permission map: { ORDERS: { view, manage, financial }, ... } */
  permissions?: PermissionMap;
  garageRoleId?: string;
  /** Actual role name from GarageRole, e.g. "General Manager", "Service Advisor" */
  roleName?: string;
  staffTitle?: string;
}

interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/** Returns the current user's permission map. */
export function getPermissionMap(): PermissionMap {
  return getUser()?.permissions ?? {};
}

// ─── Auth state ───

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

/** Returns the specific role name (e.g. "General Manager", "Technician"). Falls back to staffTitle or role. */
export function getRoleName(): string {
  const user = getUser();
  if (!user) return "";
  if (user.role === "super_admin") return "Super Admin";
  if (user.role === "garage_admin") return "Owner";
  return user.roleName ?? user.staffTitle ?? user.role;
}

// ─── Permission check functions (read from structured permission map) ───

/** Check if the current user has a specific permission (e.g. "ORDERS:MANAGE"). */
export function hasPermission(permission: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "garage_admin") return true;
  if (user.role !== "garage_staff") return false;

  const [mod, action] = permission.split(":");
  const modPerm = (user.permissions ?? {})[mod];
  if (!modPerm) return false;

  if (action === "VIEW") return modPerm.view;
  if (action === "MANAGE") return modPerm.manage;
  return false;
}

/** Check if the user can view a module (e.g., "ORDERS"). */
export function canView(module: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "garage_admin") return true;
  return (user.permissions ?? {})[module]?.view ?? false;
}

/** Check if the user can manage (create/edit/delete) a module. */
export function canManage(module: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "garage_admin") return true;
  return (user.permissions ?? {})[module]?.manage ?? false;
}

/** Check if the user can see financial data (prices, totals, GST) in a specific module. */
export function canViewFinancial(module: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.role === "super_admin" || user.role === "garage_admin") return true;
  return (user.permissions ?? {})[module]?.financial ?? false;
}

// ─── Route helpers ───

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
  if (user.role !== "garage_staff") return "/dashboard";
  for (const { module, path } of MODULE_ROUTES) {
    if (canView(module)) return path;
  }
  return "/dashboard";
}
