import { api } from "@/lib/api";

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  role: string;
  tasksCompleted: number;
  avgTaskTimeMs: number;
  daysPresent: number;
  totalWorkMinutes: number;
  avgWorkMinutes: number;
  attendanceRate: number;
  leaveDaysTaken: number;
}

export async function getStaffPerformance(
  startDate?: string,
  endDate?: string
): Promise<StaffPerformance[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const q = params.toString() ? `?${params}` : "";
  return api.get<StaffPerformance[]>(`/api/performance/staff${q}`);
}
