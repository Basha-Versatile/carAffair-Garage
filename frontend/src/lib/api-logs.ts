import { api } from "@/lib/api";

export interface ActivityLog {
  id: string;
  garageId: string;
  userId: string;
  userName: string;
  userRole: string;
  staffTitle?: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  createdAt: string;
}

export interface ActivityLogPage {
  content: ActivityLog[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface LogFilters {
  page?: number;
  size?: number;
  action?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function getActivityLogs(filters: LogFilters = {}): Promise<ActivityLogPage> {
  const params = new URLSearchParams();
  if (filters.page !== undefined) params.set("page", String(filters.page));
  if (filters.size !== undefined) params.set("size", String(filters.size));
  if (filters.action) params.set("action", filters.action);
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);

  const qs = params.toString();
  return api.get<ActivityLogPage>(`/api/activity-logs${qs ? "?" + qs : ""}`);
}
