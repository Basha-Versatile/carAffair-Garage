import { api } from "@/lib/api";

export interface Manufacturer {
  id: string;
  name: string;
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  return api.get<Manufacturer[]>("/api/manufacturers");
}

export async function createManufacturer(name: string): Promise<Manufacturer> {
  return api.post<Manufacturer>("/api/manufacturers", { name });
}
