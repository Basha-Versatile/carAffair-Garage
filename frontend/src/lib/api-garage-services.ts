import { api } from "@/lib/api";

export interface ApplicableBrand {
  brandId: string;
  brandName: string;
  modelIds: string[];
  modelNames: string[];
}

export interface GarageService {
  id: string;
  name: string;
  price: number;
  serviceNumber?: string;
  categoryId?: string;
  categoryName?: string;
  isGeneric: boolean;
  applicableBrands?: ApplicableBrand[];
  hasGst: boolean;
  taxProfileId?: string;
  sacNumber?: string;
  gstRate: number;
}

export async function getGarageServices(): Promise<GarageService[]> {
  return api.get<GarageService[]>("/api/garage-services");
}

export async function createGarageService(
  service: Omit<GarageService, "id">
): Promise<GarageService> {
  return api.post<GarageService>("/api/garage-services", service);
}
