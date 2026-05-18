import { api } from "@/lib/api";

export interface ServiceCategory {
  id: string;
  name: string;
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  return api.get<ServiceCategory[]>("/api/service-categories");
}

export async function createServiceCategory(name: string): Promise<ServiceCategory> {
  return api.post<ServiceCategory>("/api/service-categories", { name });
}
