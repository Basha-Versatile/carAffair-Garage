import { api } from "@/lib/api";

export interface GarageRegistration {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  gstNumber?: string;
  address?: string;
  state?: string;
  city?: string;
  streetAddress?: string;
  latitude?: number;
  longitude?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fetch all garage registration requests (super admin only). */
export async function getGarageRegistrations(): Promise<GarageRegistration[]> {
  return api.get<GarageRegistration[]>("/api/garage-registrations");
}

/** Fetch a single garage registration by ID. */
export async function getGarageRegistrationById(
  id: string
): Promise<GarageRegistration> {
  return api.get<GarageRegistration>(`/api/garage-registrations/${id}`);
}

/** Approve a pending garage registration. */
export async function approveRegistration(id: string): Promise<void> {
  await api.post<string>(`/api/garage-registrations/${id}/approve`, {});
}

/** Reject a pending garage registration with optional reason. */
export async function rejectRegistration(
  id: string,
  reason: string
): Promise<void> {
  await api.post<string>(`/api/garage-registrations/${id}/reject`, { reason });
}
