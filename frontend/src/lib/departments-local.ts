// ── Department-wise billing – localStorage layer ──
// Temporary prototype storage. Will be replaced with API calls after client approval.

export interface Department {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface DeptMapping {
  departmentId: string;
  departmentName: string;
}

// ── Helpers ──

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Department CRUD ──

function deptKey(garageId: string) {
  return `departments_${garageId}`;
}

export function getDepartments(garageId: string): Department[] {
  return getJson<Department[]>(deptKey(garageId), [])
    .filter((d) => d.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAllDepartments(garageId: string): Department[] {
  return getJson<Department[]>(deptKey(garageId), []);
}

export function createDepartment(garageId: string, name: string, sortOrder: number): Department {
  const all = getJson<Department[]>(deptKey(garageId), []);
  const dept: Department = { id: uid(), name, sortOrder, isActive: true };
  all.push(dept);
  setJson(deptKey(garageId), all);
  return dept;
}

export function updateDepartment(
  garageId: string,
  id: string,
  updates: Partial<Pick<Department, "name" | "sortOrder">>,
): Department | null {
  const all = getJson<Department[]>(deptKey(garageId), []);
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...updates };
  setJson(deptKey(garageId), all);
  return all[idx];
}

export function deleteDepartment(garageId: string, id: string): void {
  const all = getJson<Department[]>(deptKey(garageId), []);
  const idx = all.findIndex((d) => d.id === id);
  if (idx === -1) return;
  all[idx].isActive = false;
  setJson(deptKey(garageId), all);
}

// ── Service ↔ Department mapping ──

function svcMapKey(garageId: string) {
  return `dept_map_service_${garageId}`;
}

export function setServiceDepartment(
  garageId: string,
  serviceId: string,
  departmentId: string,
  departmentName: string,
): void {
  const map = getJson<Record<string, DeptMapping>>(svcMapKey(garageId), {});
  map[serviceId] = { departmentId, departmentName };
  setJson(svcMapKey(garageId), map);
}

export function getServiceDepartment(garageId: string, serviceId: string): DeptMapping | null {
  const map = getJson<Record<string, DeptMapping>>(svcMapKey(garageId), {});
  return map[serviceId] ?? null;
}

export function getAllServiceDepartments(garageId: string): Record<string, DeptMapping> {
  return getJson<Record<string, DeptMapping>>(svcMapKey(garageId), {});
}

// ── Part ↔ Department mapping ──

function partMapKey(garageId: string) {
  return `dept_map_part_${garageId}`;
}

export function setPartDepartment(
  garageId: string,
  partId: string,
  departmentId: string,
  departmentName: string,
): void {
  const map = getJson<Record<string, DeptMapping>>(partMapKey(garageId), {});
  map[partId] = { departmentId, departmentName };
  setJson(partMapKey(garageId), map);
}

export function getPartDepartment(garageId: string, partId: string): DeptMapping | null {
  const map = getJson<Record<string, DeptMapping>>(partMapKey(garageId), {});
  return map[partId] ?? null;
}

export function getAllPartDepartments(garageId: string): Record<string, DeptMapping> {
  return getJson<Record<string, DeptMapping>>(partMapKey(garageId), {});
}

// ── Billing mode per order ──

export function getBillingMode(orderId: string): "standard" | "department" {
  return getJson<"standard" | "department">(`billing_mode_${orderId}`, "standard");
}

export function setBillingMode(orderId: string, mode: "standard" | "department"): void {
  setJson(`billing_mode_${orderId}`, mode);
}

// ── Line item department overrides per order ──

function overrideKey(orderId: string) {
  return `dept_overrides_${orderId}`;
}

export function getLineItemDepartment(orderId: string, lineItemKey: string): DeptMapping | null {
  const map = getJson<Record<string, DeptMapping>>(overrideKey(orderId), {});
  return map[lineItemKey] ?? null;
}

export function setLineItemDepartment(
  orderId: string,
  lineItemKey: string,
  departmentId: string,
  departmentName: string,
): void {
  const map = getJson<Record<string, DeptMapping>>(overrideKey(orderId), {});
  map[lineItemKey] = { departmentId, departmentName };
  setJson(overrideKey(orderId), map);
}

export function removeLineItemDepartment(orderId: string, lineItemKey: string): void {
  const map = getJson<Record<string, DeptMapping>>(overrideKey(orderId), {});
  delete map[lineItemKey];
  setJson(overrideKey(orderId), map);
}

export function getAllLineItemDepartments(orderId: string): Record<string, DeptMapping> {
  return getJson<Record<string, DeptMapping>>(overrideKey(orderId), {});
}
