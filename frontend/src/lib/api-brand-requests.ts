import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export interface BrandRequest {
  id: string;
  name: string;
  garageId: string;
  garageName: string;
  requestedByUserId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  approvedBrandId?: string;
  logoFileId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Submit a new brand request (garage admin). */
export async function submitBrandRequest(name: string): Promise<BrandRequest> {
  return api.post<BrandRequest>("/api/brand-requests", { name });
}

/** Fetch all brand requests (super admin only). */
export async function getBrandRequests(): Promise<BrandRequest[]> {
  return api.get<BrandRequest[]>("/api/brand-requests");
}

/** Fetch a single brand request by ID. */
export async function getBrandRequestById(id: string): Promise<BrandRequest> {
  return api.get<BrandRequest>(`/api/brand-requests/${id}`);
}

/** Approve a brand request with optional logo file. */
export async function approveBrandRequest(id: string, logoFile?: File): Promise<void> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const formData = new FormData();
  if (logoFile) {
    formData.append("logo", logoFile);
  }
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/brand-requests/${id}/approve`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) {
    const json = await response.json().catch(() => ({}));
    throw new Error(json.message || "Failed to approve brand request");
  }
}

/** Reject a brand request with optional reason. */
export async function rejectBrandRequest(id: string, reason: string): Promise<void> {
  await api.post<string>(`/api/brand-requests/${id}/reject`, { reason });
}
