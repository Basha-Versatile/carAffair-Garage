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
  brandId: string;
  modelId: string;
  purchaseDate?: string;
  engineNumber?: string;
  vinNumber?: string;
  insuranceProvider?: string;
  insurerGstin?: string;
  insurerAddress?: string;
  policyNumber?: string;
  insuranceExpiry?: string;
  customerId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
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

const DEFAULT_BRANDS: VehicleBrand[] = [
  { id: "b1", name: "AMW" },
  { id: "b2", name: "Ashok Leyland" },
  { id: "b3", name: "Aston Martin" },
  { id: "b4", name: "Atul" },
  { id: "b5", name: "Audi" },
  { id: "b6", name: "Bajaj" },
  { id: "b7", name: "BENTLEY" },
  { id: "b8", name: "Bharat Benz" },
  { id: "b9", name: "BMW" },
  { id: "b10", name: "BYD" },
  { id: "b11", name: "Chevrolet" },
  { id: "b12", name: "Citroen" },
  { id: "b13", name: "Datsun" },
  { id: "b14", name: "Eicher" },
  { id: "b15", name: "Ferrari" },
  { id: "b16", name: "Fiat" },
  { id: "b17", name: "Force" },
  { id: "b18", name: "Ford" },
  { id: "b19", name: "Honda" },
  { id: "b20", name: "Hyundai" },
  { id: "b21", name: "Isuzu" },
  { id: "b22", name: "Jaguar" },
  { id: "b23", name: "Jeep" },
  { id: "b24", name: "Kia" },
  { id: "b25", name: "Lamborghini" },
  { id: "b26", name: "Land Rover" },
  { id: "b27", name: "Lexus" },
  { id: "b28", name: "Mahindra" },
  { id: "b29", name: "Maruti Suzuki" },
  { id: "b30", name: "Maserati" },
  { id: "b31", name: "Mercedes-Benz" },
  { id: "b32", name: "MG" },
  { id: "b33", name: "Mini" },
  { id: "b34", name: "Mitsubishi" },
  { id: "b35", name: "Nissan" },
  { id: "b36", name: "Ola" },
  { id: "b37", name: "Porsche" },
  { id: "b38", name: "Renault" },
  { id: "b39", name: "Rolls-Royce" },
  { id: "b40", name: "Skoda" },
  { id: "b41", name: "Tata" },
  { id: "b42", name: "Toyota" },
  { id: "b43", name: "Volkswagen" },
  { id: "b44", name: "Volvo" },
];

const DEFAULT_MODELS: VehicleModel[] = [
  { id: "m1", brandId: "b1", name: "Counter Sale", fuelType: "Diesel", category: "VAN" },
  { id: "m2", brandId: "b1", name: "Foton Van", fuelType: "Diesel", category: "VAN" },
  { id: "m3", brandId: "b5", name: "A3", fuelType: "Petrol", category: "Sedan" },
  { id: "m4", brandId: "b5", name: "A4", fuelType: "Petrol", category: "Sedan" },
  { id: "m5", brandId: "b5", name: "A6", fuelType: "Petrol", category: "Luxury" },
  { id: "m6", brandId: "b5", name: "Q3", fuelType: "Petrol", category: "SUV" },
  { id: "m7", brandId: "b5", name: "Q5", fuelType: "Diesel", category: "SUV" },
  { id: "m8", brandId: "b5", name: "Q7", fuelType: "Diesel", category: "SUV" },
  { id: "m9", brandId: "b9", name: "3 Series", fuelType: "Petrol", category: "Luxury" },
  { id: "m10", brandId: "b9", name: "5 Series", fuelType: "Diesel", category: "Luxury" },
  { id: "m11", brandId: "b9", name: "X1", fuelType: "Petrol", category: "SUV" },
  { id: "m12", brandId: "b9", name: "X3", fuelType: "Diesel", category: "SUV" },
  { id: "m13", brandId: "b19", name: "City", fuelType: "Petrol", category: "Sedan" },
  { id: "m14", brandId: "b19", name: "Amaze", fuelType: "Petrol", category: "Sedan" },
  { id: "m15", brandId: "b19", name: "WR-V", fuelType: "Petrol", category: "SUV" },
  { id: "m16", brandId: "b19", name: "Elevate", fuelType: "Petrol", category: "SUV" },
  { id: "m17", brandId: "b20", name: "i10", fuelType: "Petrol", category: "Hatchback" },
  { id: "m18", brandId: "b20", name: "i20", fuelType: "Petrol", category: "Hatchback" },
  { id: "m19", brandId: "b20", name: "Venue", fuelType: "Petrol", category: "SUV" },
  { id: "m20", brandId: "b20", name: "Creta", fuelType: "Diesel", category: "SUV" },
  { id: "m21", brandId: "b20", name: "Verna", fuelType: "Petrol", category: "Sedan" },
  { id: "m22", brandId: "b20", name: "Tucson", fuelType: "Diesel", category: "SUV" },
  { id: "m23", brandId: "b24", name: "Seltos", fuelType: "Petrol", category: "SUV" },
  { id: "m24", brandId: "b24", name: "Sonet", fuelType: "Diesel", category: "SUV" },
  { id: "m25", brandId: "b24", name: "Carens", fuelType: "Petrol", category: "SUV" },
  { id: "m26", brandId: "b28", name: "Thar", fuelType: "Diesel", category: "SUV" },
  { id: "m27", brandId: "b28", name: "XUV700", fuelType: "Diesel", category: "SUV" },
  { id: "m28", brandId: "b28", name: "Scorpio", fuelType: "Diesel", category: "SUV" },
  { id: "m29", brandId: "b29", name: "Swift", fuelType: "Petrol", category: "Hatchback" },
  { id: "m30", brandId: "b29", name: "Baleno", fuelType: "Petrol", category: "Hatchback" },
  { id: "m31", brandId: "b29", name: "Dzire", fuelType: "Petrol", category: "Sedan" },
  { id: "m32", brandId: "b29", name: "Brezza", fuelType: "Petrol", category: "SUV" },
  { id: "m33", brandId: "b29", name: "Ertiga", fuelType: "CNG", category: "VAN" },
  { id: "m34", brandId: "b31", name: "C-Class", fuelType: "Petrol", category: "Luxury" },
  { id: "m35", brandId: "b31", name: "E-Class", fuelType: "Diesel", category: "Luxury" },
  { id: "m36", brandId: "b31", name: "GLC", fuelType: "Diesel", category: "SUV" },
  { id: "m37", brandId: "b32", name: "Hector", fuelType: "Petrol", category: "SUV" },
  { id: "m38", brandId: "b32", name: "Astor", fuelType: "Petrol", category: "SUV" },
  { id: "m39", brandId: "b41", name: "Nexon", fuelType: "Petrol", category: "SUV" },
  { id: "m40", brandId: "b41", name: "Punch", fuelType: "Petrol", category: "SUV" },
  { id: "m41", brandId: "b41", name: "Harrier", fuelType: "Diesel", category: "SUV" },
  { id: "m42", brandId: "b41", name: "Safari", fuelType: "Diesel", category: "SUV" },
  { id: "m43", brandId: "b41", name: "Nexon EV", fuelType: "ELECTRIC", category: "SUV" },
  { id: "m44", brandId: "b42", name: "Innova", fuelType: "Diesel", category: "VAN" },
  { id: "m45", brandId: "b42", name: "Fortuner", fuelType: "Diesel", category: "SUV" },
  { id: "m46", brandId: "b42", name: "Glanza", fuelType: "Petrol", category: "Hatchback" },
  { id: "m47", brandId: "b43", name: "Polo", fuelType: "Petrol", category: "Hatchback" },
  { id: "m48", brandId: "b43", name: "Virtus", fuelType: "Petrol", category: "Sedan" },
  { id: "m49", brandId: "b43", name: "Taigun", fuelType: "Petrol", category: "SUV" },
];

const BRANDS_KEY = "garrage_brands";
const MODELS_KEY = "garrage_models";
const VEHICLES_KEY = "garrage_vehicles";
const CUSTOMERS_KEY = "garrage_customers";

function loadFromStorage<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaults;
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Brands
export function getBrands(): VehicleBrand[] {
  return loadFromStorage(BRANDS_KEY, DEFAULT_BRANDS);
}

// Models
export function getModels(): VehicleModel[] {
  return loadFromStorage(MODELS_KEY, DEFAULT_MODELS);
}

export function getModelsByBrand(brandId: string): VehicleModel[] {
  return getModels().filter((m) => m.brandId === brandId);
}

export function addModel(model: Omit<VehicleModel, "id">): VehicleModel {
  const models = getModels();
  const newModel: VehicleModel = {
    ...model,
    id: `m_${Date.now()}`,
  };
  models.push(newModel);
  saveToStorage(MODELS_KEY, models);
  return newModel;
}

// Vehicles
export function getVehicles(): Vehicle[] {
  return loadFromStorage(VEHICLES_KEY, []);
}

export function findVehicleByRegNumber(regNumber: string): Vehicle | undefined {
  return getVehicles().find(
    (v) =>
      v.registrationNumber.replace(/\s/g, "").toLowerCase() ===
      regNumber.replace(/\s/g, "").toLowerCase()
  );
}

export function addVehicle(vehicle: Omit<Vehicle, "id">): Vehicle {
  const vehicles = getVehicles();
  const newVehicle: Vehicle = {
    ...vehicle,
    id: `v_${Date.now()}`,
  };
  vehicles.push(newVehicle);
  saveToStorage(VEHICLES_KEY, vehicles);
  return newVehicle;
}

// Customers
export function getCustomers(): Customer[] {
  return loadFromStorage(CUSTOMERS_KEY, []);
}

export function addCustomer(customer: Omit<Customer, "id">): Customer {
  const customers = getCustomers();
  const newCustomer: Customer = {
    ...customer,
    id: `c_${Date.now()}`,
  };
  customers.push(newCustomer);
  saveToStorage(CUSTOMERS_KEY, customers);
  return newCustomer;
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find((c) => c.id === id);
}

export function getBrandById(id: string): VehicleBrand | undefined {
  return getBrands().find((b) => b.id === id);
}

export function getModelById(id: string): VehicleModel | undefined {
  return getModels().find((m) => m.id === id);
}

// Vendors
export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  referenceId?: string;
  brands: string[]; // brand names they deal with
}

const VENDORS_KEY = "garrage_vendors";

export function getVendors(): Vendor[] {
  return loadFromStorage(VENDORS_KEY, []);
}

export function addVendor(vendor: Omit<Vendor, "id">): Vendor {
  const vendors = getVendors();
  const newVendor: Vendor = {
    ...vendor,
    id: `vn_${Date.now()}`,
  };
  vendors.push(newVendor);
  saveToStorage(VENDORS_KEY, vendors);
  return newVendor;
}

export function getVendorById(id: string): Vendor | undefined {
  return getVendors().find((v) => v.id === id);
}

// Get vehicles by customer
export function getVehiclesByCustomer(customerId: string): Vehicle[] {
  return getVehicles().filter((v) => v.customerId === customerId);
}
