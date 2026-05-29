import { api, apiFetch } from "@/lib/api";
import type { Order } from "@/lib/api-orders";

// ── Types ──

export interface PackageServiceItem {
  serviceId: string;
  serviceName: string;
  hsnSac?: string;
  defaultQty: number;
  defaultRate: number;
  gstRate: number;
}

export interface PackagePartItem {
  partId: string;
  partName: string;
  hsnSac?: string;
  defaultQty: number;
  defaultRate: number;
  gstRate: number;
}

export interface ServicePackage {
  id: string;
  garageId?: string;
  name: string;
  description?: string;
  serviceItems: PackageServiceItem[];
  partItems: PackagePartItem[];
  totalEstimate: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── API Functions ──

export async function getPackages(): Promise<ServicePackage[]> {
  return api.get<ServicePackage[]>("/api/packages");
}

export async function createPackage(
  pkg: Omit<ServicePackage, "id">
): Promise<ServicePackage> {
  return api.post<ServicePackage>("/api/packages", pkg);
}

export async function updatePackage(
  id: string,
  pkg: Partial<ServicePackage>
): Promise<ServicePackage> {
  return api.put<ServicePackage>(`/api/packages/${id}`, pkg);
}

export async function deletePackage(id: string): Promise<void> {
  await api.delete(`/api/packages/${id}`);
}

export async function applyPackageToOrder(
  packageId: string,
  orderId: string
): Promise<Order> {
  return apiFetch<Order>(`/api/packages/apply/${packageId}/order/${orderId}`, {
    method: "POST",
  });
}
