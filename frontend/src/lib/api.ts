import { getAccessToken, getRefreshToken, setAuth, clearUser } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      let res: Response;
      try {
        res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        return false;
      }

      if (!res.ok) return false;

      let json: ApiResponse<{
        accessToken: string;
        refreshToken: string;
        userId: string;
        name: string;
        phone: string;
        role: string;
        garageId: string | null;
        garageName: string;
      }>;
      try {
        json = await res.json();
      } catch {
        return false;
      }

      if (!json.success || !json.data) return false;

      const d = json.data;
      setAuth({
        user: {
          id: d.userId,
          name: d.name,
          phone: d.phone,
          role: d.role,
          garageId: d.garageId,
          garageName: d.garageName,
        },
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
      });

      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  // On 401, attempt token refresh and retry once
  if (response.status === 401 && token) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
      }
      try {
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch {
        throw new Error("Network error. Please check your connection and try again.");
      }
    }

    // If still 401 or refresh failed, clear auth and redirect
    if (response.status === 401 || !refreshed) {
      clearUser();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Unexpected server response (status ${response.status}). Please try again.`);
  }

  if (!json.success) {
    throw new Error(json.message || "An unexpected error occurred");
  }

  return json.data;
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: "DELETE" }),
};

/**
 * Public POST request — no Authorization header, no 401 refresh.
 * Use for unauthenticated endpoints like send-otp and verify-otp.
 */
export async function publicPost<T>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Network error. Please check your connection and try again.");
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new Error(`Unexpected server response (status ${response.status}). Please try again.`);
  }

  if (!json.success) {
    throw new Error(json.message || "An unexpected error occurred");
  }

  return json.data;
}
