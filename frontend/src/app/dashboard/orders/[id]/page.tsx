"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getOrderById, updateOrder, uploadOrderImages,
  getImageUrl, deleteOrderImage, saveEstimate, sendEstimate, resendEstimate,
  getEstimateLink, getIndianStates, assignService, markPaymentDue,
  type Order, type OrderLineItem, type OrderStatus,
} from "@/lib/api-orders";
import { getStaffMembers, getAssignableRoles, type StaffMember, type AssignableRole } from "@/lib/api-staff";
import { getInvoiceByOrderId, type Invoice } from "@/lib/api-invoices";
import { getPackages, type ServicePackage } from "@/lib/api-packages";
import { getGarageServices, createGarageService, type GarageService } from "@/lib/api-garage-services";
import { getServiceCategories, createServiceCategory, type ServiceCategory } from "@/lib/api-service-categories";
import { getTaxProfiles, createTaxProfile, type TaxProfile } from "@/lib/api-tax-profiles";
import { getParts, addPart, type Part } from "@/lib/api-inventory";
import { getManufacturers, createManufacturer, type Manufacturer } from "@/lib/api-manufacturers";
import { getPartCategories, createPartCategory, type PartCategoryItem } from "@/lib/api-part-categories";
import { getBrands, getModelsByBrand, getCustomerById, type VehicleBrand, type VehicleModel, type Customer } from "@/lib/api-vehicles";
import { isGarageOwner, isGarageStaff, getAccessToken, getUser, canView, canManage, canViewFinancial } from "@/lib/auth";
import {
  getDepartments,
  getServiceDepartment,
  getPartDepartment,
  getBillingMode,
  setBillingMode as setStoredBillingMode,
  getLineItemDepartment,
  setLineItemDepartment,
  getAllLineItemDepartments,
  type Department,
  type DeptMapping,
} from "@/lib/departments-local";
import {
  ArrowLeft, Phone, Car, IndianRupee, Camera, Upload,
  CheckCircle2, CircleDot, Loader2, Trash2, Plus,
  Send, Link2, Copy, X, Fuel, Gauge, StickyNote,
  Wrench, Package, ChevronDown, ExternalLink, AlertCircle, Search, Check, Clock, UserPlus, Download, FileText, Share2, Layers, Eye, Mail, MapPin, Building2,
} from "lucide-react";

// ─── Status Config ───

type StatusConfig = { label: string; color: string; bgColor: string };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  open: { label: "Open", color: "text-primary", bgColor: "bg-primary" },
  wip: { label: "WIP", color: "text-warn", bgColor: "bg-warn" },
  payment_due: { label: "Payment Due", color: "text-orange-600", bgColor: "bg-orange-500" },
  completed: { label: "Completed", color: "text-ok", bgColor: "bg-ok" },
  cancelled: { label: "Cancelled", color: "text-bad", bgColor: "bg-bad" },
};

// ─── Row types (same as invoice) ───

interface ServiceRow {
  key: string; serviceId: string; description: string; hsnSac: string;
  qty: number; rate: number; gstRate: number; discount: number; gstInclusive: boolean;
}
interface PartRow {
  key: string; partId: string; description: string; hsnSac: string;
  qty: number; rate: number; gstRate: number; discount: number; gstInclusive: boolean;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function calcRow(qty: number, rate: number, discount: number, gstRate: number, gstInclusive: boolean) {
  const lineAmount = qty * rate;
  const discAmount = lineAmount * discount / 100;
  const afterDisc = lineAmount - discAmount;
  if (gstInclusive) {
    const base = afterDisc / (1 + gstRate / 100);
    const gst = afterDisc - base;
    return { amount: Math.round(base * 100) / 100, gstAmount: Math.round(gst * 100) / 100, total: afterDisc };
  }
  const gst = afterDisc * gstRate / 100;
  return { amount: Math.round(afterDisc * 100) / 100, gstAmount: Math.round(gst * 100) / 100, total: Math.round((afterDisc + gst) * 100) / 100 };
}

// ─── Create form types ───
interface CreateServiceForm {
  name: string; price: string; serviceNumber: string; categoryId: string; categoryName: string;
  isGeneric: boolean; selectedBrands: { id: string; name: string }[];
  selectedModels: { brandId: string; modelId: string; modelName: string }[];
  hasGst: boolean; taxProfileId: string; sacNumber: string; gstRate: string;
}
const emptyServiceForm: CreateServiceForm = {
  name: "", price: "", serviceNumber: "", categoryId: "", categoryName: "",
  isGeneric: true, selectedBrands: [], selectedModels: [],
  hasGst: false, taxProfileId: "", sacNumber: "", gstRate: "",
};

interface CreatePartForm {
  name: string; partNumber: string; mrp: string; sellingPrice: string; purchasePrice: string;
  manufacturerId: string; manufacturerName: string; categoryId: string; categoryName: string;
  taxProfileId: string; hsnCode: string; gstRate: string;
  isGeneric: boolean; selectedBrands: { id: string; name: string }[];
  selectedModels: { brandId: string; modelId: string; modelName: string }[];
  manualInventory: boolean; stockQty: string; minStockQty: string; rackNumber: string; unit: string;
}
const emptyPartForm: CreatePartForm = {
  name: "", partNumber: "", mrp: "", sellingPrice: "", purchasePrice: "",
  manufacturerId: "", manufacturerName: "", categoryId: "", categoryName: "",
  taxProfileId: "", hsnCode: "", gstRate: "",
  isGeneric: true, selectedBrands: [], selectedModels: [],
  manualInventory: false, stockQty: "", minStockQty: "", rackNumber: "", unit: "pcs",
};

const inputCls = "w-full px-3 py-2 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background";
const labelCls = "block text-xs font-medium text-secondary mb-1";
const smallInputCls = "w-full px-2 py-1.5 border border-edge rounded text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary bg-background";

// ─── Order Journey Step Bar ───

const JOURNEY_STEPS = [
  { key: "open", label: "Created" },
  { key: "wip", label: "In Progress" },
  { key: "payment_due", label: "Payment Due" },
  { key: "completed", label: "Payment Done" },
] as const;

function OrderJourney({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="bg-background rounded-xl border border-edge px-5 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-bad flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-bad">Order Cancelled</span>
      </div>
    );
  }

  const statusOrder = ["open", "wip", "payment_due", "completed"];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="bg-background rounded-xl border border-edge px-5 py-4">
      <div className="flex items-center">
        {JOURNEY_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx || status === "completed";
          const isCurrent = idx === currentIdx;
          const isLast = idx === JOURNEY_STEPS.length - 1;

          return (
            <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
              {/* Circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                    isDone
                      ? "bg-ok border-ok text-white"
                      : isCurrent
                        ? "bg-primary border-primary text-white"
                        : "bg-background border-edge text-muted"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1.5 text-center font-medium whitespace-nowrap ${
                    isDone
                      ? "text-ok"
                      : isCurrent
                        ? "text-primary"
                        : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-18px] ${
                    idx < currentIdx ? "bg-ok" : "bg-edge"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Estimate controls
  const [estimateType, setEstimateType] = useState("gst");
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [estimateLink, setEstimateLink] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [posOpen, setPosOpen] = useState(false);
  const [posFilter, setPosFilter] = useState("");

  // Services state
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([]);
  const [allServices, setAllServices] = useState<GarageService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceTaxProfiles, setServiceTaxProfiles] = useState<TaxProfile[]>([]);
  const [chooseServicesOpen, setChooseServicesOpen] = useState(false);
  const [chooseServicesFilter, setChooseServicesFilter] = useState("");
  const [chooseServicesSelected, setChooseServicesSelected] = useState<Set<string>>(new Set());
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [svcForm, setSvcForm] = useState<CreateServiceForm>(emptyServiceForm);
  const [svcSaving, setSvcSaving] = useState(false);
  const [svcCategoryPickerOpen, setSvcCategoryPickerOpen] = useState(false);
  const [svcCategoryPickerFilter, setSvcCategoryPickerFilter] = useState("");
  const [svcCategoryCreating, setSvcCategoryCreating] = useState(false);
  const [svcCategoryNewName, setSvcCategoryNewName] = useState("");
  const [svcTaxPickerOpen, setSvcTaxPickerOpen] = useState(false);
  const [svcTaxPickerFilter, setSvcTaxPickerFilter] = useState("");
  const [gstDropdownKey, setGstDropdownKey] = useState<string | null>(null);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, VehicleModel[]>>({});
  const [svcBrandPickerOpen, setSvcBrandPickerOpen] = useState(false);
  const [svcModelPickerBrandId, setSvcModelPickerBrandId] = useState<string | null>(null);

  // Parts state
  const [partRows, setPartRows] = useState<PartRow[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [partCategories, setPartCategories] = useState<PartCategoryItem[]>([]);
  const [goodsTaxProfiles, setGoodsTaxProfiles] = useState<TaxProfile[]>([]);
  const [choosePartsOpen, setChoosePartsOpen] = useState(false);
  const [choosePartsFilter, setChoosePartsFilter] = useState("");
  const [choosePartsSelected, setChoosePartsSelected] = useState<Set<string>>(new Set());
  const [createPartOpen, setCreatePartOpen] = useState(false);
  const [partForm, setPartForm] = useState<CreatePartForm>(emptyPartForm);
  const [partSaving, setPartSaving] = useState(false);
  const [partGstDropdownKey, setPartGstDropdownKey] = useState<string | null>(null);
  const [partMfgPickerOpen, setPartMfgPickerOpen] = useState(false);
  const [partMfgPickerFilter, setPartMfgPickerFilter] = useState("");
  const [partMfgCreating, setPartMfgCreating] = useState(false);
  const [partMfgNewName, setPartMfgNewName] = useState("");
  const [partCatPickerOpen, setPartCatPickerOpen] = useState(false);
  const [partCatPickerFilter, setPartCatPickerFilter] = useState("");
  const [partCatCreating, setPartCatCreating] = useState(false);
  const [partCatNewName, setPartCatNewName] = useState("");
  const [partTaxPickerOpen, setPartTaxPickerOpen] = useState(false);
  const [partTaxPickerFilter, setPartTaxPickerFilter] = useState("");
  const [partModelsByBrand, setPartModelsByBrand] = useState<Record<string, VehicleModel[]>>({});
  const [partBrandPickerOpen, setPartBrandPickerOpen] = useState(false);
  const [partModelPickerBrandId, setPartModelPickerBrandId] = useState<string | null>(null);

  // Shared modals
  const [createTaxOpen, setCreateTaxOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: "", taxPercent: "", sacNumber: "", taxType: "service" as "service" | "goods" });
  const [taxSaving, setTaxSaving] = useState(false);

  // Packages
  const [packages, setPackages] = useState<ServicePackage[]>([]);

  // Staff assignment
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignableRoles, setAssignableRoles] = useState<AssignableRole[]>([]);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [staffDropdownOpen, setStaffDropdownOpen] = useState<string | null>(null);
  const [assignConfirm, setAssignConfirm] = useState<{ lineItemId: string; serviceName: string; staff: StaffMember } | null>(null);
  const [assignRoleFilter, setAssignRoleFilter] = useState<string>("all");

  // Customer
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Invoice
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Department billing
  const user = getUser();
  const garageId = user?.garageId || "";
  const [billingMode, setBillingModeState] = useState<"standard" | "department">("standard");
  const [deptList, setDeptList] = useState<Department[]>([]);
  const [lineItemDepts, setLineItemDepts] = useState<Record<string, DeptMapping>>({});

  // Image upload
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load order ───
  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOrderById(id);
      setOrder(data);
      setEstimateType(data.estimateType || "gst");
      setPlaceOfSupply(data.placeOfSupply || "");
      setDeliveryDate(data.estimatedDeliveryDate || "");
      // Convert existing lineItems → service/part rows
      const sRows: ServiceRow[] = [];
      const pRows: PartRow[] = [];
      (data.lineItems || []).forEach((li) => {
        if (li.itemType === "part") {
          pRows.push({ key: li.id || uid(), partId: li.partId || "", description: li.description, hsnSac: li.hsnSac || "", qty: li.qty, rate: li.rate, gstRate: li.gstRate, discount: li.discountPercent, gstInclusive: false });
        } else {
          sRows.push({ key: li.id || uid(), serviceId: li.serviceId || "", description: li.description, hsnSac: li.hsnSac || "", qty: li.qty, rate: li.rate, gstRate: li.gstRate, discount: li.discountPercent, gstInclusive: false });
        }
      });
      setServiceRows(sRows);
      setPartRows(pRows);
    } catch {
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadOrder(); }, [loadOrder]);
  useEffect(() => { if (id) getInvoiceByOrderId(id).then(setInvoice).catch(() => {}); }, [id]);

  // Load full customer details
  useEffect(() => {
    if (order?.customerId) {
      getCustomerById(order.customerId).then((c) => { if (c) setCustomer(c); }).catch(() => {});
    }
  }, [order?.customerId]);

  // Load department data
  useEffect(() => {
    if (garageId) setDeptList(getDepartments(garageId));
    if (id) {
      setBillingModeState(getBillingMode(id));
      setLineItemDepts(getAllLineItemDepartments(id));
    }
  }, [garageId, id]);

  useEffect(() => {
    getPackages().then(setPackages).catch(() => {});
    getIndianStates().then(setStates).catch(() => {});
    getGarageServices().then(setAllServices).catch(() => {});
    getServiceCategories().then(setCategories).catch(() => {});
    getTaxProfiles("service").then(setServiceTaxProfiles).catch(() => {});
    getTaxProfiles("goods").then(setGoodsTaxProfiles).catch(() => {});
    getBrands().then(setBrands).catch(() => {});
    getParts().then(setAllParts).catch(() => {});
    getManufacturers().then(setManufacturers).catch(() => {});
    getPartCategories().then(setPartCategories).catch(() => {});
    getStaffMembers().then(setStaffMembers).catch(() => {});
    getAssignableRoles().then(setAssignableRoles).catch(() => {});
  }, []);

  useEffect(() => {
    svcForm.selectedBrands.forEach(b => {
      if (!modelsByBrand[b.id]) {
        getModelsByBrand(b.id).then(models => setModelsByBrand(prev => ({ ...prev, [b.id]: models }))).catch(() => {});
      }
    });
  }, [svcForm.selectedBrands, modelsByBrand]);

  useEffect(() => {
    partForm.selectedBrands.forEach(b => {
      if (!partModelsByBrand[b.id]) {
        getModelsByBrand(b.id).then(models => setPartModelsByBrand(prev => ({ ...prev, [b.id]: models }))).catch(() => {});
      }
    });
  }, [partForm.selectedBrands, partModelsByBrand]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  }

  // Close staff dropdown on outside click
  useEffect(() => {
    if (!staffDropdownOpen) return;
    const handle = () => setStaffDropdownOpen(null);
    const timer = setTimeout(() => document.addEventListener("click", handle), 0);
    return () => { clearTimeout(timer); document.removeEventListener("click", handle); };
  }, [staffDropdownOpen]);

  // ─── Image handling ───
  async function handleImageUpload(files: FileList | null) {
    if (!files || files.length === 0 || !order) return;
    setUploading(true);
    try {
      await uploadOrderImages(order.id, Array.from(files));
      const updated = await getOrderById(order.id);
      setOrder(updated);
      showSuccess("Images uploaded");
    } catch { /* ignore */ }
    finally { setUploading(false); }
  }

  async function handleDeleteImage(fileId: string) {
    if (!order) return;
    try {
      await deleteOrderImage(order.id, fileId);
      const updated = await getOrderById(order.id);
      setOrder(updated);
    } catch { /* ignore */ }
  }

  // ─── Service row handlers ───
  const updateServiceRow = useCallback((key: string, field: keyof ServiceRow, value: string | number | boolean) => {
    setServiceRows(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s));
  }, []);

  function handleAddSelectedServices() {
    const newRows: ServiceRow[] = [];
    chooseServicesSelected.forEach(svcId => {
      const svc = allServices.find(s => s.id === svcId);
      if (svc && !serviceRows.some(r => r.serviceId === svc.id)) {
        newRows.push({ key: uid(), serviceId: svc.id, description: svc.name, hsnSac: svc.sacNumber || "", qty: 1, rate: svc.price, gstRate: svc.hasGst ? svc.gstRate : 0, discount: 0, gstInclusive: false });
      }
    });
    setServiceRows(prev => [...prev, ...newRows]);
    setChooseServicesSelected(new Set());
    setChooseServicesOpen(false);
  }

  async function handleCreateService() {
    if (!svcForm.name.trim() || !svcForm.price) return;
    setSvcSaving(true);
    try {
      const newSvc = await createGarageService({
        name: svcForm.name.trim(), price: parseFloat(svcForm.price) || 0,
        serviceNumber: svcForm.serviceNumber.trim() || undefined,
        categoryId: svcForm.categoryId || undefined, categoryName: svcForm.categoryName || undefined,
        isGeneric: svcForm.isGeneric,
        applicableBrands: svcForm.isGeneric ? undefined : svcForm.selectedBrands.map(b => ({
          brandId: b.id, brandName: b.name,
          modelIds: svcForm.selectedModels.filter(m => m.brandId === b.id).map(m => m.modelId),
          modelNames: svcForm.selectedModels.filter(m => m.brandId === b.id).map(m => m.modelName),
        })),
        hasGst: svcForm.hasGst,
        taxProfileId: svcForm.hasGst ? svcForm.taxProfileId || undefined : undefined,
        sacNumber: svcForm.hasGst ? svcForm.sacNumber || undefined : undefined,
        gstRate: svcForm.hasGst ? parseFloat(svcForm.gstRate) || 0 : 0,
      });
      setAllServices(prev => [...prev, newSvc]);
      setServiceRows(prev => [...prev, { key: uid(), serviceId: newSvc.id, description: newSvc.name, hsnSac: newSvc.sacNumber || "", qty: 1, rate: newSvc.price, gstRate: newSvc.hasGst ? newSvc.gstRate : 0, discount: 0, gstInclusive: false }]);
      setCreateServiceOpen(false); setChooseServicesOpen(false); setSvcForm(emptyServiceForm);
    } catch { /* ignore */ } finally { setSvcSaving(false); }
  }

  async function handleCreateServiceCategory() {
    if (!svcCategoryNewName.trim()) return;
    setSvcCategoryCreating(true);
    try {
      const cat = await createServiceCategory(svcCategoryNewName.trim());
      setCategories(prev => [...prev, cat]);
      setSvcForm(prev => ({ ...prev, categoryId: cat.id, categoryName: cat.name }));
      setSvcCategoryPickerOpen(false); setSvcCategoryNewName("");
    } catch { /* ignore */ } finally { setSvcCategoryCreating(false); }
  }

  // ─── Part row handlers ───
  const updatePartRow = useCallback((key: string, field: keyof PartRow, value: string | number | boolean) => {
    setPartRows(prev => prev.map(p => p.key === key ? { ...p, [field]: value } : p));
  }, []);

  function handleAddSelectedParts() {
    const newRows: PartRow[] = [];
    choosePartsSelected.forEach(partId => {
      const part = allParts.find(p => p.id === partId);
      if (part && !partRows.some(r => r.partId === part.id)) {
        newRows.push({ key: uid(), partId: part.id, description: part.name, hsnSac: part.hsnCode || "", qty: 1, rate: part.sellingPrice, gstRate: part.gstRate || 0, discount: 0, gstInclusive: false });
      }
    });
    setPartRows(prev => [...prev, ...newRows]);
    setChoosePartsSelected(new Set());
    setChoosePartsOpen(false);
  }

  async function handleCreatePart() {
    if (!partForm.name.trim() || !partForm.sellingPrice) return;
    setPartSaving(true);
    try {
      const newPart = await addPart({
        name: partForm.name.trim(), partNumber: partForm.partNumber.trim(),
        brand: partForm.manufacturerName || "", category: partForm.categoryName || "",
        categoryId: partForm.categoryId || undefined, manufacturerId: partForm.manufacturerId || undefined,
        manufacturerName: partForm.manufacturerName || undefined, taxProfileId: partForm.taxProfileId || undefined,
        mrp: parseFloat(partForm.mrp) || 0, sellingPrice: parseFloat(partForm.sellingPrice) || 0,
        purchasePrice: parseFloat(partForm.purchasePrice) || 0,
        stockQty: partForm.manualInventory ? (parseInt(partForm.stockQty) || 0) : 0,
        minStockQty: partForm.manualInventory ? (parseInt(partForm.minStockQty) || 0) : 0,
        rackNumber: partForm.manualInventory ? partForm.rackNumber.trim() : "",
        hsnCode: partForm.hsnCode.trim(), gstRate: parseFloat(partForm.gstRate) || 0,
        unit: partForm.manualInventory ? partForm.unit.trim() || "pcs" : "pcs",
        isGeneric: partForm.isGeneric,
        applicableBrands: partForm.isGeneric ? undefined : partForm.selectedBrands.map(b => ({
          brandId: b.id, brandName: b.name,
          modelIds: partForm.selectedModels.filter(m => m.brandId === b.id).map(m => m.modelId),
          modelNames: partForm.selectedModels.filter(m => m.brandId === b.id).map(m => m.modelName),
        })),
      });
      setAllParts(prev => [...prev, newPart]);
      setPartRows(prev => [...prev, { key: uid(), partId: newPart.id, description: newPart.name, hsnSac: newPart.hsnCode || "", qty: 1, rate: newPart.sellingPrice, gstRate: newPart.gstRate || 0, discount: 0, gstInclusive: false }]);
      setCreatePartOpen(false); setChoosePartsOpen(false); setPartForm(emptyPartForm);
    } catch { /* ignore */ } finally { setPartSaving(false); }
  }

  async function handleCreateManufacturer() {
    if (!partMfgNewName.trim()) return;
    setPartMfgCreating(true);
    try {
      const mfg = await createManufacturer(partMfgNewName.trim());
      setManufacturers(prev => [...prev, mfg]);
      setPartForm(prev => ({ ...prev, manufacturerId: mfg.id, manufacturerName: mfg.name }));
      setPartMfgPickerOpen(false); setPartMfgNewName("");
    } catch { /* ignore */ } finally { setPartMfgCreating(false); }
  }

  async function handleCreatePartCategory() {
    if (!partCatNewName.trim()) return;
    setPartCatCreating(true);
    try {
      const cat = await createPartCategory(partCatNewName.trim());
      setPartCategories(prev => [...prev, cat]);
      setPartForm(prev => ({ ...prev, categoryId: cat.id, categoryName: cat.name }));
      setPartCatPickerOpen(false); setPartCatNewName("");
    } catch { /* ignore */ } finally { setPartCatCreating(false); }
  }

  async function handleCreateTaxProfile() {
    if (!taxForm.name.trim() || !taxForm.taxPercent) return;
    setTaxSaving(true);
    try {
      const profile = await createTaxProfile({ name: taxForm.name.trim(), taxPercent: parseFloat(taxForm.taxPercent) || 0, sacNumber: taxForm.sacNumber.trim() || undefined, taxType: taxForm.taxType });
      if (taxForm.taxType === "service") {
        setServiceTaxProfiles(prev => [...prev, profile]);
        setSvcForm(prev => ({ ...prev, taxProfileId: profile.id, sacNumber: profile.sacNumber || prev.sacNumber, gstRate: String(profile.taxPercent) }));
      } else {
        setGoodsTaxProfiles(prev => [...prev, profile]);
        setPartForm(prev => ({ ...prev, taxProfileId: profile.id, hsnCode: profile.sacNumber || prev.hsnCode, gstRate: String(profile.taxPercent) }));
      }
      setCreateTaxOpen(false); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "service" });
    } catch { /* ignore */ } finally { setTaxSaving(false); }
  }

  // ─── Department helpers ───
  function handleToggleBillingMode(mode: "standard" | "department") {
    setBillingModeState(mode);
    if (id) setStoredBillingMode(id, mode);
  }

  function resolveDept(key: string, itemType: "service" | "part", itemId: string): DeptMapping | null {
    // 1. Check per-line-item override
    const override = lineItemDepts[key];
    if (override) return override;
    // 2. Check master data default
    if (!garageId) return null;
    if (itemType === "service") return getServiceDepartment(garageId, itemId);
    return getPartDepartment(garageId, itemId);
  }

  function handleLineItemDeptChange(key: string, deptId: string) {
    if (!id) return;
    const dept = deptList.find((d) => d.id === deptId);
    if (dept) {
      setLineItemDepartment(id, key, dept.id, dept.name);
    }
    setLineItemDepts(getAllLineItemDepartments(id));
  }

  // ─── Calculations ───
  const serviceCalcs = serviceRows.map(s => calcRow(s.qty, s.rate, s.discount, s.gstRate, s.gstInclusive));
  const serviceSubtotal = serviceCalcs.reduce((sum, c) => sum + c.amount, 0);
  const serviceGstTotal = serviceCalcs.reduce((sum, c) => sum + c.gstAmount, 0);
  const partCalcs = partRows.map(p => calcRow(p.qty, p.rate, p.discount, p.gstRate, p.gstInclusive));
  const partSubtotal = partCalcs.reduce((sum, c) => sum + c.amount, 0);
  const partGstTotal = partCalcs.reduce((sum, c) => sum + c.gstAmount, 0);
  const isProforma = estimateType === "proforma";
  const grandTotal = Math.round((serviceSubtotal + (isProforma ? 0 : serviceGstTotal) + partSubtotal + (isProforma ? 0 : partGstTotal)) * 100) / 100;

  // ─── Save & Send ───
  async function handleSave() {
    if (!order) return;
    setSaving(true);
    try {
      const lineItems: OrderLineItem[] = [
        ...serviceRows.map((s, i) => ({ id: s.key, itemType: "service" as const, serviceId: s.serviceId, description: s.description, hsnSac: s.hsnSac, qty: s.qty, rate: s.rate, discountPercent: s.discount, amount: serviceCalcs[i].amount, gstRate: s.gstRate, gstAmount: isProforma ? 0 : serviceCalcs[i].gstAmount })),
        ...partRows.map((p, i) => ({ id: p.key, itemType: "part" as const, partId: p.partId, description: p.description, hsnSac: p.hsnSac, qty: p.qty, rate: p.rate, discountPercent: p.discount, amount: partCalcs[i].amount, gstRate: p.gstRate, gstAmount: isProforma ? 0 : partCalcs[i].gstAmount })),
      ];
      const subtotal = serviceSubtotal + partSubtotal;
      const totalGst = isProforma ? 0 : serviceGstTotal + partGstTotal;
      const updated = await saveEstimate(order.id, {
        lineItems, estimateType, placeOfSupply, estimatedDeliveryDate: deliveryDate,
        subtotal, discountAmount: 0, cgstAmount: isProforma ? 0 : totalGst / 2,
        sgstAmount: isProforma ? 0 : totalGst / 2, igstAmount: 0, totalGst, grandTotal,
      });
      setOrder(updated);
      showSuccess("Estimate saved");
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleSendForApproval() {
    if (!order) return;
    setSending(true);
    try {
      await handleSave();
      const updated = await sendEstimate(order.id);
      setOrder(updated);
      const link = await getEstimateLink(order.id);
      setEstimateLink(`${window.location.origin}/estimate/${link}`);
      showSuccess("Estimate sent for approval");
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  function handleApplyPackage(pkg: ServicePackage) {
    const newSvcRows: ServiceRow[] = (pkg.serviceItems || []).map(si => ({
      key: uid(), serviceId: si.serviceId, description: si.serviceName,
      hsnSac: si.hsnSac || "", qty: si.defaultQty, rate: si.defaultRate,
      gstRate: si.gstRate || 0, discount: 0, gstInclusive: false,
    }));
    const newPartRows: PartRow[] = (pkg.partItems || []).map(pi => ({
      key: uid(), partId: pi.partId, description: pi.partName,
      hsnSac: pi.hsnSac || "", qty: pi.defaultQty, rate: pi.defaultRate,
      gstRate: pi.gstRate || 0, discount: 0, gstInclusive: false,
    }));
    setServiceRows(prev => [...prev, ...newSvcRows]);
    setPartRows(prev => [...prev, ...newPartRows]);
    showSuccess(`Package "${pkg.name}" applied`);
  }

  async function handleCopyLink() {
    let link = estimateLink;
    if (!link && order?.estimateToken) {
      link = `${window.location.origin}/estimate/${order.estimateToken}`;
    }
    if (link) { await navigator.clipboard.writeText(link); showSuccess("Link copied"); }
  }

  async function handleAssignService(lineItemId: string, staff: StaffMember) {
    if (!order) return;
    setAssigning(lineItemId);
    setStaffDropdownOpen(null);
    try {
      const updated = await assignService(order.id, lineItemId, staff.id, staff.name);
      setOrder(updated);
      showSuccess(`Assigned to ${staff.name}`);
    } catch { /* ignore */ }
    finally { setAssigning(null); }
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await updateOrder(order.id, { status: newStatus });
      setOrder(updated);
      showSuccess(`Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    } catch { /* ignore */ }
    finally { setUpdating(false); }
  }

  const filteredPosStates = states.filter(s => s.toLowerCase().includes(posFilter.toLowerCase()));

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-sm text-bad">{error || "Order not found"}</p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.open;
  const manage = canManage("ORDERS");
  const canEdit = (order.status === "open" || order.status === "cancelled") && manage;
  const hasItems = serviceRows.length > 0 || partRows.length > 0;
  const canSend = hasItems && canEdit;
  const isOwner = isGarageOwner();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">{order.jobCard}</h1>
            <p className="text-xs text-muted">{order.customerName} &middot; {order.vehicleNumber}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full text-white ${statusCfg.bgColor}`}>
          {statusCfg.label}
        </span>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="bg-ok-light border-b border-ok/20 px-5 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-ok" />
          <span className="text-sm text-ok font-medium">{successMsg}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* ─── Order Journey Step Bar ─── */}
          <OrderJourney status={order.status} />

          {/* ─── Order Info Card ─── */}
          <div className="bg-background rounded-xl border border-edge p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Customer Details */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Customer</p>
                <p className="text-sm font-semibold text-foreground">{order.customerName}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                    <a href={`tel:${order.phone || order.customerPhone || ""}`} className="text-sm text-secondary hover:text-primary transition-colors">
                      {order.phone || order.customerPhone || "-"}
                    </a>
                  </div>
                  {(customer?.email) && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                      <a href={`mailto:${customer.email}`} className="text-sm text-secondary hover:text-primary transition-colors truncate">
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {(customer?.address) && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                      <span className="text-sm text-secondary">{customer.address}</span>
                    </div>
                  )}
                  {(customer?.gstin) && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="text-xs font-mono text-secondary">{customer.gstin}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted uppercase tracking-wide">Vehicle</p>
                <div className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-muted" />
                  <span className="text-sm font-semibold text-foreground">{order.vehicle || "-"}</span>
                </div>
                <p className="text-sm text-secondary">{order.vehicleNumber || "-"}</p>
              </div>
            </div>

            {/* Odometer & Fuel */}
            {(order.odometerReading || order.fuelLevel) && (
              <div className="flex gap-4 text-xs text-muted mt-4 pt-3 border-t border-edge-light">
                {order.odometerReading && (
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5" /> {order.odometerReading.toLocaleString()} km
                  </span>
                )}
                {order.fuelLevel && (
                  <span className="flex items-center gap-1.5 capitalize">
                    <Fuel className="w-3.5 h-3.5" /> Fuel: {order.fuelLevel.replace("_", " ")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ─── Inspection Images ─── */}
          <div className="bg-background rounded-xl border border-edge p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" /> Inspection Images
                {(order.imageIds || []).length > 0 && <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{(order.imageIds || []).length}</span>}
              </h3>
              {(order.imageIds || []).length > 0 && (order.customerPhone || order.phone) && (
                <button onClick={() => {
                  const phone = (order.customerPhone || order.phone || "").replace(/\D/g, "");
                  const countryPhone = phone.startsWith("91") ? phone : `91${phone}`;
                  const imageLinks = (order.imageIds || []).map(id => getImageUrl(id)).join("\n");
                  const message = `Hi ${order.customerName || ""},\n\nHere are the inspection images for your vehicle (${order.vehicle || ""}) - Job Card: ${order.jobCard || ""}:\n\n${imageLinks}\n\nRegards`;
                  window.open(`https://wa.me/${countryPhone}?text=${encodeURIComponent(message)}`, "_blank");
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {(order.imageIds || []).map((fileId) => {
                const ts = order.imageTimestamps?.[fileId];
                return (
                  <div key={fileId} className="relative group">
                    <div className="w-24 h-24 rounded-lg overflow-hidden border border-edge">
                      <img src={getImageUrl(fileId)} alt="Inspection" className="w-full h-full object-cover" />
                      {canEdit && (
                        <button onClick={() => handleDeleteImage(fileId)}
                          className="absolute top-1 right-1 w-5 h-5 bg-bad/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {ts && (
                      <p className="text-[10px] text-muted text-center mt-1 leading-tight">
                        {new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}{" "}
                        {new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    )}
                  </div>
                );
              })}
              {canEdit && (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-edge hover:border-primary flex flex-col items-center justify-center gap-1 text-muted hover:text-primary transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  <span className="text-[10px]">{uploading ? "..." : "Add"}</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple
              className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
          </div>

          {/* ─── Customer Remarks ─── */}
          <div className="bg-background rounded-xl border border-edge p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <StickyNote className="w-4 h-4 text-primary" /> Customer Remarks
            </h3>
            {(order.customerRemarks || []).length > 0 && (
              <div className="space-y-1.5 mb-3">
                {(order.customerRemarks || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <CircleDot className="w-3 h-3 text-muted shrink-0 mt-1" />
                    <p className="text-sm text-foreground flex-1">{r}</p>
                    {canEdit && (
                      <button onClick={async () => {
                        const updated = (order.customerRemarks || []).filter((_, idx) => idx !== i);
                        try {
                          const result = await updateOrder(order.id, { customerRemarks: updated } as Partial<Order>);
                          setOrder(result);
                        } catch {}
                      }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-bad transition-opacity shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {canEdit && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a remark..."
                  className={inputCls}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                      const val = (e.target as HTMLInputElement).value.trim();
                      const updated = [...(order.customerRemarks || []), val];
                      try {
                        const result = await updateOrder(order.id, { customerRemarks: updated } as Partial<Order>);
                        setOrder(result);
                        (e.target as HTMLInputElement).value = "";
                      } catch {}
                    }
                  }}
                />
                <button onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                  if (input.value.trim()) {
                    const val = input.value.trim();
                    const updated = [...(order.customerRemarks || []), val];
                    updateOrder(order.id, { customerRemarks: updated } as Partial<Order>)
                      .then((result) => { setOrder(result); input.value = ""; })
                      .catch(() => {});
                  }
                }}
                  className="px-3 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            {(order.customerRemarks || []).length === 0 && !canEdit && (
              <p className="text-sm text-muted">No remarks added.</p>
            )}
            {order.inspectionNotes && (
              <div className="mt-3 pt-3 border-t border-edge-light">
                <p className="text-xs font-medium text-muted uppercase mb-1">Notes</p>
                <p className="text-sm text-secondary">{order.inspectionNotes}</p>
              </div>
            )}
          </div>

          {/* ─── Customer Response ─── */}
          {order.customerApproved !== undefined && order.customerApproved !== null && (
            <div className={`rounded-xl border p-5 ${order.customerApproved ? "bg-ok-light border-ok/20" : "bg-bad-light border-bad/20"}`}>
              <div className="flex items-center gap-2 mb-1">
                {order.customerApproved ? <CheckCircle2 className="w-4 h-4 text-ok" /> : <AlertCircle className="w-4 h-4 text-bad" />}
                <span className={`text-sm font-semibold ${order.customerApproved ? "text-ok" : "text-bad"}`}>
                  {order.customerApproved ? "Customer Approved" : "Customer Rejected"}
                </span>
              </div>
              {order.customerRejectionNote && (
                <p className="text-sm text-secondary mt-1">Reason: {order.customerRejectionNote}</p>
              )}
            </div>
          )}

          {/* ─── Estimate Controls ─── */}
          {(canEdit || hasItems) && (
            <div className="bg-background rounded-lg border border-edge p-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className={labelCls}>Estimate Type</label>
                  <div className="flex gap-2">
                    {(["gst", "proforma"] as const).map((t) => (
                      <button key={t} onClick={() => canEdit && setEstimateType(t)}
                        className={`flex-1 py-2 text-sm font-medium rounded-md border capitalize transition-colors ${estimateType === t ? "bg-primary text-white border-primary" : "bg-background text-muted border-edge"} ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                      >{t === "gst" ? "GST" : "Proforma"}</button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <label className={labelCls}>Place of Supply</label>
                  <button onClick={() => canEdit && setPosOpen(!posOpen)} disabled={!canEdit}
                    className={`${inputCls} text-left flex items-center justify-between disabled:opacity-50`}>
                    <span className={placeOfSupply ? "text-foreground" : "text-muted"}>{placeOfSupply || "Select state..."}</span>
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                  {posOpen && canEdit && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-60 flex flex-col">
                      <div className="px-3 py-2 border-b border-edge-light">
                        <input type="text" value={posFilter} onChange={e => setPosFilter(e.target.value)} placeholder="Search state..." autoFocus
                          className="w-full px-2 py-1.5 border border-edge rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {filteredPosStates.map(s => (
                          <button key={s} onClick={() => { setPlaceOfSupply(s); setPosOpen(false); setPosFilter(""); }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-hover transition-colors ${placeOfSupply === s ? "bg-primary-light text-primary font-medium" : "text-secondary"}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Est. Delivery</label>
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} disabled={!canEdit} className={`${inputCls} disabled:opacity-50`} />
                </div>
                <div>
                  <label className={labelCls}>Package</label>
                  {packages.length > 0 ? (
                    <div className="relative">
                      <select onChange={(e) => { const pkg = packages.find(p => p.id === e.target.value); if (pkg) handleApplyPackage(pkg); e.target.value = ""; }} disabled={!canEdit} className={`${inputCls} disabled:opacity-50`} defaultValue="">
                        <option value="" disabled>Choose Package...</option>
                        {packages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>{pkg.name} ({(pkg.serviceItems?.length || 0) + (pkg.partItems?.length || 0)} items)</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-muted py-2">No packages available</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Billing Mode Toggle ─── */}
          {(canEdit || hasItems) && deptList.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <Layers className="w-4 h-4 text-muted" />
              <span className="text-xs font-medium text-secondary">Billing Mode</span>
              <div className="flex items-center bg-dim border border-edge rounded-lg overflow-hidden">
                {(["standard", "department"] as const).map((m) => (
                  <button key={m} onClick={() => handleToggleBillingMode(m)}
                    className={`px-3.5 py-1.5 text-xs font-medium transition-colors capitalize ${billingMode === m ? "bg-primary text-white" : "text-muted hover:bg-hover"}`}
                  >{m === "department" ? "Department-wise" : "Standard"}</button>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              STANDARD BILLING VIEW
              ════════════════════════════════════════ */}
          {billingMode === "standard" && (
          <>
          {/* ─── Services Section ─── */}
          {(canEdit || serviceRows.length > 0) && (
            <div className="bg-background rounded-lg border border-edge">
              <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-secondary">Services</h3>
                  {serviceRows.length > 0 && <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{serviceRows.length}</span>}
                </div>
                {canEdit && (
                  <button onClick={() => { setChooseServicesOpen(true); setChooseServicesFilter(""); setChooseServicesSelected(new Set()); }}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:bg-primary-light px-2.5 py-1.5 rounded transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {serviceRows.map((s, idx) => {
                  const c = serviceCalcs[idx];
                  return (
                    <div key={s.key} className="border border-edge-light rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{s.description}</p>
                        <div className="flex items-center gap-3">
                          {canViewFinancial("ORDERS") && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <span className="text-[11px] text-muted">GST Inclusive</span>
                              <button onClick={() => canEdit && updateServiceRow(s.key, "gstInclusive", !s.gstInclusive)}
                                className={`relative w-8 h-4.5 rounded-full transition-colors ${s.gstInclusive ? "bg-primary" : "bg-edge"}`}>
                                <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${s.gstInclusive ? "left-[calc(100%-1rem)]" : "left-0.5"}`} />
                              </button>
                            </label>
                          )}
                          {canEdit && (
                            <button onClick={() => setServiceRows(prev => prev.filter(x => x.key !== s.key))} className="p-1 text-muted hover:text-bad hover:bg-bad-light rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`grid gap-2 items-end ${canViewFinancial("ORDERS") ? "grid-cols-7" : "grid-cols-3"}`}>
                        {canViewFinancial("ORDERS") && (
                          <div className="relative">
                            <label className={labelCls}>GST %</label>
                            <button onClick={() => canEdit && setGstDropdownKey(gstDropdownKey === s.key ? null : s.key)}
                              className="w-full flex items-center justify-between px-2 py-1.5 border border-edge rounded text-sm bg-background">
                              <span>{s.gstRate}%</span><ChevronDown className="w-3 h-3 text-muted" />
                            </button>
                            {gstDropdownKey === s.key && canEdit && (
                              <div className="absolute z-30 top-full left-0 mt-1 min-w-[180px] bg-background border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {serviceTaxProfiles.map(tp => (
                                  <button key={tp.id} onClick={() => { updateServiceRow(s.key, "gstRate", tp.taxPercent); if (tp.sacNumber) updateServiceRow(s.key, "hsnSac", tp.sacNumber); setGstDropdownKey(null); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-hover ${s.gstRate === tp.taxPercent ? "bg-primary-light text-primary" : "text-secondary"}`}>
                                    {tp.name} ({tp.taxPercent}%)
                                  </button>
                                ))}
                                <div className="border-t border-edge">
                                  <button onClick={() => { setGstDropdownKey(null); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "service" }); setCreateTaxOpen(true); }}
                                    className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-primary-light">+ Create GST Profile</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div><label className={labelCls}>SAC</label><input type="text" value={s.hsnSac} onChange={e => updateServiceRow(s.key, "hsnSac", e.target.value)} disabled={!canEdit} className={smallInputCls} /></div>
                        <div><label className={labelCls}>Qty</label><input type="number" min={1} value={s.qty} onChange={e => updateServiceRow(s.key, "qty", parseInt(e.target.value) || 1)} disabled={!canEdit} className={smallInputCls} /></div>
                        {canViewFinancial("ORDERS") && (
                          <>
                            <div><label className={labelCls}>Rate</label><input type="number" min={0} value={s.rate || ""} onChange={e => updateServiceRow(s.key, "rate", parseFloat(e.target.value) || 0)} disabled={!canEdit} className={smallInputCls} placeholder="0" /></div>
                            <div><label className={labelCls}>Disc %</label><input type="number" min={0} max={100} value={s.discount || ""} onChange={e => updateServiceRow(s.key, "discount", parseFloat(e.target.value) || 0)} disabled={!canEdit} className={smallInputCls} placeholder="0" /></div>
                            <div><label className={labelCls}>Amount</label><div className="px-2 py-1.5 text-sm text-right text-foreground font-medium bg-dim rounded">{c.amount.toLocaleString("en-IN")}</div></div>
                            <div><label className={labelCls}>GST Amt</label><div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">{c.gstAmount.toLocaleString("en-IN")}</div></div>
                          </>
                        )}
                      </div>

                    </div>
                  );
                })}
                {serviceRows.length === 0 && <p className="text-sm text-muted text-center py-6">No services added. Click &quot;Add Service&quot; to begin.</p>}
              </div>
            </div>
          )}

          {/* ─── Parts Section ─── */}
          {(canEdit || partRows.length > 0) && (
            <div className="bg-background rounded-lg border border-edge">
              <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-secondary">Parts</h3>
                  {partRows.length > 0 && <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{partRows.length}</span>}
                </div>
                {canEdit && (
                  <button onClick={() => { setChoosePartsOpen(true); setChoosePartsFilter(""); setChoosePartsSelected(new Set()); }}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:bg-primary-light px-2.5 py-1.5 rounded transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Part
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {partRows.map((p, idx) => {
                  const c = partCalcs[idx];
                  return (
                    <div key={p.key} className="border border-edge-light rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{p.description}</p>
                        <div className="flex items-center gap-3">
                          {canViewFinancial("ORDERS") && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <span className="text-[11px] text-muted">GST Inclusive</span>
                              <button onClick={() => canEdit && updatePartRow(p.key, "gstInclusive", !p.gstInclusive)}
                                className={`relative w-8 h-4.5 rounded-full transition-colors ${p.gstInclusive ? "bg-primary" : "bg-edge"}`}>
                                <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${p.gstInclusive ? "left-[calc(100%-1rem)]" : "left-0.5"}`} />
                              </button>
                            </label>
                          )}
                          {canEdit && (
                            <button onClick={() => setPartRows(prev => prev.filter(x => x.key !== p.key))} className="p-1 text-muted hover:text-bad hover:bg-bad-light rounded transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className={`grid gap-2 items-end ${canViewFinancial("ORDERS") ? "grid-cols-7" : "grid-cols-3"}`}>
                        {canViewFinancial("ORDERS") && (
                          <div className="relative">
                            <label className={labelCls}>GST %</label>
                            <button onClick={() => canEdit && setPartGstDropdownKey(partGstDropdownKey === p.key ? null : p.key)}
                              className="w-full flex items-center justify-between px-2 py-1.5 border border-edge rounded text-sm bg-background">
                              <span>{p.gstRate}%</span><ChevronDown className="w-3 h-3 text-muted" />
                            </button>
                            {partGstDropdownKey === p.key && canEdit && (
                              <div className="absolute z-30 top-full left-0 mt-1 min-w-[180px] bg-background border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {goodsTaxProfiles.map(tp => (
                                  <button key={tp.id} onClick={() => { updatePartRow(p.key, "gstRate", tp.taxPercent); if (tp.sacNumber) updatePartRow(p.key, "hsnSac", tp.sacNumber); setPartGstDropdownKey(null); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-hover ${p.gstRate === tp.taxPercent ? "bg-primary-light text-primary" : "text-secondary"}`}>
                                    {tp.name} ({tp.taxPercent}%)
                                  </button>
                                ))}
                                <div className="border-t border-edge">
                                  <button onClick={() => { setPartGstDropdownKey(null); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "goods" }); setCreateTaxOpen(true); }}
                                    className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-primary-light">+ Create GST Profile</button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div><label className={labelCls}>HSN</label><input type="text" value={p.hsnSac} onChange={e => updatePartRow(p.key, "hsnSac", e.target.value)} disabled={!canEdit} className={smallInputCls} /></div>
                        <div><label className={labelCls}>Qty</label><input type="number" min={1} value={p.qty} onChange={e => updatePartRow(p.key, "qty", parseInt(e.target.value) || 1)} disabled={!canEdit} className={smallInputCls} /></div>
                        {canViewFinancial("ORDERS") && (
                          <>
                            <div><label className={labelCls}>Rate</label><input type="number" min={0} value={p.rate || ""} onChange={e => updatePartRow(p.key, "rate", parseFloat(e.target.value) || 0)} disabled={!canEdit} className={smallInputCls} placeholder="0" /></div>
                            <div><label className={labelCls}>Disc %</label><input type="number" min={0} max={100} value={p.discount || ""} onChange={e => updatePartRow(p.key, "discount", parseFloat(e.target.value) || 0)} disabled={!canEdit} className={smallInputCls} placeholder="0" /></div>
                            <div><label className={labelCls}>Amount</label><div className="px-2 py-1.5 text-sm text-right text-foreground font-medium bg-dim rounded">{c.amount.toLocaleString("en-IN")}</div></div>
                            <div><label className={labelCls}>GST Amt</label><div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">{c.gstAmount.toLocaleString("en-IN")}</div></div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {partRows.length === 0 && <p className="text-sm text-muted text-center py-6">No parts added. Click &quot;Add Part&quot; to begin.</p>}
              </div>
            </div>
          )}
          </>
          )}

          {/* ════════════════════════════════════════
              DEPARTMENT-WISE BILLING VIEW
              ════════════════════════════════════════ */}
          {billingMode === "department" && (canEdit || hasItems) && (() => {
            // Build all items with department info
            type DeptItem = { key: string; type: "service" | "part"; itemId: string; description: string; hsnSac: string; qty: number; rate: number; gstRate: number; discount: number; gstInclusive: boolean; calc: { amount: number; gstAmount: number; total: number } };
            const allItems: DeptItem[] = [
              ...serviceRows.map((s, i) => ({ key: s.key, type: "service" as const, itemId: s.serviceId, description: s.description, hsnSac: s.hsnSac, qty: s.qty, rate: s.rate, gstRate: s.gstRate, discount: s.discount, gstInclusive: s.gstInclusive, calc: serviceCalcs[i] })),
              ...partRows.map((p, i) => ({ key: p.key, type: "part" as const, itemId: p.partId, description: p.description, hsnSac: p.hsnSac, qty: p.qty, rate: p.rate, gstRate: p.gstRate, discount: p.discount, gstInclusive: p.gstInclusive, calc: partCalcs[i] })),
            ];

            // Group by department
            const grouped: Record<string, { dept: Department | null; items: DeptItem[] }> = {};
            const UNCAT_KEY = "__uncategorized__";
            allItems.forEach((item) => {
              const mapping = resolveDept(item.key, item.type, item.itemId);
              const dKey = mapping?.departmentId || UNCAT_KEY;
              if (!grouped[dKey]) {
                const dept = deptList.find((d) => d.id === dKey) || null;
                grouped[dKey] = { dept, items: [] };
              }
              grouped[dKey].items.push(item);
            });

            // Sort: departments by sortOrder, uncategorized at end
            const sortedGroups = Object.entries(grouped).sort(([keyA, a], [keyB, b]) => {
              if (keyA === UNCAT_KEY) return 1;
              if (keyB === UNCAT_KEY) return -1;
              return (a.dept?.sortOrder || 99) - (b.dept?.sortOrder || 99);
            });

            return (
              <>
                {/* Add buttons */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setChooseServicesOpen(true); setChooseServicesFilter(""); setChooseServicesSelected(new Set()); }}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:bg-primary-light px-3 py-2 rounded-lg border border-primary/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Service
                    </button>
                    <button onClick={() => { setChoosePartsOpen(true); setChoosePartsFilter(""); setChoosePartsSelected(new Set()); }}
                      className="flex items-center gap-1.5 text-xs text-primary font-medium hover:bg-primary-light px-3 py-2 rounded-lg border border-primary/20 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Part
                    </button>
                  </div>
                )}

                {allItems.length === 0 && (
                  <p className="text-sm text-muted text-center py-6">No items added. Use the buttons above to add services or parts.</p>
                )}

                {sortedGroups.map(([dKey, group]) => {
                  const deptSubtotal = group.items.reduce((s, it) => s + it.calc.amount, 0);
                  const deptGst = group.items.reduce((s, it) => s + it.calc.gstAmount, 0);
                  return (
                    <div key={dKey} className="bg-background rounded-lg border border-edge">
                      {/* Department header */}
                      <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-accent" />
                          <h3 className="text-sm font-semibold text-secondary">
                            {group.dept?.name || "Uncategorized"}
                          </h3>
                          <span className="text-xs bg-accent-light text-accent px-1.5 py-0.5 rounded-full">{group.items.length}</span>
                        </div>
                        {canViewFinancial("ORDERS") && (
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            Subtotal: ₹{(deptSubtotal + (isProforma ? 0 : deptGst)).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        {group.items.map((item) => {
                          const isService = item.type === "service";
                          return (
                            <div key={item.key} className="border border-edge-light rounded-lg p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isService ? <Wrench className="w-3.5 h-3.5 text-primary" /> : <Package className="w-3.5 h-3.5 text-warn" />}
                                  <p className="text-sm font-medium text-foreground">{item.description}</p>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${isService ? "bg-primary-light text-primary" : "bg-warn-light text-warn"}`}>
                                    {isService ? "Service" : "Part"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Department override dropdown */}
                                  {canEdit && (
                                    <select
                                      value={resolveDept(item.key, item.type, item.itemId)?.departmentId || ""}
                                      onChange={(e) => handleLineItemDeptChange(item.key, e.target.value)}
                                      className="text-[11px] px-2 py-1 border border-edge rounded bg-background text-secondary focus:outline-none focus:ring-1 focus:ring-primary max-w-[140px]"
                                    >
                                      <option value="">No Dept</option>
                                      {deptList.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                      ))}
                                    </select>
                                  )}
                                  {canEdit && (
                                    <button onClick={() => {
                                      if (isService) setServiceRows(prev => prev.filter(x => x.key !== item.key));
                                      else setPartRows(prev => prev.filter(x => x.key !== item.key));
                                    }} className="p-1 text-muted hover:text-bad hover:bg-bad-light rounded transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className={`grid gap-2 items-end ${canViewFinancial("ORDERS") ? "grid-cols-5" : "grid-cols-2"}`}>
                                <div><label className={labelCls}>{isService ? "SAC" : "HSN"}</label><input type="text" value={item.hsnSac} onChange={e => { if (isService) updateServiceRow(item.key, "hsnSac", e.target.value); else updatePartRow(item.key, "hsnSac", e.target.value); }} disabled={!canEdit} className={smallInputCls} /></div>
                                <div><label className={labelCls}>Qty</label><input type="number" min={1} value={item.qty} onChange={e => { if (isService) updateServiceRow(item.key, "qty", parseInt(e.target.value) || 1); else updatePartRow(item.key, "qty", parseInt(e.target.value) || 1); }} disabled={!canEdit} className={smallInputCls} /></div>
                                {canViewFinancial("ORDERS") && (
                                  <>
                                    <div><label className={labelCls}>Rate</label><input type="number" min={0} value={item.rate || ""} onChange={e => { if (isService) updateServiceRow(item.key, "rate", parseFloat(e.target.value) || 0); else updatePartRow(item.key, "rate", parseFloat(e.target.value) || 0); }} disabled={!canEdit} className={smallInputCls} placeholder="0" /></div>
                                    <div><label className={labelCls}>Amount</label><div className="px-2 py-1.5 text-sm text-right text-foreground font-medium bg-dim rounded">{item.calc.amount.toLocaleString("en-IN")}</div></div>
                                    <div><label className={labelCls}>GST</label><div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">{item.calc.gstAmount.toLocaleString("en-IN")}</div></div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}

          {/* ─── Staff Assignment Section ─── */}
          {order.status === "wip" && (isOwner || canManage("STAFF")) && serviceRows.length > 0 && (
            <div className="bg-background rounded-lg border border-edge">
              <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge rounded-t-lg">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-secondary">Staff Assignment</h3>
                  {(() => {
                    const assigned = (order.serviceAssignments || []).length;
                    return assigned > 0 ? <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{assigned}/{serviceRows.length}</span> : null;
                  })()}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {serviceRows.map((s) => {
                  const existing = (order.serviceAssignments || []).find(a => a.lineItemId === s.key);
                  const isAssigningThis = assigning === s.key;
                  const isDropdownOpen = staffDropdownOpen === s.key;
                  return (
                    <div key={s.key} className="border border-edge-light rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.description}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <div className="relative">
                            <button
                              onClick={() => existing?.status !== "completed" && setStaffDropdownOpen(isDropdownOpen ? null : s.key)}
                              disabled={isAssigningThis || existing?.status === "completed"}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors min-w-[160px] justify-between ${
                                existing?.status === "completed"
                                  ? "border-ok/30 text-ok bg-ok/5 cursor-not-allowed"
                                  : existing
                                    ? "border-edge text-foreground bg-background hover:bg-hover"
                                    : "border-primary/30 text-primary bg-primary-light hover:bg-primary/10"
                              } disabled:opacity-50`}
                            >
                              {isAssigningThis ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : existing ? (
                                <span className="truncate">{existing.assignedUserName}</span>
                              ) : (
                                <span>Assign Staff</span>
                              )}
                              {existing?.status === "completed" ? <Check className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
                            </button>
                            {isDropdownOpen && staffMembers.length > 0 && (() => {
                              const isAdmin = user?.role === "garage_admin" || user?.role === "super_admin";
                              const allowedRoleIds = new Set(assignableRoles.map(r => r.id));
                              const activeStaff = staffMembers.filter(m => m.isActive && (isAdmin || (m.garageRoleId && allowedRoleIds.has(m.garageRoleId))));
                              const uniqueRoles = [...new Set(activeStaff.filter(m => m.roleName).map(m => m.roleName!))];
                              const filteredStaff = assignRoleFilter === "all" ? activeStaff : activeStaff.filter(m => m.roleName === assignRoleFilter);
                              return (
                                <div className="absolute right-0 top-full mt-1 z-30 bg-background border border-edge rounded-lg shadow-lg min-w-[240px] max-h-64 flex flex-col">
                                  {/* Role filter chips */}
                                  {uniqueRoles.length > 1 && (
                                    <div className="flex flex-wrap gap-1 px-2.5 pt-2 pb-1.5 border-b border-edge">
                                      <button onClick={() => setAssignRoleFilter("all")}
                                        className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${assignRoleFilter === "all" ? "bg-primary text-white" : "bg-hover text-muted hover:text-foreground"}`}>
                                        All
                                      </button>
                                      {uniqueRoles.map(role => (
                                        <button key={role} onClick={() => setAssignRoleFilter(role)}
                                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${assignRoleFilter === role ? "bg-primary text-white" : "bg-hover text-muted hover:text-foreground"}`}>
                                          {role}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  {/* Staff list */}
                                  <div className="py-1 overflow-y-auto">
                                    {filteredStaff.map((staff) => (
                                      <button key={staff.id}
                                        onClick={() => { setStaffDropdownOpen(null); setAssignRoleFilter("all"); setAssignConfirm({ lineItemId: s.key, serviceName: s.description, staff }); }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-hover transition-colors flex items-center justify-between ${
                                          existing?.assignedUserId === staff.id ? "bg-primary-light text-primary font-medium" : "text-foreground"
                                        }`}>
                                        <div>
                                          <p className="font-medium">{staff.name}</p>
                                          {staff.roleName && <p className="text-muted mt-0.5">{staff.roleName}</p>}
                                        </div>
                                        {existing?.assignedUserId === staff.id && <Check className="w-3.5 h-3.5 text-primary" />}
                                      </button>
                                    ))}
                                    {filteredStaff.length === 0 && (
                                      <p className="px-3 py-2 text-xs text-muted">No staff members found</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          {existing && (
                            <div className="flex items-center gap-2">
                              {/* Timer display */}
                              {existing.workStartedAt && (() => {
                                const isPaused = !!existing.workPausedAt;
                                const isCompleted = existing.status === "completed";
                                let elapsedMs = 0;
                                if (existing.totalWorkMs != null && existing.totalWorkMs > 0) {
                                  elapsedMs = existing.totalWorkMs;
                                } else if (existing.workStartedAt) {
                                  const started = new Date(existing.workStartedAt).getTime();
                                  const paused = existing.totalPausedMs || 0;
                                  if (isPaused && existing.workPausedAt) {
                                    elapsedMs = new Date(existing.workPausedAt).getTime() - started - paused;
                                  } else {
                                    elapsedMs = Date.now() - started - paused;
                                  }
                                }
                                const totalSec = Math.max(0, Math.floor(elapsedMs / 1000));
                                const h = Math.floor(totalSec / 3600);
                                const m = Math.floor((totalSec % 3600) / 60);
                                const s = totalSec % 60;
                                const timeStr = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
                                return (
                                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                                    isCompleted ? "bg-ok/10 text-ok" :
                                    isPaused ? "bg-dim text-muted" :
                                    "bg-warn/10 text-warn"
                                  }`}>
                                    {timeStr}
                                  </span>
                                );
                              })()}
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${
                                existing.status === "completed" ? "bg-ok/10 text-ok" :
                                existing.workPausedAt ? "bg-dim text-muted" :
                                existing.status === "in_progress" ? "bg-warn/10 text-warn" :
                                "bg-dim text-muted"
                              }`}>
                                {existing.workPausedAt ? "Paused" :
                                 existing.status === "in_progress" ? "In Progress" :
                                 existing.status === "completed" ? "Completed" : "Pending"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {existing && ((existing.beforeImageIds?.length || 0) > 0 || (existing.afterImageIds?.length || 0) > 0) && (
                        <div className="mt-2 pt-2 border-t border-edge-light space-y-2">
                          {existing.beforeImageIds && existing.beforeImageIds.length > 0 && (
                            <div>
                              <p className="text-[11px] font-medium text-muted mb-1">Before</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {existing.beforeImageIds.map((imgId) => (
                                  <a key={imgId} href={getImageUrl(imgId)} target="_blank" rel="noopener noreferrer"
                                    className="w-14 h-14 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors block">
                                    <img src={getImageUrl(imgId)} alt="Before" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {existing.afterImageIds && existing.afterImageIds.length > 0 && (
                            <div>
                              <p className="text-[11px] font-medium text-muted mb-1">After</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {existing.afterImageIds.map((imgId) => (
                                  <a key={imgId} href={getImageUrl(imgId)} target="_blank" rel="noopener noreferrer"
                                    className="w-14 h-14 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors block">
                                    <img src={getImageUrl(imgId)} alt="After" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Work Photos (for completed / payment_due orders) ─── */}
          {(order.status === "payment_due" || order.status === "completed") && (() => {
            const assignments = (order.serviceAssignments || []).filter(
              a => (a.beforeImageIds?.length || 0) > 0 || (a.afterImageIds?.length || 0) > 0
            );
            if (assignments.length === 0) return null;
            return (
              <div className="bg-background rounded-lg border border-edge">
                <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-secondary">Work Photos</h3>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {assignments.map((a) => {
                    const row = serviceRows.find(r => r.key === a.lineItemId);
                    return (
                      <div key={a.lineItemId} className="border border-edge-light rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium text-foreground">{row?.description || a.lineItemId}</p>
                        {a.beforeImageIds && a.beforeImageIds.length > 0 && (
                          <div>
                            <p className="text-[11px] font-medium text-muted mb-1">Before</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {a.beforeImageIds.map((imgId) => (
                                <a key={imgId} href={getImageUrl(imgId)} target="_blank" rel="noopener noreferrer"
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors block">
                                  <img src={getImageUrl(imgId)} alt="Before" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {a.afterImageIds && a.afterImageIds.length > 0 && (
                          <div>
                            <p className="text-[11px] font-medium text-muted mb-1">After</p>
                            <div className="flex gap-1.5 flex-wrap">
                              {a.afterImageIds.map((imgId) => (
                                <a key={imgId} href={getImageUrl(imgId)} target="_blank" rel="noopener noreferrer"
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-edge hover:border-primary transition-colors block">
                                  <img src={getImageUrl(imgId)} alt="After" className="w-full h-full object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ─── Summary + Actions ─── */}
          {hasItems && (
            <div className="bg-background rounded-lg border border-edge p-5">
              {canViewFinancial("ORDERS") && (
                <>
                  <h3 className="text-sm font-semibold text-secondary mb-3">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-secondary"><span>Services Subtotal</span><span>{serviceSubtotal.toLocaleString("en-IN")}</span></div>
                    {!isProforma && <div className="flex justify-between text-secondary"><span>Services GST</span><span>{serviceGstTotal.toLocaleString("en-IN")}</span></div>}
                    <div className="flex justify-between text-secondary"><span>Parts Subtotal</span><span>{partSubtotal.toLocaleString("en-IN")}</span></div>
                    {!isProforma && <div className="flex justify-between text-secondary"><span>Parts GST</span><span>{partGstTotal.toLocaleString("en-IN")}</span></div>}
                    <div className="flex justify-between text-foreground font-bold text-base border-t border-edge pt-2">
                      <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> Grand Total</span>
                      <span>{grandTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </>
              )}
              <div className="mt-5 flex gap-3">
                {canEdit && (
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-3 bg-background border border-edge rounded-lg text-sm font-medium text-foreground hover:bg-hover disabled:opacity-50">
                    {saving ? "Saving..." : "Save Estimate"}
                  </button>
                )}
                {canSend && (
                  <button onClick={handleSendForApproval} disabled={sending}
                    className="flex-1 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send for Approval"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Estimate Link */}
          {(estimateLink || order.estimateToken) && (
            <div className="bg-primary-light rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-primary">Estimate Link</span></div>
                <div className="flex gap-2">
                  <button onClick={handleCopyLink} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-background"><Copy className="w-3 h-3" /> Copy</button>
                  <a href={estimateLink || `/estimate/${order.estimateToken}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md hover:bg-background"><ExternalLink className="w-3 h-3" /> Open</a>
                </div>
              </div>
            </div>
          )}

          {/* Customer rejection info banner */}
          {order.customerApproved === false && order.customerRejectionNote && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Customer rejected estimate</span>
                {order.customerRejectionNote && <>: {order.customerRejectionNote}</>}
              </p>
              {order.customerRequestedProforma && (
                <p className="text-sm text-amber-700 mt-1 font-medium">
                  Customer requested proforma (no GST) billing.
                </p>
              )}
            </div>
          )}
          {order.customerApproved === false && !order.customerRejectionNote && order.customerRequestedProforma && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm text-amber-800 font-semibold">Customer rejected estimate</p>
              <p className="text-sm text-amber-700 mt-1 font-medium">
                Customer requested proforma (no GST) billing.
              </p>
            </div>
          )}

          {/* ─── Status Actions ─── */}
          {order.status !== "completed" && order.status !== "cancelled" && order.status !== "payment_due" && (isOwner || manage) && (
            <div className="bg-background rounded-xl border border-edge p-5">
              <p className="text-xs font-medium text-muted uppercase mb-3">Actions</p>
              <div className="flex flex-wrap gap-2">
                {order.customerApproved === false && (
                  <button onClick={async () => {
                    setUpdating(true);
                    try { const updated = await resendEstimate(order.id); setOrder(updated); showSuccess("Estimate resent"); }
                    catch {} finally { setUpdating(false); }
                  }} disabled={updating}
                    className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                    Revise & Resend Estimate
                  </button>
                )}
                {order.status === "wip" && (() => {
                  const assignments = order.serviceAssignments || [];
                  const allCompleted = assignments.length > 0 && assignments.every(a => a.status === "completed");
                  return allCompleted ? (
                    <button onClick={async () => {
                      setUpdating(true);
                      try {
                        const updated = await markPaymentDue(order.id);
                        setOrder(updated);
                        showSuccess("Payment link sent to customer");
                      } catch {} finally { setUpdating(false); }
                    }} disabled={updating}
                      className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4" />
                      {updating ? "Sending..." : "Mark Completed & Send Payment"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-dim rounded-lg border border-edge">
                      <AlertCircle className="w-4 h-4 text-muted" />
                      <span className="text-sm text-muted">
                        {assignments.length === 0
                          ? "Assign staff to services before sending payment link"
                          : "Complete all assigned services before sending payment link"}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {order.status === "payment_due" && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-5 text-center">
              <IndianRupee className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-orange-700">Payment Due</p>
              <p className="text-xs text-orange-600 mt-1">Payment link has been sent to the customer via email.</p>
              {order.paymentToken && (
                <button onClick={() => {
                  const url = `${window.location.origin}/payment/${order.paymentToken}`;
                  navigator.clipboard.writeText(url);
                  showSuccess("Payment link copied");
                }}
                  className="mt-3 px-4 py-2 text-xs font-medium text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-100">
                  Copy Payment Link
                </button>
              )}
            </div>
          )}

          {order.status === "completed" && (
            <div className="bg-ok-light rounded-xl border border-ok/20 p-5 text-center">
              <CheckCircle2 className="w-8 h-8 text-ok mx-auto mb-2" />
              <p className="text-sm font-semibold text-ok">Order Completed</p>
            </div>
          )}

          {invoice && (
            <div className="bg-background rounded-xl border border-edge p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted">{invoice.type === "proforma" ? "Proforma Invoice" : "Tax Invoice"} &middot; <span className={
                    invoice.status === "paid" ? "text-ok font-medium" : invoice.status === "sent" ? "text-primary font-medium" : "text-muted"
                  }>{invoice.status === "paid" ? "Paid" : invoice.status === "sent" ? "Sent" : "Draft"}</span></p>
                </div>
                {canViewFinancial("ORDERS") && (
                  <p className="text-sm font-bold text-foreground">{"\u20B9"} {invoice.grandTotal?.toLocaleString("en-IN")}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary-light transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View Invoice
                </button>
                {canViewFinancial("ORDERS") && (
                <button onClick={() => {
                  const token = getAccessToken();
                  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
                  fetch(`${base}/api/invoices/${invoice.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(r => r.blob())
                    .then(blob => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${invoice.invoiceNumber}.pdf`; a.click(); URL.revokeObjectURL(a.href); });
                }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors">
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
                )}
              </div>
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="bg-bad-light rounded-xl border border-bad/20 p-5 text-center">
              <AlertCircle className="w-8 h-8 text-bad mx-auto mb-2" />
              <p className="text-sm font-semibold text-bad">Order Cancelled</p>
              {order.customerRejectionNote && <p className="text-sm text-secondary mt-1">Reason: {order.customerRejectionNote}</p>}
              {isOwner && <p className="text-xs text-muted mt-2">You can edit the estimate above and click &quot;Send for Approval&quot; to reopen this order.</p>}
            </div>
          )}
        </div>
      </div>

      {/* ════════ MODALS ════════ */}

      {/* ── Staff Assignment Confirmation ── */}
      {assignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAssignConfirm(null)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 animate-scale-in">
            <div className="px-5 py-4 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Confirm Assignment</h3>
            </div>
            <div className="px-5 py-5">
              <p className="text-sm text-secondary">
                Assign <span className="font-semibold text-foreground">{assignConfirm.staff.name}</span> to{" "}
                <span className="font-semibold text-foreground">{assignConfirm.serviceName}</span>?
              </p>
              {assignConfirm.staff.staffTitle && (
                <p className="text-xs text-muted mt-1">Role: {assignConfirm.staff.staffTitle}</p>
              )}
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-edge">
              <button onClick={() => setAssignConfirm(null)}
                className="flex-1 py-2.5 border border-edge rounded-lg text-sm font-medium text-foreground hover:bg-hover">
                Cancel
              </button>
              <button onClick={async () => {
                const { lineItemId, staff } = assignConfirm;
                setAssignConfirm(null);
                await handleAssignService(lineItemId, staff);
              }}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Choose Services Modal ── */}
      {chooseServicesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setChooseServicesOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Choose Services</h3>
              <button onClick={() => setChooseServicesOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={chooseServicesFilter} onChange={e => setChooseServicesFilter(e.target.value)} placeholder="Search services..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {allServices.filter(s => s.name.toLowerCase().includes(chooseServicesFilter.toLowerCase())).map(svc => {
                const checked = chooseServicesSelected.has(svc.id);
                const alreadyAdded = serviceRows.some(r => r.serviceId === svc.id);
                return (
                  <button key={svc.id} disabled={alreadyAdded} onClick={() => { setChooseServicesSelected(prev => { const next = new Set(prev); if (next.has(svc.id)) next.delete(svc.id); else next.add(svc.id); return next; }); }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 ${alreadyAdded ? "opacity-40" : "hover:bg-hover"}`}>
                    <span className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-edge"}`}>{checked && <Check className="w-3 h-3 text-white" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{svc.name}</p>
                      <p className="text-xs text-muted">{svc.categoryName ? `${svc.categoryName} · ` : ""}Rs {svc.price}{svc.hasGst ? ` · GST ${svc.gstRate}%` : ""}{alreadyAdded ? " (Already added)" : ""}</p>
                    </div>
                  </button>
                );
              })}
              {allServices.length === 0 && <p className="text-sm text-muted text-center py-8">No services in your catalog yet.</p>}
            </div>
            <div className="border-t border-edge px-4 py-3 flex gap-2">
              <button onClick={() => { setSvcForm(emptyServiceForm); setCreateServiceOpen(true); }} className="flex-1 py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">+ Create Service</button>
              {chooseServicesSelected.size > 0 && (
                <button onClick={handleAddSelectedServices} className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">Add {chooseServicesSelected.size} Service{chooseServicesSelected.size > 1 ? "s" : ""}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Service Modal ── */}
      {createServiceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreateServiceOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Create Service</h3>
              <button onClick={() => setCreateServiceOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Service Name <span className="text-bad">*</span></label><input type="text" value={svcForm.name} onChange={e => setSvcForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Engine Oil Change" className={inputCls} autoFocus /></div>
                <div><label className={labelCls}>Price <span className="text-bad">*</span></label><input type="number" min={0} value={svcForm.price} onChange={e => setSvcForm(p => ({ ...p, price: e.target.value }))} placeholder="0" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Service No.</label><input type="text" value={svcForm.serviceNumber} onChange={e => setSvcForm(p => ({ ...p, serviceNumber: e.target.value }))} placeholder="Optional" className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Category</label>
                  <button onClick={() => { setSvcCategoryPickerOpen(true); setSvcCategoryPickerFilter(""); setSvcCategoryNewName(""); }} className={`${inputCls} text-left flex items-center justify-between`}>
                    <span className={svcForm.categoryName ? "text-foreground" : "text-muted"}>{svcForm.categoryName || "Select..."}</span><ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={svcForm.hasGst} onChange={e => setSvcForm(p => ({ ...p, hasGst: e.target.checked }))} className="w-4 h-4 rounded border-edge text-primary focus:ring-primary" />
                  <span className="text-sm text-secondary font-medium">GST Details</span>
                </label>
              </div>
              {svcForm.hasGst && (
                <div className="grid grid-cols-3 gap-3 bg-dim rounded-lg p-3">
                  <div>
                    <label className={labelCls}>Tax Category</label>
                    <button onClick={() => { setSvcTaxPickerOpen(true); setSvcTaxPickerFilter(""); }} className={`${inputCls} text-left text-xs flex items-center justify-between`}>
                      <span className={svcForm.taxProfileId ? "text-foreground" : "text-muted"}>{svcForm.taxProfileId ? (serviceTaxProfiles.find(t => t.id === svcForm.taxProfileId)?.name || "Selected") : "Select..."}</span>
                      <ChevronDown className="w-3 h-3 text-muted" />
                    </button>
                  </div>
                  <div><label className={labelCls}>SAC No.</label><input type="text" value={svcForm.sacNumber} onChange={e => setSvcForm(p => ({ ...p, sacNumber: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>GST Rate %</label><input type="number" value={svcForm.gstRate} onChange={e => setSvcForm(p => ({ ...p, gstRate: e.target.value }))} className={inputCls} /></div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setCreateServiceOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary border border-edge rounded-md hover:bg-hover">Cancel</button>
                <button onClick={handleCreateService} disabled={!svcForm.name.trim() || !svcForm.price || svcSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">{svcSaving ? "Saving..." : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Category Picker (Service) ── */}
      {svcCategoryPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSvcCategoryPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[60vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">Select Category</h3>
              <button onClick={() => setSvcCategoryPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-2 border-b border-edge-light"><input type="text" value={svcCategoryPickerFilter} onChange={e => setSvcCategoryPickerFilter(e.target.value)} placeholder="Search..." autoFocus className={inputCls} /></div>
            <div className="flex-1 overflow-y-auto py-1">
              {categories.filter(c => c.name.toLowerCase().includes(svcCategoryPickerFilter.toLowerCase())).map(c => (
                <button key={c.id} onClick={() => { setSvcForm(p => ({ ...p, categoryId: c.id, categoryName: c.name })); setSvcCategoryPickerOpen(false); }}
                  className={`w-full text-left px-5 py-2.5 text-sm hover:bg-hover ${svcForm.categoryId === c.id ? "bg-primary-light text-primary" : "text-secondary"}`}>{c.name}</button>
              ))}
            </div>
            <div className="border-t border-edge px-4 py-3">
              <div className="flex gap-2">
                <input type="text" value={svcCategoryNewName} onChange={e => setSvcCategoryNewName(e.target.value)} placeholder="New category name..." className={`${inputCls} flex-1`} />
                <button onClick={handleCreateServiceCategory} disabled={!svcCategoryNewName.trim() || svcCategoryCreating} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50">{svcCategoryCreating ? "..." : "Add"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tax Picker (Service) ── */}
      {svcTaxPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSvcTaxPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[60vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">Select Tax Profile</h3>
              <button onClick={() => setSvcTaxPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {serviceTaxProfiles.filter(t => t.name.toLowerCase().includes(svcTaxPickerFilter.toLowerCase())).map(t => (
                <button key={t.id} onClick={() => { setSvcForm(p => ({ ...p, taxProfileId: t.id, sacNumber: t.sacNumber || p.sacNumber, gstRate: String(t.taxPercent) })); setSvcTaxPickerOpen(false); }}
                  className={`w-full text-left px-5 py-2.5 text-sm hover:bg-hover ${svcForm.taxProfileId === t.id ? "bg-primary-light text-primary" : "text-secondary"}`}>{t.name} ({t.taxPercent}%)</button>
              ))}
            </div>
            <div className="border-t border-edge px-4 py-3">
              <button onClick={() => { setSvcTaxPickerOpen(false); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "service" }); setCreateTaxOpen(true); }} className="w-full py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light">+ Create Tax Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Choose Parts Modal ── */}
      {choosePartsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setChoosePartsOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Choose Parts</h3>
              <button onClick={() => setChoosePartsOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={choosePartsFilter} onChange={e => setChoosePartsFilter(e.target.value)} placeholder="Search parts..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {allParts.filter(p => p.name.toLowerCase().includes(choosePartsFilter.toLowerCase()) || p.partNumber.toLowerCase().includes(choosePartsFilter.toLowerCase())).map(part => {
                const checked = choosePartsSelected.has(part.id);
                const alreadyAdded = partRows.some(r => r.partId === part.id);
                return (
                  <button key={part.id} disabled={alreadyAdded} onClick={() => { setChoosePartsSelected(prev => { const next = new Set(prev); if (next.has(part.id)) next.delete(part.id); else next.add(part.id); return next; }); }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 ${alreadyAdded ? "opacity-40" : "hover:bg-hover"}`}>
                    <span className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-edge"}`}>{checked && <Check className="w-3 h-3 text-white" />}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{part.name}</p>
                      <p className="text-xs text-muted">{part.partNumber ? `#${part.partNumber} · ` : ""}Rs {part.sellingPrice}{part.gstRate ? ` · GST ${part.gstRate}%` : ""} · Stock: {part.stockQty}{alreadyAdded ? " (Already added)" : ""}</p>
                    </div>
                  </button>
                );
              })}
              {allParts.length === 0 && <p className="text-sm text-muted text-center py-8">No parts in inventory yet.</p>}
            </div>
            <div className="border-t border-edge px-4 py-3 flex gap-2">
              <button onClick={() => { setPartForm(emptyPartForm); setCreatePartOpen(true); }} className="flex-1 py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">+ Create Part</button>
              {choosePartsSelected.size > 0 && (
                <button onClick={handleAddSelectedParts} className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">Add {choosePartsSelected.size} Part{choosePartsSelected.size > 1 ? "s" : ""}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Part Modal ── */}
      {createPartOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreatePartOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Create Part</h3>
              <button onClick={() => setCreatePartOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Part Name <span className="text-bad">*</span></label><input type="text" value={partForm.name} onChange={e => setPartForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Brake Pad" className={inputCls} autoFocus /></div>
                <div><label className={labelCls}>Part No.</label><input type="text" value={partForm.partNumber} onChange={e => setPartForm(p => ({ ...p, partNumber: e.target.value }))} placeholder="Optional" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>MRP</label><input type="number" min={0} value={partForm.mrp} onChange={e => setPartForm(p => ({ ...p, mrp: e.target.value }))} placeholder="0" className={inputCls} /></div>
                <div><label className={labelCls}>Selling Price <span className="text-bad">*</span></label><input type="number" min={0} value={partForm.sellingPrice} onChange={e => setPartForm(p => ({ ...p, sellingPrice: e.target.value }))} placeholder="0" className={inputCls} /></div>
                <div><label className={labelCls}>Purchase Price</label><input type="number" min={0} value={partForm.purchasePrice} onChange={e => setPartForm(p => ({ ...p, purchasePrice: e.target.value }))} placeholder="0" className={inputCls} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className={labelCls}>HSN Code</label><input type="text" value={partForm.hsnCode} onChange={e => setPartForm(p => ({ ...p, hsnCode: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>GST Rate %</label><input type="number" value={partForm.gstRate} onChange={e => setPartForm(p => ({ ...p, gstRate: e.target.value }))} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Manufacturer</label>
                  <button onClick={() => { setPartMfgPickerOpen(true); setPartMfgPickerFilter(""); setPartMfgNewName(""); }} className={`${inputCls} text-left flex items-center justify-between`}>
                    <span className={partForm.manufacturerName ? "text-foreground" : "text-muted"}>{partForm.manufacturerName || "Select..."}</span><ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setCreatePartOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary border border-edge rounded-md hover:bg-hover">Cancel</button>
                <button onClick={handleCreatePart} disabled={!partForm.name.trim() || !partForm.sellingPrice || partSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">{partSaving ? "Saving..." : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manufacturer Picker ── */}
      {partMfgPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPartMfgPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[60vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-sm font-semibold text-foreground">Select Manufacturer</h3>
              <button onClick={() => setPartMfgPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {manufacturers.filter(m => m.name.toLowerCase().includes(partMfgPickerFilter.toLowerCase())).map(m => (
                <button key={m.id} onClick={() => { setPartForm(p => ({ ...p, manufacturerId: m.id, manufacturerName: m.name })); setPartMfgPickerOpen(false); }}
                  className="w-full text-left px-5 py-2.5 text-sm hover:bg-hover text-secondary">{m.name}</button>
              ))}
            </div>
            <div className="border-t border-edge px-4 py-3">
              <div className="flex gap-2">
                <input type="text" value={partMfgNewName} onChange={e => setPartMfgNewName(e.target.value)} placeholder="New manufacturer..." className={`${inputCls} flex-1`} />
                <button onClick={handleCreateManufacturer} disabled={!partMfgNewName.trim() || partMfgCreating} className="px-3 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50">{partMfgCreating ? "..." : "Add"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Tax Profile Modal ── */}
      {createTaxOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreateTaxOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Create Tax Profile</h3>
              <button onClick={() => setCreateTaxOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div><label className={labelCls}>Name <span className="text-bad">*</span></label><input type="text" value={taxForm.name} onChange={e => setTaxForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. GST 18%" className={inputCls} autoFocus /></div>
              <div><label className={labelCls}>Tax % <span className="text-bad">*</span></label><input type="number" min={0} value={taxForm.taxPercent} onChange={e => setTaxForm(p => ({ ...p, taxPercent: e.target.value }))} placeholder="18" className={inputCls} /></div>
              <div><label className={labelCls}>SAC/HSN</label><input type="text" value={taxForm.sacNumber} onChange={e => setTaxForm(p => ({ ...p, sacNumber: e.target.value }))} className={inputCls} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCreateTaxOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary border border-edge rounded-md hover:bg-hover">Cancel</button>
              <button onClick={handleCreateTaxProfile} disabled={!taxForm.name.trim() || !taxForm.taxPercent || taxSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">{taxSaving ? "Saving..." : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
