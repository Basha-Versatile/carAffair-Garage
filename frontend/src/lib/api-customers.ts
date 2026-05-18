import { api } from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export async function getCustomers(): Promise<Customer[]> {
  return api.get<Customer[]>("/api/customers");
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  return api.get<Customer[]>(`/api/customers/search?q=${encodeURIComponent(query)}`);
}

export async function createCustomer(
  customer: Omit<Customer, "id">
): Promise<Customer> {
  return api.post<Customer>("/api/customers", customer);
}
