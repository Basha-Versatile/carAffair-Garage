import { api } from "@/lib/api";

// ── Types ──

export interface VehicleBrand {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  brandId: string;
  name: string;
  fuelType: FuelType;
  category: VehicleCategory;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  brandId?: string;
  brandName?: string;
  modelId?: string;
  modelName?: string;
  customerId: string;
  purchaseDate?: string;
  engineNumber?: string;
  vinNumber?: string;
  insuranceProvider?: string;
  insurerGstin?: string;
  insurerAddress?: string;
  policyNumber?: string;
  insuranceExpiry?: string;
  fuelType?: string;
  category?: string;
  year?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  referenceId?: string;
  brands: string[];
  ownerName?: string;
  status?: string;
}

export type FuelType =
  | "Petrol"
  | "Diesel"
  | "CNG"
  | "LPG"
  | "HYBRID"
  | "ELECTRIC";

export type VehicleCategory =
  | "Sedan"
  | "Hatchback"
  | "SUV"
  | "Luxury"
  | "VAN";

export const FUEL_TYPES: FuelType[] = [
  "Petrol",
  "Diesel",
  "CNG",
  "LPG",
  "HYBRID",
  "ELECTRIC",
];

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "Sedan",
  "Hatchback",
  "SUV",
  "Luxury",
  "VAN",
];

// ── Brands ──

/** Fetch all vehicle brands. */
export async function getBrands(): Promise<VehicleBrand[]> {
  return api.get<VehicleBrand[]>("/api/brands");
}

/** Find a single brand by id (fetches all, then filters locally). */
export async function getBrandById(
  id: string
): Promise<VehicleBrand | undefined> {
  const brands = await getBrands();
  return brands.find((b) => b.id === id);
}

// ── Models ──

/** Fetch all vehicle models. */
export async function getModels(): Promise<VehicleModel[]> {
  return api.get<VehicleModel[]>("/api/models");
}

/** Fetch models for a specific brand. */
export async function getModelsByBrand(
  brandId: string
): Promise<VehicleModel[]> {
  return api.get<VehicleModel[]>(`/api/models?brandId=${brandId}`);
}

/** Find a single model by id (fetches all, then filters locally). */
export async function getModelById(
  id: string
): Promise<VehicleModel | undefined> {
  const models = await getModels();
  return models.find((m) => m.id === id);
}

/** Create a new vehicle model. */
export async function addModel(
  model: Omit<VehicleModel, "id">
): Promise<VehicleModel> {
  return api.post<VehicleModel>("/api/models", model);
}

// ── Vehicles ──

/** Fetch all vehicles for the current garage. */
export async function getVehicles(): Promise<Vehicle[]> {
  return api.get<Vehicle[]>("/api/vehicles");
}

/** Search for a vehicle by registration number. Returns first match or undefined. */
export async function findVehicleByRegNumber(
  regNumber: string
): Promise<Vehicle | undefined> {
  const encoded = encodeURIComponent(regNumber);
  const vehicles = await api.get<Vehicle[]>(
    `/api/vehicles/search?reg=${encoded}`
  );
  return vehicles.length > 0 ? vehicles[0] : undefined;
}

/** Create a new vehicle. */
export async function addVehicle(
  vehicle: Omit<Vehicle, "id">
): Promise<Vehicle> {
  return api.post<Vehicle>("/api/vehicles", vehicle);
}

/** Fetch vehicles belonging to a specific customer. */
export async function getVehiclesByCustomer(
  customerId: string
): Promise<Vehicle[]> {
  const vehicles = await getVehicles();
  return vehicles.filter((v) => v.customerId === customerId);
}

// ── Customers ──

/** Fetch all customers for the current garage. */
export async function getCustomers(): Promise<Customer[]> {
  return api.get<Customer[]>("/api/customers");
}

/** Create a new customer. */
export async function addCustomer(
  customer: Omit<Customer, "id">
): Promise<Customer> {
  return api.post<Customer>("/api/customers", customer);
}

/** Fetch a single customer by id. */
export async function getCustomerById(
  id: string
): Promise<Customer | undefined> {
  try {
    return await api.get<Customer>(`/api/customers/${id}`);
  } catch {
    return undefined;
  }
}

/** Partially update an existing customer by id. */
export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<Customer> {
  return api.put<Customer>(`/api/customers/${id}`, updates);
}

// ── Vendors ──

/** Fetch all vendors for the current garage. */
export async function getVendors(): Promise<Vendor[]> {
  return api.get<Vendor[]>("/api/vendors");
}

/** Create a new vendor. */
export async function addVendor(vendor: Omit<Vendor, "id">): Promise<Vendor> {
  return api.post<Vendor>("/api/vendors", vendor);
}

/** Fetch a single vendor by id (fetches all, then filters locally). */
export async function getVendorById(
  id: string
): Promise<Vendor | undefined> {
  const vendors = await getVendors();
  return vendors.find((v) => v.id === id);
}

// ── RC Lookup ──

export interface RcLookupResult {
  ownerName: string | null;
  address: string | null;
  mobileNumber: string | null;
  makerDescription: string | null;
  makerModel: string | null;
  fuelType: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  manufacturingDate: string | null;
  registrationDate: string | null;
  color: string | null;
  bodyType: string | null;
  vehicleCategory: string | null;
  rcStatus: string | null;
  insuranceCompany: string | null;
  policyNumber: string | null;
  insuranceUpto: string | null;
  financer: string | null;
  matchedBrandId: string | null;
  matchedBrandName: string | null;
  matchedModelId: string | null;
  matchedModelName: string | null;
  matchedFuelType: string | null;
}

/** Fetch RC details from SurePass via backend proxy. */
export async function lookupRC(
  registrationNumber: string
): Promise<RcLookupResult> {
  return api.post<RcLookupResult>("/api/rc-lookup", { registrationNumber });
}
