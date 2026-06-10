import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Attendance {
  id: string;
  garageId: string;
  staffId: string;
  staffName: string;
  date: string;
  checkinTime?: string;
  checkinLat?: number;
  checkinLng?: number;
  checkinPhotoId?: string;
  inUniform?: boolean;
  checkoutTime?: string;
  checkoutLat?: number;
  checkoutLng?: number;
  checkoutPhotoId?: string;
  totalWorkMinutes?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceSummary {
  totalCheckins: number;
  totalCheckouts: number;
  totalWorkMinutes: number;
  avgWorkMinutes: number;
}

export async function checkin(
  lat: number,
  lng: number,
  photo: File | null,
  inUniform: boolean
): Promise<Attendance> {
  const formData = new FormData();
  formData.append("lat", String(lat));
  formData.append("lng", String(lng));
  formData.append("inUniform", String(inUniform));
  if (photo) formData.append("photo", photo);

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/attendance/checkin`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.message || "Failed to check in");
  }
  const json = await response.json();
  return json.data;
}

export async function checkout(
  lat: number,
  lng: number,
  photo: File | null
): Promise<Attendance> {
  const formData = new FormData();
  formData.append("lat", String(lat));
  formData.append("lng", String(lng));
  if (photo) formData.append("photo", photo);

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/api/attendance/checkout`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    throw new Error(json?.message || "Failed to check out");
  }
  const json = await response.json();
  return json.data;
}

export async function getMyStatus(): Promise<Attendance | null> {
  return api.get<Attendance | null>("/api/attendance/my-status");
}

export async function getTodayAttendance(): Promise<Attendance[]> {
  return api.get<Attendance[]>("/api/attendance/today");
}

export async function getStaffAttendance(
  staffId: string,
  startDate: string,
  endDate: string
): Promise<Attendance[]> {
  return api.get<Attendance[]>(
    `/api/attendance/staff/${staffId}?startDate=${startDate}&endDate=${endDate}`
  );
}

export async function getAttendanceSummary(
  startDate: string,
  endDate: string
): Promise<AttendanceSummary> {
  return api.get<AttendanceSummary>(
    `/api/attendance/summary?startDate=${startDate}&endDate=${endDate}`
  );
}

export async function getAbsentees(
  date?: string
): Promise<{ id: string; name: string }[]> {
  const q = date ? `?date=${date}` : "";
  return api.get<{ id: string; name: string }[]>(`/api/attendance/absentees${q}`);
}
