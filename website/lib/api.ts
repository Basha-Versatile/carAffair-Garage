const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function publicGet<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url);
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
