import { api } from "@/lib/api";

export interface TaxProfile {
  id: string;
  name: string;
  taxPercent: number;
  sacNumber?: string;
  taxType: "service" | "goods";
}

export async function getTaxProfiles(type?: string): Promise<TaxProfile[]> {
  const query = type ? `?type=${type}` : "";
  return api.get<TaxProfile[]>(`/api/tax-profiles${query}`);
}

export async function createTaxProfile(
  profile: Omit<TaxProfile, "id">
): Promise<TaxProfile> {
  return api.post<TaxProfile>("/api/tax-profiles", profile);
}
