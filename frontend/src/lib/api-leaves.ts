import { api } from "@/lib/api";

export interface LeaveRequest {
  id: string;
  garageId: string;
  staffId: string;
  staffName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewerName?: string;
  rejectionNote?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveBalance {
  id: string;
  garageId: string;
  staffId: string;
  year: string;
  casualTotal: number;
  casualUsed: number;
  sickTotal: number;
  sickUsed: number;
  earnedTotal: number;
  earnedUsed: number;
}

export async function applyLeave(
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string
): Promise<LeaveRequest> {
  return api.post<LeaveRequest>("/api/leaves", {
    leaveType,
    startDate,
    endDate,
    reason,
  });
}

export async function getLeaves(status?: string): Promise<LeaveRequest[]> {
  const q = status ? `?status=${status}` : "";
  return api.get<LeaveRequest[]>(`/api/leaves${q}`);
}

export async function getMyLeaves(): Promise<LeaveRequest[]> {
  return api.get<LeaveRequest[]>("/api/leaves/my");
}

export async function approveLeave(id: string): Promise<LeaveRequest> {
  return api.put<LeaveRequest>(`/api/leaves/${id}/approve`, {});
}

export async function rejectLeave(
  id: string,
  note: string
): Promise<LeaveRequest> {
  return api.put<LeaveRequest>(`/api/leaves/${id}/reject`, { note });
}

export async function getMyBalance(): Promise<LeaveBalance> {
  return api.get<LeaveBalance>("/api/leaves/balance/my");
}

export async function getStaffBalance(staffId: string): Promise<LeaveBalance> {
  return api.get<LeaveBalance>(`/api/leaves/balance/${staffId}`);
}

export async function updateBalance(
  staffId: string,
  casualTotal: number,
  sickTotal: number,
  earnedTotal: number
): Promise<LeaveBalance> {
  return api.put<LeaveBalance>(`/api/leaves/balance/${staffId}`, {
    casualTotal,
    sickTotal,
    earnedTotal,
  });
}

export async function getLeaveCalendar(
  startDate: string,
  endDate: string
): Promise<LeaveRequest[]> {
  return api.get<LeaveRequest[]>(
    `/api/leaves/calendar?startDate=${startDate}&endDate=${endDate}`
  );
}
