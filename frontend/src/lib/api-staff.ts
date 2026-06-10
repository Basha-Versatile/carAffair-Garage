import { api } from "@/lib/api";

export interface StaffMember {
  id: string;
  phone: string;
  name: string;
  email?: string;
  staffTitle?: string;
  garageRoleId?: string;
  roleName?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface CreateStaffPayload {
  phone: string;
  name: string;
  email?: string;
  staffTitle?: string;
  garageRoleId: string;
}

export interface UpdateStaffPayload {
  name?: string;
  email?: string;
  staffTitle?: string;
  garageRoleId?: string;
}

export function getStaffMembers(): Promise<StaffMember[]> {
  return api.get<StaffMember[]>("/api/garage-staff");
}

export function createStaffMember(payload: CreateStaffPayload): Promise<StaffMember> {
  return api.post<StaffMember>("/api/garage-staff", payload);
}

export function updateStaffMember(id: string, payload: UpdateStaffPayload): Promise<StaffMember> {
  return api.put<StaffMember>(`/api/garage-staff/${id}`, payload);
}

export function removeStaffMember(id: string): Promise<void> {
  return api.delete<void>(`/api/garage-staff/${id}`);
}

export interface AssignableRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  isDefault: boolean;
}

/** Returns roles the current user is allowed to assign (filtered by hierarchy). */
export function getAssignableRoles(): Promise<AssignableRole[]> {
  return api.get<AssignableRole[]>("/api/garage-staff/assignable-roles");
}
