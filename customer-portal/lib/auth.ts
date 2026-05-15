export interface PortalUser {
  id: string;
  name: string;
  phone: string;
  role: "customer" | "vendor";
}

const USER_KEY = "ca_user";
const ACCESS_TOKEN_KEY = "ca_access_token";
const REFRESH_TOKEN_KEY = "ca_refresh_token";

export function getUser(): PortalUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
}

export function setAuth(data: {
  user: PortalUser;
  accessToken: string;
  refreshToken: string;
}): void {
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
}

export function clearAuth(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getUser() !== null && localStorage.getItem(ACCESS_TOKEN_KEY) !== null;
}
