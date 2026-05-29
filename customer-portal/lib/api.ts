const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function publicPost<T>(
  endpoint: string,
  body: unknown,
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
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new Error(
      `Unexpected server response (status ${response.status}). Please try again.`,
    );
  }

  if (!json.success)
    throw new Error(json.message || `API error: ${response.status}`);
  return json.data;
}

// For authenticated requests (future customer dashboard)
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("ca_access_token")
      : null;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new Error(
      "Network error. Please check your connection and try again.",
    );
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ca_access_token");
      localStorage.removeItem("ca_refresh_token");
      localStorage.removeItem("ca_user");
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new Error(
      `Unexpected server response (status ${response.status}). Please try again.`,
    );
  }

  if (!json.success)
    throw new Error(json.message || `API error: ${response.status}`);
  return json.data;
}

export const api = {
  get: <T>(endpoint: string) => apiFetch<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body: unknown) =>
    apiFetch<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
};
