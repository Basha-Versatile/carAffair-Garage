import { api } from "@/lib/api";

export interface GarageRole {
  id: string;
  garageId: string;
  name: string;
  description?: string;
  permissions: string[];
  financialModules: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
  financialModules: string[];
}

export interface UpdateRolePayload {
  name: string;
  description?: string;
  permissions: string[];
  financialModules: string[];
}

export function getRoles(): Promise<GarageRole[]> {
  return api.get<GarageRole[]>("/api/garage-roles");
}

export function getRoleById(id: string): Promise<GarageRole> {
  return api.get<GarageRole>(`/api/garage-roles/${id}`);
}

export function createRole(payload: CreateRolePayload): Promise<GarageRole> {
  return api.post<GarageRole>("/api/garage-roles", payload);
}

export function updateRole(id: string, payload: UpdateRolePayload): Promise<GarageRole> {
  return api.put<GarageRole>(`/api/garage-roles/${id}`, payload);
}

export function deleteRole(id: string): Promise<void> {
  return api.delete<void>(`/api/garage-roles/${id}`);
}
