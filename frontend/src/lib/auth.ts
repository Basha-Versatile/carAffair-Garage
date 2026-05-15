export interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  garageId: string | null;
  garageName: string;
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
