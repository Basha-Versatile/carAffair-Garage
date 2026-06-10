"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, Wrench, Tag, X,
  IndianRupee, ChevronDown, Search, Check, User, Package, Bell, Mail,
} from "lucide-react";
import { canViewFinancial } from "@/lib/auth";
import { createInvoice, notifyCustomer, InvoiceItem } from "@/lib/api-invoices";
import { getTags, createTag, Tag as TagType } from "@/lib/api-tags";
import { searchCustomers, createCustomer, Customer } from "@/lib/api-customers";
import { getGarageServices, createGarageService, GarageService } from "@/lib/api-garage-services";
import { getServiceCategories, createServiceCategory, ServiceCategory } from "@/lib/api-service-categories";
import { getTaxProfiles, createTaxProfile, TaxProfile } from "@/lib/api-tax-profiles";
import { getBrands, getModelsByBrand, VehicleBrand, VehicleModel } from "@/lib/api-vehicles";
import { getParts, addPart, Part } from "@/lib/api-inventory";
import { getManufacturers, createManufacturer, Manufacturer } from "@/lib/api-manufacturers";
import { getPartCategories, createPartCategory, PartCategoryItem } from "@/lib/api-part-categories";

// ── Indian States ──

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

// ── Row types ──

interface ServiceRow {
  key: string;
  serviceId: string;
  description: string;
  hsnSac: string;
  qty: number;
  rate: number;
  gstRate: number;
  discount: number;
  gstInclusive: boolean;
}

interface PartRow {
  key: string;
  partId: string;
  description: string;
  hsnSac: string;
  qty: number;
  rate: number;
  gstRate: number;
  discount: number;
  gstInclusive: boolean;
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

// ── Create-Service form state ──

interface CreateServiceForm {
  name: string;
  price: string;
  serviceNumber: string;
  categoryId: string;
  categoryName: string;
  isGeneric: boolean;
  selectedBrands: { id: string; name: string }[];
  selectedModels: { brandId: string; modelId: string; modelName: string }[];
  hasGst: boolean;
  taxProfileId: string;
  sacNumber: string;
  gstRate: string;
}

const emptyServiceForm: CreateServiceForm = {
  name: "", price: "", serviceNumber: "", categoryId: "", categoryName: "",
  isGeneric: true, selectedBrands: [], selectedModels: [],
  hasGst: false, taxProfileId: "", sacNumber: "", gstRate: "",
};

// ── Create-Part form state ──

interface CreatePartForm {
  name: string;
  partNumber: string;
  mrp: string;
  sellingPrice: string;
  purchasePrice: string;
  manufacturerId: string;
  manufacturerName: string;
  categoryId: string;
  categoryName: string;
  taxProfileId: string;
  hsnCode: string;
  gstRate: string;
  isGeneric: boolean;
  selectedBrands: { id: string; name: string }[];
  selectedModels: { brandId: string; modelId: string; modelName: string }[];
  manualInventory: boolean;
  stockQty: string;
  minStockQty: string;
  rackNumber: string;
  unit: string;
}

const emptyPartForm: CreatePartForm = {
  name: "", partNumber: "", mrp: "", sellingPrice: "", purchasePrice: "",
  manufacturerId: "", manufacturerName: "", categoryId: "", categoryName: "",
  taxProfileId: "", hsnCode: "", gstRate: "",
  isGeneric: true, selectedBrands: [], selectedModels: [],
  manualInventory: false, stockQty: "", minStockQty: "", rackNumber: "", unit: "pcs",
};

export default function CreateInvoicePage() {
  const router = useRouter();

  // ── Invoice header state ──
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState("");
  const [posOpen, setPosOpen] = useState(false);
  const [posFilter, setPosFilter] = useState("");

  // ── Customer state ──
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [custSaving, setCustSaving] = useState(false);
  const custSearchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Services state ──
  const [serviceRows, setServiceRows] = useState<ServiceRow[]>([]);
  const [allServices, setAllServices] = useState<GarageService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceTaxProfiles, setServiceTaxProfiles] = useState<TaxProfile[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, VehicleModel[]>>({});

  // Choose Services modal
  const [chooseServicesOpen, setChooseServicesOpen] = useState(false);
  const [chooseServicesFilter, setChooseServicesFilter] = useState("");
  const [chooseServicesSelected, setChooseServicesSelected] = useState<Set<string>>(new Set());

  // Create Service modal
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [svcForm, setSvcForm] = useState<CreateServiceForm>(emptyServiceForm);
  const [svcSaving, setSvcSaving] = useState(false);

  // Category picker modal (inside Create Service)
  const [svcCategoryPickerOpen, setSvcCategoryPickerOpen] = useState(false);
  const [svcCategoryPickerFilter, setSvcCategoryPickerFilter] = useState("");
  const [svcCategoryCreating, setSvcCategoryCreating] = useState(false);
  const [svcCategoryNewName, setSvcCategoryNewName] = useState("");

  // GST Tax Category picker modal (inside Create Service)
  const [svcTaxPickerOpen, setSvcTaxPickerOpen] = useState(false);
  const [svcTaxPickerFilter, setSvcTaxPickerFilter] = useState("");

  // Brand/Model selection for specific services
  const [svcBrandPickerOpen, setSvcBrandPickerOpen] = useState(false);
  const [svcModelPickerBrandId, setSvcModelPickerBrandId] = useState<string | null>(null);

  // ── Parts state ──
  const [partRows, setPartRows] = useState<PartRow[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [partCategories, setPartCategories] = useState<PartCategoryItem[]>([]);
  const [goodsTaxProfiles, setGoodsTaxProfiles] = useState<TaxProfile[]>([]);

  // Choose Parts modal
  const [choosePartsOpen, setChoosePartsOpen] = useState(false);
  const [choosePartsFilter, setChoosePartsFilter] = useState("");
  const [choosePartsSelected, setChoosePartsSelected] = useState<Set<string>>(new Set());

  // Create Part modal
  const [createPartOpen, setCreatePartOpen] = useState(false);
  const [partForm, setPartForm] = useState<CreatePartForm>(emptyPartForm);
  const [partSaving, setPartSaving] = useState(false);

  // Part form picker modals
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

  // Brand/Model selection for specific parts
  const [partBrandPickerOpen, setPartBrandPickerOpen] = useState(false);
  const [partModelPickerBrandId, setPartModelPickerBrandId] = useState<string | null>(null);
  const [partModelsByBrand, setPartModelsByBrand] = useState<Record<string, VehicleModel[]>>({});

  // Create Tax Profile modal (shared)
  const [createTaxOpen, setCreateTaxOpen] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: "", taxPercent: "", sacNumber: "", taxType: "service" as "service" | "goods" });
  const [taxSaving, setTaxSaving] = useState(false);

  // GST dropdown per service/part row
  const [gstDropdownKey, setGstDropdownKey] = useState<string | null>(null);
  const [partGstDropdownKey, setPartGstDropdownKey] = useState<string | null>(null);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [tagPickerFilter, setTagPickerFilter] = useState("");
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagType, setNewTagType] = useState("invoice");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");
  const [tagSaving, setTagSaving] = useState(false);

  // Notify customer
  const [notifyEnabled, setNotifyEnabled] = useState(false);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Data fetching ──
  useEffect(() => {
    getGarageServices().then(setAllServices).catch(() => {});
    getServiceCategories().then(setCategories).catch(() => {});
    getTaxProfiles("service").then(setServiceTaxProfiles).catch(() => {});
    getTaxProfiles("goods").then(setGoodsTaxProfiles).catch(() => {});
    getBrands().then(setBrands).catch(() => {});
    getParts().then(setAllParts).catch(() => {});
    getManufacturers().then(setManufacturers).catch(() => {});
    getPartCategories().then(setPartCategories).catch(() => {});
    getTags("invoice").then(setAllTags).catch(() => {});
  }, []);

  // Customer search with debounce
  useEffect(() => {
    if (customerQuery.length < 2) { setCustomerResults([]); return; }
    clearTimeout(custSearchTimer.current);
    custSearchTimer.current = setTimeout(() => {
      searchCustomers(customerQuery).then(setCustomerResults).catch(() => setCustomerResults([]));
    }, 300);
    return () => clearTimeout(custSearchTimer.current);
  }, [customerQuery]);

  // Fetch models when brands selected in create-service form
  useEffect(() => {
    svcForm.selectedBrands.forEach(b => {
      if (!modelsByBrand[b.id]) {
        getModelsByBrand(b.id).then(models => {
          setModelsByBrand(prev => ({ ...prev, [b.id]: models }));
        }).catch(() => {});
      }
    });
  }, [svcForm.selectedBrands, modelsByBrand]);

  // Fetch models when brands selected in create-part form
  useEffect(() => {
    partForm.selectedBrands.forEach(b => {
      if (!partModelsByBrand[b.id]) {
        getModelsByBrand(b.id).then(models => {
          setPartModelsByBrand(prev => ({ ...prev, [b.id]: models }));
        }).catch(() => {});
      }
    });
  }, [partForm.selectedBrands, partModelsByBrand]);

  // ── Customer handlers ──
  function handleSelectCustomer(c: Customer) {
    setSelectedCustomer(c);
    setCustomerQuery(c.name);
    setShowCustomerDropdown(false);
    setError("");
  }

  async function handleCreateCustomer() {
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    setCustSaving(true);
    try {
      const c = await createCustomer({ name: newCustName.trim(), phone: newCustPhone.trim(), email: newCustEmail.trim() || undefined, address: newCustAddress.trim() || undefined, gstin: newCustGstin.trim() || undefined });
      setSelectedCustomer(c);
      setCustomerQuery(c.name);
      setAddCustomerOpen(false);
      setNewCustName(""); setNewCustPhone(""); setNewCustEmail(""); setNewCustAddress(""); setNewCustGstin("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally { setCustSaving(false); }
  }

  // ── Service row handlers ──
  const updateServiceRow = useCallback((key: string, field: keyof ServiceRow, value: string | number | boolean) => {
    setServiceRows(prev => prev.map(s => s.key === key ? { ...s, [field]: value } : s));
  }, []);

  function removeServiceRow(key: string) {
    setServiceRows(prev => prev.filter(s => s.key !== key));
  }

  // Add selected services from the Choose Services modal
  function handleAddSelectedServices() {
    const newRows: ServiceRow[] = [];
    chooseServicesSelected.forEach(svcId => {
      const svc = allServices.find(s => s.id === svcId);
      if (svc && !serviceRows.some(r => r.serviceId === svc.id)) {
        newRows.push({
          key: uid(), serviceId: svc.id, description: svc.name,
          hsnSac: svc.sacNumber || "", qty: 1, rate: svc.price,
          gstRate: svc.hasGst ? svc.gstRate : 0, discount: 0, gstInclusive: false,
        });
      }
    });
    setServiceRows(prev => [...prev, ...newRows]);
    setChooseServicesSelected(new Set());
    setChooseServicesOpen(false);
  }

  // ── Create Service handler ──
  async function handleCreateService() {
    if (!svcForm.name.trim() || !svcForm.price) return;
    setSvcSaving(true);
    try {
      const newSvc = await createGarageService({
        name: svcForm.name.trim(),
        price: parseFloat(svcForm.price) || 0,
        serviceNumber: svcForm.serviceNumber.trim() || undefined,
        categoryId: svcForm.categoryId || undefined,
        categoryName: svcForm.categoryName || undefined,
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
      setServiceRows(prev => [...prev, {
        key: uid(), serviceId: newSvc.id, description: newSvc.name,
        hsnSac: newSvc.sacNumber || "", qty: 1, rate: newSvc.price,
        gstRate: newSvc.hasGst ? newSvc.gstRate : 0, discount: 0, gstInclusive: false,
      }]);
      setCreateServiceOpen(false);
      setChooseServicesOpen(false);
      setSvcForm(emptyServiceForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally { setSvcSaving(false); }
  }

  // ── Create Category handler (for services) ──
  async function handleCreateServiceCategory() {
    if (!svcCategoryNewName.trim()) return;
    setSvcCategoryCreating(true);
    try {
      const cat = await createServiceCategory(svcCategoryNewName.trim());
      setCategories(prev => [...prev, cat]);
      setSvcForm(prev => ({ ...prev, categoryId: cat.id, categoryName: cat.name }));
      setSvcCategoryPickerOpen(false);
      setSvcCategoryNewName("");
    } catch { /* ignore */ } finally { setSvcCategoryCreating(false); }
  }

  // ── Part row handlers ──
  const updatePartRow = useCallback((key: string, field: keyof PartRow, value: string | number | boolean) => {
    setPartRows(prev => prev.map(p => p.key === key ? { ...p, [field]: value } : p));
  }, []);

  function removePartRow(key: string) {
    setPartRows(prev => prev.filter(p => p.key !== key));
  }

  // Add selected parts from the Choose Parts modal
  function handleAddSelectedParts() {
    const newRows: PartRow[] = [];
    choosePartsSelected.forEach(partId => {
      const part = allParts.find(p => p.id === partId);
      if (part && !partRows.some(r => r.partId === part.id)) {
        newRows.push({
          key: uid(), partId: part.id, description: part.name,
          hsnSac: part.hsnCode || "", qty: 1, rate: part.sellingPrice,
          gstRate: part.gstRate || 0, discount: 0, gstInclusive: false,
        });
      }
    });
    setPartRows(prev => [...prev, ...newRows]);
    setChoosePartsSelected(new Set());
    setChoosePartsOpen(false);
  }

  // ── Create Part handler ──
  async function handleCreatePart() {
    if (!partForm.name.trim() || !partForm.sellingPrice) return;
    setPartSaving(true);
    try {
      const newPart = await addPart({
        name: partForm.name.trim(),
        partNumber: partForm.partNumber.trim(),
        brand: partForm.manufacturerName || "",
        category: partForm.categoryName || "",
        categoryId: partForm.categoryId || undefined,
        manufacturerId: partForm.manufacturerId || undefined,
        manufacturerName: partForm.manufacturerName || undefined,
        taxProfileId: partForm.taxProfileId || undefined,
        mrp: parseFloat(partForm.mrp) || 0,
        sellingPrice: parseFloat(partForm.sellingPrice) || 0,
        purchasePrice: parseFloat(partForm.purchasePrice) || 0,
        stockQty: partForm.manualInventory ? (parseInt(partForm.stockQty) || 0) : 0,
        minStockQty: partForm.manualInventory ? (parseInt(partForm.minStockQty) || 0) : 0,
        rackNumber: partForm.manualInventory ? partForm.rackNumber.trim() : "",
        hsnCode: partForm.hsnCode.trim(),
        gstRate: parseFloat(partForm.gstRate) || 0,
        unit: partForm.manualInventory ? partForm.unit.trim() || "pcs" : "pcs",
        isGeneric: partForm.isGeneric,
        applicableBrands: partForm.isGeneric ? undefined : partForm.selectedBrands.map(b => ({
          brandId: b.id, brandName: b.name,
          modelIds: partForm.selectedModels.filter(m => m.brandId === b.id).map(m => m.modelId),
          modelNames: partForm.selectedModels.filter(m => m.brandId === b.id).map(m => m.modelName),
        })),
      });
      setAllParts(prev => [...prev, newPart]);
      setPartRows(prev => [...prev, {
        key: uid(), partId: newPart.id, description: newPart.name,
        hsnSac: newPart.hsnCode || "", qty: 1, rate: newPart.sellingPrice,
        gstRate: newPart.gstRate || 0, discount: 0, gstInclusive: false,
      }]);
      setCreatePartOpen(false);
      setChoosePartsOpen(false);
      setPartForm(emptyPartForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create part");
    } finally { setPartSaving(false); }
  }

  // ── Create Manufacturer handler ──
  async function handleCreateManufacturer() {
    if (!partMfgNewName.trim()) return;
    setPartMfgCreating(true);
    try {
      const mfg = await createManufacturer(partMfgNewName.trim());
      setManufacturers(prev => [...prev, mfg]);
      setPartForm(prev => ({ ...prev, manufacturerId: mfg.id, manufacturerName: mfg.name }));
      setPartMfgPickerOpen(false);
      setPartMfgNewName("");
    } catch { /* ignore */ } finally { setPartMfgCreating(false); }
  }

  // ── Create Part Category handler ──
  async function handleCreatePartCategory() {
    if (!partCatNewName.trim()) return;
    setPartCatCreating(true);
    try {
      const cat = await createPartCategory(partCatNewName.trim());
      setPartCategories(prev => [...prev, cat]);
      setPartForm(prev => ({ ...prev, categoryId: cat.id, categoryName: cat.name }));
      setPartCatPickerOpen(false);
      setPartCatNewName("");
    } catch { /* ignore */ } finally { setPartCatCreating(false); }
  }

  // ── Create Tax Profile handler ──
  async function handleCreateTaxProfile() {
    if (!taxForm.name.trim() || !taxForm.taxPercent) return;
    setTaxSaving(true);
    try {
      const profile = await createTaxProfile({
        name: taxForm.name.trim(),
        taxPercent: parseFloat(taxForm.taxPercent) || 0,
        sacNumber: taxForm.sacNumber.trim() || undefined,
        taxType: taxForm.taxType,
      });
      if (taxForm.taxType === "service") {
        setServiceTaxProfiles(prev => [...prev, profile]);
        setSvcForm(prev => ({
          ...prev, taxProfileId: profile.id,
          sacNumber: profile.sacNumber || prev.sacNumber,
          gstRate: String(profile.taxPercent),
        }));
      } else {
        setGoodsTaxProfiles(prev => [...prev, profile]);
        setPartForm(prev => ({
          ...prev, taxProfileId: profile.id,
          hsnCode: profile.sacNumber || prev.hsnCode,
          gstRate: String(profile.taxPercent),
        }));
      }
      setCreateTaxOpen(false);
      setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "service" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tax profile");
    } finally { setTaxSaving(false); }
  }

  // ── Tags ──
  function toggleTag(tagName: string) {
    setTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    setTagSaving(true);
    try {
      const created = await createTag({ name: newTagName.trim(), type: newTagType, color: newTagColor });
      setAllTags(prev => [...prev, created]);
      setTags(prev => [...prev, created.name]);
      setCreateTagOpen(false);
      setNewTagName(""); setNewTagType("invoice"); setNewTagColor("#3b82f6");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tag");
    } finally { setTagSaving(false); }
  }

  // ── Calculations ──
  const serviceCalcs = serviceRows.map(s => calcRow(s.qty, s.rate, s.discount, s.gstRate, s.gstInclusive));
  const serviceSubtotal = serviceCalcs.reduce((sum, c) => sum + c.amount, 0);
  const serviceGstTotal = serviceCalcs.reduce((sum, c) => sum + c.gstAmount, 0);

  const partCalcs = partRows.map(p => calcRow(p.qty, p.rate, p.discount, p.gstRate, p.gstInclusive));
  const partSubtotal = partCalcs.reduce((sum, c) => sum + c.amount, 0);
  const partGstTotal = partCalcs.reduce((sum, c) => sum + c.gstAmount, 0);

  const grandTotal = Math.round((serviceSubtotal + serviceGstTotal + partSubtotal + partGstTotal) * 100) / 100;

  // ── Submit ──
  async function handleSubmit() {
    if (!selectedCustomer) { setError("Please select a customer"); return; }
    if (serviceRows.length === 0 && partRows.length === 0) { setError("Add at least one service or part"); return; }

    setSubmitting(true);
    setError("");
    try {
      const serviceItems: InvoiceItem[] = serviceRows.map((s, i) => ({
        itemType: "service" as const, serviceId: s.serviceId, description: s.description,
        hsnSac: s.hsnSac, qty: s.qty, rate: s.rate, discount: s.discount,
        amount: serviceCalcs[i].amount, gstRate: s.gstRate,
        gstAmount: serviceCalcs[i].gstAmount, gstInclusive: s.gstInclusive,
      }));

      const partItems: InvoiceItem[] = partRows.map((p, i) => ({
        itemType: "part" as const, partId: p.partId, description: p.description,
        hsnSac: p.hsnSac, qty: p.qty, rate: p.rate, discount: p.discount,
        amount: partCalcs[i].amount, gstRate: p.gstRate,
        gstAmount: partCalcs[i].gstAmount, gstInclusive: p.gstInclusive,
      }));

      const items = [...serviceItems, ...partItems];

      const created = await createInvoice({
        type: "tax",
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items,
        tags: tags.length > 0 ? tags : undefined,
        totalAmount: serviceSubtotal + partSubtotal,
        gstAmount: serviceGstTotal + partGstTotal,
        grandTotal,
        date,
        placeOfSupply: placeOfSupply || undefined,
      });

      // Send notification email if enabled
      if (notifyEnabled && created.id) {
        try {
          await notifyCustomer(created.id);
        } catch {
          // Notification failure shouldn't block navigation
        }
      }

      router.push("/dashboard/invoices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally { setSubmitting(false); }
  }

  const inputCls = "w-full px-3 py-2 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background";
  const labelCls = "block text-xs font-medium text-secondary mb-1";
  const smallInputCls = "w-full px-2 py-1.5 border border-edge rounded text-sm text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary bg-background";

  // filtered states for place-of-supply dropdown
  const filteredStates = INDIAN_STATES.filter(s => s.toLowerCase().includes(posFilter.toLowerCase()));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-edge px-6 py-3.5 flex items-center gap-4 shrink-0">
        <button onClick={() => router.back()} className="p-1.5 text-muted hover:text-foreground hover:bg-hover rounded-md transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Create Invoice</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

          {/* ──────── Customer Section ──────── */}
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-secondary">Customer</h3>
            </div>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-dim rounded-md px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedCustomer.name}</p>
                  <p className="text-xs text-muted">{selectedCustomer.phone}{selectedCustomer.email ? ` · ${selectedCustomer.email}` : ""}</p>
                  {selectedCustomer.gstin && <p className="text-xs text-muted">GSTIN: {selectedCustomer.gstin}</p>}
                </div>
                <button onClick={() => { setSelectedCustomer(null); setCustomerQuery(""); }}
                  className="text-xs text-primary font-medium hover:bg-primary-light px-2 py-1 rounded transition-colors">
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input type="text" value={customerQuery}
                      onChange={e => { setCustomerQuery(e.target.value); setShowCustomerDropdown(true); setError(""); }}
                      onFocus={() => { if (customerQuery.length >= 2) setShowCustomerDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="Search customer by name or phone..."
                      className={`${inputCls} pl-9`} />
                    {showCustomerDropdown && customerResults.length > 0 && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customerResults.map(c => (
                          <button key={c.id} onMouseDown={() => handleSelectCustomer(c)}
                            className="w-full text-left px-4 py-2.5 hover:bg-hover transition-colors border-b border-edge-light last:border-0">
                            <p className="text-sm font-medium text-foreground">{c.name}</p>
                            <p className="text-xs text-muted">{c.phone}</p>
                          </button>
                        ))}
                      </div>
                    )}
                    {showCustomerDropdown && customerQuery.length >= 2 && customerResults.length === 0 && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg p-4 text-center">
                        <p className="text-sm text-muted mb-2">No customers found</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setAddCustomerOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors whitespace-nowrap">
                    <Plus className="w-4 h-4 inline -mt-0.5 mr-1" />Add New
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ──────── Date + Place of Supply ──────── */}
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Invoice Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
              </div>
              <div className="relative">
                <label className={labelCls}>Place of Supply</label>
                <button onClick={() => setPosOpen(!posOpen)}
                  className={`${inputCls} text-left flex items-center justify-between`}>
                  <span className={placeOfSupply ? "text-foreground" : "text-muted"}>
                    {placeOfSupply || "Select state..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted" />
                </button>
                {posOpen && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-60 flex flex-col">
                    <div className="px-3 py-2 border-b border-edge-light">
                      <input type="text" value={posFilter} onChange={e => setPosFilter(e.target.value)}
                        placeholder="Search state..." autoFocus
                        className="w-full px-2 py-1.5 border border-edge rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {filteredStates.map(s => (
                        <button key={s} onClick={() => { setPlaceOfSupply(s); setPosOpen(false); setPosFilter(""); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-hover transition-colors ${placeOfSupply === s ? "bg-primary-light text-primary font-medium" : "text-secondary"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ──────── Services Section ──────── */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-secondary">Services</h3>
                {serviceRows.length > 0 && (
                  <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{serviceRows.length}</span>
                )}
              </div>
              <button onClick={() => { setChooseServicesOpen(true); setChooseServicesFilter(""); setChooseServicesSelected(new Set()); }}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:bg-primary-light px-2.5 py-1.5 rounded transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Service
              </button>
            </div>
            <div className="p-4 space-y-3">
              {serviceRows.map((s, idx) => {
                const c = serviceCalcs[idx];
                return (
                  <div key={s.key} className="border border-edge-light rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{s.description}</p>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <span className="text-[11px] text-muted">GST Inclusive</span>
                          <button onClick={() => updateServiceRow(s.key, "gstInclusive", !s.gstInclusive)}
                            className={`relative w-8 h-4.5 rounded-full transition-colors ${s.gstInclusive ? "bg-primary" : "bg-edge"}`}>
                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${s.gstInclusive ? "left-[calc(100%-1rem)]" : "left-0.5"}`} />
                          </button>
                        </label>
                        <button onClick={() => removeServiceRow(s.key)} className="p-1 text-muted hover:text-bad hover:bg-bad-light rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 items-end">
                      <div className="relative">
                        <label className={labelCls}>GST %</label>
                        <button onClick={() => setGstDropdownKey(gstDropdownKey === s.key ? null : s.key)}
                          className="w-full flex items-center justify-between px-2 py-1.5 border border-edge rounded text-sm bg-background">
                          <span>{s.gstRate}%</span>
                          <ChevronDown className="w-3 h-3 text-muted" />
                        </button>
                        {gstDropdownKey === s.key && (
                          <div className="absolute z-30 top-full left-0 mt-1 min-w-[180px] bg-background border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {serviceTaxProfiles.map(tp => (
                              <button key={tp.id} onClick={() => { updateServiceRow(s.key, "gstRate", tp.taxPercent); if (tp.sacNumber) updateServiceRow(s.key, "hsnSac", tp.sacNumber); setGstDropdownKey(null); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-hover ${s.gstRate === tp.taxPercent ? "bg-primary-light text-primary" : "text-secondary"}`}>
                                {tp.name} ({tp.taxPercent}%)
                              </button>
                            ))}
                            {serviceTaxProfiles.length === 0 && (
                              <p className="px-3 py-2 text-xs text-muted">No profiles yet</p>
                            )}
                            <div className="border-t border-edge">
                              <button onClick={() => { setGstDropdownKey(null); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "service" }); setCreateTaxOpen(true); }}
                                className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-primary-light">
                                + Create GST Profile
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>SAC</label>
                        <input type="text" value={s.hsnSac} onChange={e => updateServiceRow(s.key, "hsnSac", e.target.value)} className={smallInputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Qty</label>
                        <input type="number" min={1} value={s.qty} onChange={e => updateServiceRow(s.key, "qty", parseInt(e.target.value) || 1)} className={smallInputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Rate</label>
                        {canViewFinancial("INVOICES") ? (
                          <input type="number" min={0} value={s.rate || ""} onChange={e => updateServiceRow(s.key, "rate", parseFloat(e.target.value) || 0)} className={smallInputCls} placeholder="0" />
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">-</div>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Disc %</label>
                        <input type="number" min={0} max={100} value={s.discount || ""} onChange={e => updateServiceRow(s.key, "discount", parseFloat(e.target.value) || 0)} className={smallInputCls} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelCls}>Amount</label>
                        <div className="px-2 py-1.5 text-sm text-right text-foreground font-medium bg-dim rounded">{canViewFinancial("INVOICES") ? c.amount.toLocaleString("en-IN") : "-"}</div>
                      </div>
                      <div>
                        <label className={labelCls}>GST Amt</label>
                        <div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">{canViewFinancial("INVOICES") ? c.gstAmount.toLocaleString("en-IN") : "-"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {serviceRows.length === 0 && (
                <p className="text-sm text-muted text-center py-6">No services added. Click &quot;Add Service&quot; to begin.</p>
              )}
            </div>
          </div>

          {/* ──────── Parts Section ──────── */}
          <div className="bg-background rounded-lg border border-edge overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-dim border-b border-edge">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-secondary">Parts</h3>
                {partRows.length > 0 && (
                  <span className="text-xs bg-primary-light text-primary px-1.5 py-0.5 rounded-full">{partRows.length}</span>
                )}
              </div>
              <button onClick={() => { setChoosePartsOpen(true); setChoosePartsFilter(""); setChoosePartsSelected(new Set()); }}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:bg-primary-light px-2.5 py-1.5 rounded transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Part
              </button>
            </div>
            <div className="p-4 space-y-3">
              {partRows.map((p, idx) => {
                const c = partCalcs[idx];
                return (
                  <div key={p.key} className="border border-edge-light rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{p.description}</p>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <span className="text-[11px] text-muted">GST Inclusive</span>
                          <button onClick={() => updatePartRow(p.key, "gstInclusive", !p.gstInclusive)}
                            className={`relative w-8 h-4.5 rounded-full transition-colors ${p.gstInclusive ? "bg-primary" : "bg-edge"}`}>
                            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${p.gstInclusive ? "left-[calc(100%-1rem)]" : "left-0.5"}`} />
                          </button>
                        </label>
                        <button onClick={() => removePartRow(p.key)} className="p-1 text-muted hover:text-bad hover:bg-bad-light rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 items-end">
                      <div className="relative">
                        <label className={labelCls}>GST %</label>
                        <button onClick={() => setPartGstDropdownKey(partGstDropdownKey === p.key ? null : p.key)}
                          className="w-full flex items-center justify-between px-2 py-1.5 border border-edge rounded text-sm bg-background">
                          <span>{p.gstRate}%</span>
                          <ChevronDown className="w-3 h-3 text-muted" />
                        </button>
                        {partGstDropdownKey === p.key && (
                          <div className="absolute z-30 top-full left-0 mt-1 min-w-[180px] bg-background border border-edge rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {goodsTaxProfiles.map(tp => (
                              <button key={tp.id} onClick={() => { updatePartRow(p.key, "gstRate", tp.taxPercent); if (tp.sacNumber) updatePartRow(p.key, "hsnSac", tp.sacNumber); setPartGstDropdownKey(null); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-hover ${p.gstRate === tp.taxPercent ? "bg-primary-light text-primary" : "text-secondary"}`}>
                                {tp.name} ({tp.taxPercent}%)
                              </button>
                            ))}
                            {goodsTaxProfiles.length === 0 && (
                              <p className="px-3 py-2 text-xs text-muted">No goods profiles yet</p>
                            )}
                            <div className="border-t border-edge">
                              <button onClick={() => { setPartGstDropdownKey(null); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "goods" }); setCreateTaxOpen(true); }}
                                className="w-full text-left px-3 py-2 text-sm text-primary font-medium hover:bg-primary-light">
                                + Create GST Profile
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>HSN</label>
                        <input type="text" value={p.hsnSac} onChange={e => updatePartRow(p.key, "hsnSac", e.target.value)} className={smallInputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Qty</label>
                        <input type="number" min={1} value={p.qty} onChange={e => updatePartRow(p.key, "qty", parseInt(e.target.value) || 1)} className={smallInputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Rate</label>
                        {canViewFinancial("INVOICES") ? (
                          <input type="number" min={0} value={p.rate || ""} onChange={e => updatePartRow(p.key, "rate", parseFloat(e.target.value) || 0)} className={smallInputCls} placeholder="0" />
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">-</div>
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>Disc %</label>
                        <input type="number" min={0} max={100} value={p.discount || ""} onChange={e => updatePartRow(p.key, "discount", parseFloat(e.target.value) || 0)} className={smallInputCls} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelCls}>Amount</label>
                        <div className="px-2 py-1.5 text-sm text-right text-foreground font-medium bg-dim rounded">{canViewFinancial("INVOICES") ? c.amount.toLocaleString("en-IN") : "-"}</div>
                      </div>
                      <div>
                        <label className={labelCls}>GST Amt</label>
                        <div className="px-2 py-1.5 text-sm text-right text-muted bg-dim rounded">{canViewFinancial("INVOICES") ? c.gstAmount.toLocaleString("en-IN") : "-"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {partRows.length === 0 && (
                <p className="text-sm text-muted text-center py-6">No parts added. Click &quot;Add Part&quot; to begin.</p>
              )}
            </div>
          </div>

          {/* ──────── Tags Section ──────── */}
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted" />
                <h3 className="text-sm font-semibold text-secondary">Tags</h3>
              </div>
              <button onClick={() => setTagPickerOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:bg-primary-light px-3 py-1.5 rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Tag
              </button>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map(t => {
                  const tagObj = allTags.find(at => at.name === t);
                  const color = tagObj?.color || "#3b82f6";
                  return (
                    <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: color + "18", color }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {t}
                      <button onClick={() => setTags(prev => prev.filter(x => x !== t))} className="hover:opacity-70 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No tags added. Click &quot;Add Tag&quot; to choose or create tags.</p>
            )}
          </div>

          {/* ──────── Notify Customer ──────── */}
          <div className="bg-background rounded-lg border border-edge p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                  <Mail className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Notify Customer</p>
                  <p className="text-xs text-muted">Send invoice PDF to customer via email after creation</p>
                </div>
              </div>
              <button
                onClick={() => setNotifyEnabled(prev => !prev)}
                className={`relative w-11 h-6 rounded-full transition-colors ${notifyEnabled ? "bg-primary" : "bg-edge"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifyEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
            {notifyEnabled && selectedCustomer && !selectedCustomer.email && (
              <p className="mt-2 text-xs text-warn">Customer does not have an email address. Notification will be skipped.</p>
            )}
          </div>

          {/* ──────── Summary ──────── */}
          {canViewFinancial("INVOICES") && (
          <div className="bg-background rounded-lg border border-edge p-5">
            <h3 className="text-sm font-semibold text-secondary mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-secondary">
                <span>Services Subtotal</span>
                <span>{serviceSubtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Services GST</span>
                <span>{serviceGstTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Parts Subtotal</span>
                <span>{partSubtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-secondary">
                <span>Parts GST</span>
                <span>{partGstTotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-foreground font-bold text-base border-t border-edge pt-2">
                <span className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> Grand Total</span>
                <span>{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-bad-light border border-bad/20 rounded-md px-4 py-3">
              <p className="text-sm text-bad">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-6">
            <button onClick={() => router.back()} className="px-5 py-2.5 text-sm font-medium text-secondary bg-background border border-edge rounded-md hover:bg-hover transition-colors">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
              {submitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </div>
      </div>

      {/* ════════ MODALS ════════ */}

      {/* ── Tag Picker Modal ── */}
      {tagPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setTagPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Select Tags</h3>
              <button onClick={() => setTagPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 pt-3">
              <input type="text" value={tagPickerFilter} onChange={e => setTagPickerFilter(e.target.value)}
                placeholder="Search tags..." className={inputCls} autoFocus />
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1">
              {allTags.filter(t => t.name.toLowerCase().includes(tagPickerFilter.toLowerCase())).map(t => {
                const selected = tags.includes(t.name);
                return (
                  <button key={t.id} onClick={() => toggleTag(t.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selected ? "bg-primary-light" : "hover:bg-hover"}`}>
                    <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: t.color, backgroundColor: selected ? t.color : "transparent" }}>
                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-sm text-foreground font-medium">{t.name}</span>
                    <span className="text-xs text-muted ml-auto">{t.type}</span>
                  </button>
                );
              })}
              {allTags.filter(t => t.name.toLowerCase().includes(tagPickerFilter.toLowerCase())).length === 0 && (
                <p className="text-sm text-muted text-center py-4">No tags found.</p>
              )}
            </div>
            <div className="px-5 py-3 border-t border-edge flex justify-between">
              <button onClick={() => { setCreateTagOpen(true); }} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:bg-primary-light px-3 py-2 rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create Tag
              </button>
              <button onClick={() => setTagPickerOpen(false)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Tag Modal ── */}
      {createTagOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreateTagOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Create Tag</h3>
              <button onClick={() => setCreateTagOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Name <span className="text-bad">*</span></label>
                <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Tag name" className={inputCls} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <select value={newTagType} onChange={e => setNewTagType(e.target.value)} className={inputCls}>
                  <option value="invoice">Invoice</option>
                  <option value="order">Order</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Color</label>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#6366f1", "#14b8a6"].map(c => (
                      <button key={c} onClick={() => setNewTagColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${newTagColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-muted">Preview:</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: newTagColor + "18", color: newTagColor }}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: newTagColor }} />
                  {newTagName || "Tag name"}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setCreateTagOpen(false)} className="px-4 py-2 text-sm font-medium text-secondary border border-edge rounded-md hover:bg-hover transition-colors">Cancel</button>
              <button onClick={handleCreateTag} disabled={!newTagName.trim() || tagSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {tagSaving ? "Saving..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Customer Modal ── */}
      {addCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddCustomerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Add New Customer</h3>
              <button onClick={() => setAddCustomerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Name <span className="text-bad">*</span></label>
                <input type="text" value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="Customer name" className={inputCls} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Phone <span className="text-bad">*</span></label>
                <input type="tel" maxLength={10} value={newCustPhone} onChange={e => setNewCustPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit phone" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} placeholder="Email address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input type="text" value={newCustAddress} onChange={e => setNewCustAddress(e.target.value)} placeholder="Address" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>GSTIN</label>
                <input type="text" value={newCustGstin} onChange={e => setNewCustGstin(e.target.value)} placeholder="GSTIN (optional)" className={inputCls} />
              </div>
              <button onClick={handleCreateCustomer} disabled={custSaving || !newCustName.trim() || !newCustPhone.trim()}
                className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {custSaving ? "Saving..." : "Add Customer"}
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
              <button onClick={() => setChooseServicesOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={chooseServicesFilter} onChange={e => setChooseServicesFilter(e.target.value)}
                  placeholder="Search services..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {allServices
                .filter(s => s.name.toLowerCase().includes(chooseServicesFilter.toLowerCase()))
                .map(svc => {
                  const checked = chooseServicesSelected.has(svc.id);
                  const alreadyAdded = serviceRows.some(r => r.serviceId === svc.id);
                  return (
                    <button key={svc.id} disabled={alreadyAdded}
                      onClick={() => {
                        setChooseServicesSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(svc.id)) next.delete(svc.id); else next.add(svc.id);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 ${alreadyAdded ? "opacity-40" : "hover:bg-hover"}`}>
                      <span className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-edge"}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                        <p className="text-xs text-muted">
                          {svc.categoryName ? `${svc.categoryName} · ` : ""}
                          {canViewFinancial("INVOICES") ? `Rs ${svc.price}` : ""}
                          {canViewFinancial("INVOICES") && svc.hasGst ? ` · GST ${svc.gstRate}%` : ""}
                          {alreadyAdded ? " (Already added)" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              {allServices.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No services in your catalog yet. Create one below.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3 flex gap-2">
              <button onClick={() => { setSvcForm(emptyServiceForm); setCreateServiceOpen(true); }}
                className="flex-1 py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                + Create Service
              </button>
              {chooseServicesSelected.size > 0 && (
                <button onClick={handleAddSelectedServices}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                  Add {chooseServicesSelected.size} Service{chooseServicesSelected.size > 1 ? "s" : ""}
                </button>
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
              <button onClick={() => setCreateServiceOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Name + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Service Name <span className="text-bad">*</span></label>
                  <input type="text" value={svcForm.name} onChange={e => setSvcForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Engine Oil Change" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Price (MRP) <span className="text-bad">*</span></label>
                  <input type="number" min={0} value={svcForm.price} onChange={e => setSvcForm(p => ({ ...p, price: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
              </div>
              {/* Service No + Category (modal picker) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Service No.</label>
                  <input type="text" value={svcForm.serviceNumber} onChange={e => setSvcForm(p => ({ ...p, serviceNumber: e.target.value }))} placeholder="Optional" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Service Category</label>
                  <button onClick={() => { setSvcCategoryPickerOpen(true); setSvcCategoryPickerFilter(""); setSvcCategoryNewName(""); }}
                    className={`${inputCls} text-left flex items-center justify-between`}>
                    <span className={svcForm.categoryName ? "text-foreground" : "text-muted"}>
                      {svcForm.categoryName || "Select category..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>

              {/* Generic / Specific toggle */}
              <div>
                <label className={labelCls}>Service Type</label>
                <div className="flex gap-2">
                  <button onClick={() => setSvcForm(p => ({ ...p, isGeneric: true }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${svcForm.isGeneric ? "bg-primary text-white border-primary" : "bg-background text-secondary border-edge hover:bg-hover"}`}>
                    Generic Service
                  </button>
                  <button onClick={() => setSvcForm(p => ({ ...p, isGeneric: false }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${!svcForm.isGeneric ? "bg-primary text-white border-primary" : "bg-background text-secondary border-edge hover:bg-hover"}`}>
                    Specific Service
                  </button>
                </div>
              </div>

              {/* Specific: brand + model selection */}
              {!svcForm.isGeneric && (
                <div className="space-y-3 bg-dim rounded-lg p-3">
                  <div>
                    <label className={labelCls}>Applicable Brands <span className="text-bad">*</span></label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {svcForm.selectedBrands.map(b => (
                        <span key={b.id} className="inline-flex items-center gap-1 bg-primary-light text-primary text-xs font-medium px-2 py-1 rounded-full">
                          {b.name}
                          <button onClick={() => setSvcForm(p => ({
                            ...p,
                            selectedBrands: p.selectedBrands.filter(x => x.id !== b.id),
                            selectedModels: p.selectedModels.filter(m => m.brandId !== b.id),
                          }))} className="hover:bg-primary/10 rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <button onClick={() => setSvcBrandPickerOpen(!svcBrandPickerOpen)}
                        className={`${inputCls} text-left text-xs`}>
                        {svcForm.selectedBrands.length === 0 ? "Select brands..." : `${svcForm.selectedBrands.length} brand(s) selected`}
                      </button>
                      {svcBrandPickerOpen && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {brands.map(b => {
                            const sel = svcForm.selectedBrands.some(x => x.id === b.id);
                            return (
                              <button key={b.id} onClick={() => {
                                setSvcForm(p => ({
                                  ...p,
                                  selectedBrands: sel
                                    ? p.selectedBrands.filter(x => x.id !== b.id)
                                    : [...p.selectedBrands, { id: b.id, name: b.name }],
                                  selectedModels: sel ? p.selectedModels.filter(m => m.brandId !== b.id) : p.selectedModels,
                                }));
                              }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover text-left">
                                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-primary border-primary" : "border-edge"}`}>
                                  {sel && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                {b.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {svcForm.selectedBrands.map(b => {
                    const bModels = modelsByBrand[b.id] || [];
                    const selModels = svcForm.selectedModels.filter(m => m.brandId === b.id);
                    return (
                      <div key={b.id}>
                        <label className={labelCls}>Models for {b.name}</label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {selModels.map(m => (
                            <span key={m.modelId} className="inline-flex items-center gap-1 bg-hover text-secondary text-xs px-2 py-0.5 rounded-full">
                              {m.modelName}
                              <button onClick={() => setSvcForm(p => ({ ...p, selectedModels: p.selectedModels.filter(x => x.modelId !== m.modelId) }))}
                                className="hover:text-bad"><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <button onClick={() => setSvcModelPickerBrandId(svcModelPickerBrandId === b.id ? null : b.id)}
                            className={`${inputCls} text-left text-xs`}>
                            {selModels.length === 0 ? "Select models..." : `${selModels.length} model(s) selected`}
                          </button>
                          {svcModelPickerBrandId === b.id && (
                            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-32 overflow-y-auto">
                              {bModels.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-muted">No models for this brand</p>
                              ) : bModels.map(model => {
                                const mSel = selModels.some(m => m.modelId === model.id);
                                return (
                                  <button key={model.id} onClick={() => {
                                    setSvcForm(p => ({
                                      ...p,
                                      selectedModels: mSel
                                        ? p.selectedModels.filter(m => m.modelId !== model.id)
                                        : [...p.selectedModels, { brandId: b.id, modelId: model.id, modelName: model.name }],
                                    }));
                                  }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-hover text-left">
                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${mSel ? "bg-primary border-primary" : "border-edge"}`}>
                                      {mSel && <Check className="w-2.5 h-2.5 text-white" />}
                                    </span>
                                    {model.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* GST Details toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={svcForm.hasGst}
                    onChange={e => setSvcForm(p => ({ ...p, hasGst: e.target.checked }))}
                    className="w-4 h-4 rounded border-edge text-primary focus:ring-primary" />
                  <span className="text-sm text-secondary font-medium">GST Details</span>
                </label>
              </div>

              {svcForm.hasGst && (
                <div className="grid grid-cols-3 gap-3 bg-dim rounded-lg p-3">
                  <div>
                    <label className={labelCls}>GST Tax Category</label>
                    <button onClick={() => { setSvcTaxPickerOpen(true); setSvcTaxPickerFilter(""); }}
                      className={`${inputCls} text-left flex items-center justify-between text-xs`}>
                      <span className={svcForm.taxProfileId ? "text-foreground" : "text-muted"}>
                        {svcForm.taxProfileId
                          ? (serviceTaxProfiles.find(t => t.id === svcForm.taxProfileId)?.name || "Selected")
                          : "Select..."}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted" />
                    </button>
                  </div>
                  <div>
                    <label className={labelCls}>SAC Number</label>
                    <input type="text" value={svcForm.sacNumber} onChange={e => setSvcForm(p => ({ ...p, sacNumber: e.target.value }))} placeholder="e.g. 998714" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>GST %</label>
                    <input type="number" min={0} max={100} value={svcForm.gstRate} onChange={e => setSvcForm(p => ({ ...p, gstRate: e.target.value }))} placeholder="18" className={inputCls} />
                  </div>
                </div>
              )}

              <button onClick={handleCreateService} disabled={svcSaving || !svcForm.name.trim() || !svcForm.price}
                className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {svcSaving ? "Saving..." : "Create & Add to Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Service Category Picker Modal ── */}
      {svcCategoryPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSvcCategoryPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Select Category</h3>
              <button onClick={() => setSvcCategoryPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={svcCategoryPickerFilter} onChange={e => setSvcCategoryPickerFilter(e.target.value)}
                  placeholder="Search categories..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {categories
                .filter(c => c.name.toLowerCase().includes(svcCategoryPickerFilter.toLowerCase()))
                .map(cat => (
                  <button key={cat.id} onClick={() => {
                    setSvcForm(p => ({ ...p, categoryId: cat.id, categoryName: cat.name }));
                    setSvcCategoryPickerOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 hover:bg-hover`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${svcForm.categoryId === cat.id ? "border-primary" : "border-edge"}`}>
                      {svcForm.categoryId === cat.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm text-foreground">{cat.name}</span>
                  </button>
                ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No categories yet.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3">
              {svcCategoryCreating ? (
                <div className="flex gap-2">
                  <input type="text" value={svcCategoryNewName} onChange={e => setSvcCategoryNewName(e.target.value)}
                    placeholder="New category name" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateServiceCategory(); } }}
                    className={`flex-1 ${inputCls} text-xs`} />
                  <button onClick={handleCreateServiceCategory} disabled={!svcCategoryNewName.trim()}
                    className="px-3 py-2 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">Save</button>
                  <button onClick={() => { setSvcCategoryCreating(false); setSvcCategoryNewName(""); }}
                    className="px-2 py-2 text-xs text-muted hover:text-secondary">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setSvcCategoryCreating(true)}
                  className="w-full py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                  + Create Category
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Service Tax Profile Picker Modal ── */}
      {svcTaxPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSvcTaxPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Select GST Tax Category</h3>
              <button onClick={() => setSvcTaxPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={svcTaxPickerFilter} onChange={e => setSvcTaxPickerFilter(e.target.value)}
                  placeholder="Search tax profiles..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {serviceTaxProfiles
                .filter(tp => tp.name.toLowerCase().includes(svcTaxPickerFilter.toLowerCase()))
                .map(tp => (
                  <button key={tp.id} onClick={() => {
                    setSvcForm(p => ({
                      ...p, taxProfileId: tp.id,
                      sacNumber: tp.sacNumber || p.sacNumber,
                      gstRate: String(tp.taxPercent),
                    }));
                    setSvcTaxPickerOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 hover:bg-hover`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${svcForm.taxProfileId === tp.id ? "border-primary" : "border-edge"}`}>
                      {svcForm.taxProfileId === tp.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <div>
                      <p className="text-sm text-foreground">{tp.name}</p>
                      <p className="text-xs text-muted">{tp.taxPercent}%{tp.sacNumber ? ` · SAC: ${tp.sacNumber}` : ""}</p>
                    </div>
                  </button>
                ))}
              {serviceTaxProfiles.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No service tax profiles yet.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3">
              <button onClick={() => { setSvcTaxPickerOpen(false); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "service" }); setCreateTaxOpen(true); }}
                className="w-full py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                + Create Tax Profile
              </button>
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
              <button onClick={() => setChoosePartsOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={choosePartsFilter} onChange={e => setChoosePartsFilter(e.target.value)}
                  placeholder="Search parts..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {allParts
                .filter(p => p.name.toLowerCase().includes(choosePartsFilter.toLowerCase()) || p.partNumber.toLowerCase().includes(choosePartsFilter.toLowerCase()))
                .map(part => {
                  const checked = choosePartsSelected.has(part.id);
                  const alreadyAdded = partRows.some(r => r.partId === part.id);
                  return (
                    <button key={part.id} disabled={alreadyAdded}
                      onClick={() => {
                        setChoosePartsSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(part.id)) next.delete(part.id); else next.add(part.id);
                          return next;
                        });
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 ${alreadyAdded ? "opacity-40" : "hover:bg-hover"}`}>
                      <span className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-edge"}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{part.name}</p>
                        <p className="text-xs text-muted">
                          {part.partNumber ? `#${part.partNumber} · ` : ""}
                          {canViewFinancial("INVOICES") ? `Rs ${part.sellingPrice}` : ""}
                          {canViewFinancial("INVOICES") && part.gstRate ? ` · GST ${part.gstRate}%` : ""}
                          {` · Stock: ${part.stockQty}`}
                          {alreadyAdded ? " (Already added)" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              {allParts.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No parts in your inventory yet. Create one below.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3 flex gap-2">
              <button onClick={() => { setPartForm(emptyPartForm); setCreatePartOpen(true); }}
                className="flex-1 py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                + Create Part
              </button>
              {choosePartsSelected.size > 0 && (
                <button onClick={handleAddSelectedParts}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors">
                  Add {choosePartsSelected.size} Part{choosePartsSelected.size > 1 ? "s" : ""}
                </button>
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
              <button onClick={() => setCreatePartOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Part Name + Part No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Part Name <span className="text-bad">*</span></label>
                  <input type="text" value={partForm.name} onChange={e => setPartForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Brake Pad" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className={labelCls}>Part No.</label>
                  <input type="text" value={partForm.partNumber} onChange={e => setPartForm(p => ({ ...p, partNumber: e.target.value }))} placeholder="Optional" className={inputCls} />
                </div>
              </div>

              {/* MRP + Selling Price + Purchase Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>MRP</label>
                  <input type="number" min={0} value={partForm.mrp} onChange={e => setPartForm(p => ({ ...p, mrp: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Selling Price <span className="text-bad">*</span></label>
                  <input type="number" min={0} value={partForm.sellingPrice} onChange={e => setPartForm(p => ({ ...p, sellingPrice: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Purchase Price</label>
                  <input type="number" min={0} value={partForm.purchasePrice} onChange={e => setPartForm(p => ({ ...p, purchasePrice: e.target.value }))} placeholder="0" className={inputCls} />
                </div>
              </div>

              {/* Manufacturer (modal picker) + Part Category (modal picker) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Manufacturer</label>
                  <button onClick={() => { setPartMfgPickerOpen(true); setPartMfgPickerFilter(""); setPartMfgNewName(""); setPartMfgCreating(false); }}
                    className={`${inputCls} text-left flex items-center justify-between`}>
                    <span className={partForm.manufacturerName ? "text-foreground" : "text-muted"}>
                      {partForm.manufacturerName || "Select..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Part Category</label>
                  <button onClick={() => { setPartCatPickerOpen(true); setPartCatPickerFilter(""); setPartCatNewName(""); setPartCatCreating(false); }}
                    className={`${inputCls} text-left flex items-center justify-between`}>
                    <span className={partForm.categoryName ? "text-foreground" : "text-muted"}>
                      {partForm.categoryName || "Select..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>

              {/* GST Category (modal picker) + HSN Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>GST Category</label>
                  <button onClick={() => { setPartTaxPickerOpen(true); setPartTaxPickerFilter(""); }}
                    className={`${inputCls} text-left flex items-center justify-between`}>
                    <span className={partForm.taxProfileId ? "text-foreground" : "text-muted"}>
                      {partForm.taxProfileId
                        ? (goodsTaxProfiles.find(t => t.id === partForm.taxProfileId)?.name || "Selected")
                        : "Select..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </button>
                </div>
                <div>
                  <label className={labelCls}>HSN Code</label>
                  <input type="text" value={partForm.hsnCode} onChange={e => setPartForm(p => ({ ...p, hsnCode: e.target.value }))} placeholder="e.g. 8708" className={inputCls} />
                </div>
              </div>

              {/* GST % (read from selected profile or manual) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>GST %</label>
                  <input type="number" min={0} max={100} value={partForm.gstRate} onChange={e => setPartForm(p => ({ ...p, gstRate: e.target.value }))} placeholder="18" className={inputCls} />
                </div>
              </div>

              {/* Generic / Specific toggle */}
              <div>
                <label className={labelCls}>Part Type</label>
                <div className="flex gap-2">
                  <button onClick={() => setPartForm(p => ({ ...p, isGeneric: true }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${partForm.isGeneric ? "bg-primary text-white border-primary" : "bg-background text-secondary border-edge hover:bg-hover"}`}>
                    Generic Part
                  </button>
                  <button onClick={() => setPartForm(p => ({ ...p, isGeneric: false }))}
                    className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${!partForm.isGeneric ? "bg-primary text-white border-primary" : "bg-background text-secondary border-edge hover:bg-hover"}`}>
                    Specific Part
                  </button>
                </div>
              </div>

              {/* Specific: brand + model selection */}
              {!partForm.isGeneric && (
                <div className="space-y-3 bg-dim rounded-lg p-3">
                  <div>
                    <label className={labelCls}>Applicable Brands <span className="text-bad">*</span></label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {partForm.selectedBrands.map(b => (
                        <span key={b.id} className="inline-flex items-center gap-1 bg-primary-light text-primary text-xs font-medium px-2 py-1 rounded-full">
                          {b.name}
                          <button onClick={() => setPartForm(p => ({
                            ...p,
                            selectedBrands: p.selectedBrands.filter(x => x.id !== b.id),
                            selectedModels: p.selectedModels.filter(m => m.brandId !== b.id),
                          }))} className="hover:bg-primary/10 rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="relative">
                      <button onClick={() => setPartBrandPickerOpen(!partBrandPickerOpen)}
                        className={`${inputCls} text-left text-xs`}>
                        {partForm.selectedBrands.length === 0 ? "Select brands..." : `${partForm.selectedBrands.length} brand(s) selected`}
                      </button>
                      {partBrandPickerOpen && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {brands.map(b => {
                            const sel = partForm.selectedBrands.some(x => x.id === b.id);
                            return (
                              <button key={b.id} onClick={() => {
                                setPartForm(p => ({
                                  ...p,
                                  selectedBrands: sel
                                    ? p.selectedBrands.filter(x => x.id !== b.id)
                                    : [...p.selectedBrands, { id: b.id, name: b.name }],
                                  selectedModels: sel ? p.selectedModels.filter(m => m.brandId !== b.id) : p.selectedModels,
                                }));
                              }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-hover text-left">
                                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? "bg-primary border-primary" : "border-edge"}`}>
                                  {sel && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                {b.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  {partForm.selectedBrands.map(b => {
                    const bModels = partModelsByBrand[b.id] || [];
                    const selModels = partForm.selectedModels.filter(m => m.brandId === b.id);
                    return (
                      <div key={b.id}>
                        <label className={labelCls}>Models for {b.name}</label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {selModels.map(m => (
                            <span key={m.modelId} className="inline-flex items-center gap-1 bg-hover text-secondary text-xs px-2 py-0.5 rounded-full">
                              {m.modelName}
                              <button onClick={() => setPartForm(p => ({ ...p, selectedModels: p.selectedModels.filter(x => x.modelId !== m.modelId) }))}
                                className="hover:text-bad"><X className="w-2.5 h-2.5" /></button>
                            </span>
                          ))}
                        </div>
                        <div className="relative">
                          <button onClick={() => setPartModelPickerBrandId(partModelPickerBrandId === b.id ? null : b.id)}
                            className={`${inputCls} text-left text-xs`}>
                            {selModels.length === 0 ? "Select models..." : `${selModels.length} model(s) selected`}
                          </button>
                          {partModelPickerBrandId === b.id && (
                            <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-background border border-edge rounded-md shadow-lg max-h-32 overflow-y-auto">
                              {bModels.length === 0 ? (
                                <p className="px-3 py-2 text-xs text-muted">No models for this brand</p>
                              ) : bModels.map(model => {
                                const mSel = selModels.some(m => m.modelId === model.id);
                                return (
                                  <button key={model.id} onClick={() => {
                                    setPartForm(p => ({
                                      ...p,
                                      selectedModels: mSel
                                        ? p.selectedModels.filter(m => m.modelId !== model.id)
                                        : [...p.selectedModels, { brandId: b.id, modelId: model.id, modelName: model.name }],
                                    }));
                                  }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-hover text-left">
                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${mSel ? "bg-primary border-primary" : "border-edge"}`}>
                                      {mSel && <Check className="w-2.5 h-2.5 text-white" />}
                                    </span>
                                    {model.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Manual Inventory toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={partForm.manualInventory}
                    onChange={e => setPartForm(p => ({ ...p, manualInventory: e.target.checked }))}
                    className="w-4 h-4 rounded border-edge text-primary focus:ring-primary" />
                  <span className="text-sm text-secondary font-medium">Manual Inventory</span>
                </label>
              </div>

              {partForm.manualInventory && (
                <div className="grid grid-cols-2 gap-3 bg-dim rounded-lg p-3">
                  <div>
                    <label className={labelCls}>Stock Qty</label>
                    <input type="number" min={0} value={partForm.stockQty} onChange={e => setPartForm(p => ({ ...p, stockQty: e.target.value }))} placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Min Stock Qty</label>
                    <input type="number" min={0} value={partForm.minStockQty} onChange={e => setPartForm(p => ({ ...p, minStockQty: e.target.value }))} placeholder="0" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Rack Number</label>
                    <input type="text" value={partForm.rackNumber} onChange={e => setPartForm(p => ({ ...p, rackNumber: e.target.value }))} placeholder="e.g. A1" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Unit</label>
                    <input type="text" value={partForm.unit} onChange={e => setPartForm(p => ({ ...p, unit: e.target.value }))} placeholder="pcs" className={inputCls} />
                  </div>
                </div>
              )}

              <button onClick={handleCreatePart} disabled={partSaving || !partForm.name.trim() || !partForm.sellingPrice}
                className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {partSaving ? "Saving..." : "Create & Add to Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manufacturer Picker Modal ── */}
      {partMfgPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPartMfgPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Select Manufacturer</h3>
              <button onClick={() => setPartMfgPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={partMfgPickerFilter} onChange={e => setPartMfgPickerFilter(e.target.value)}
                  placeholder="Search manufacturers..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {manufacturers
                .filter(m => m.name.toLowerCase().includes(partMfgPickerFilter.toLowerCase()))
                .map(mfg => (
                  <button key={mfg.id} onClick={() => {
                    setPartForm(p => ({ ...p, manufacturerId: mfg.id, manufacturerName: mfg.name }));
                    setPartMfgPickerOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 hover:bg-hover`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${partForm.manufacturerId === mfg.id ? "border-primary" : "border-edge"}`}>
                      {partForm.manufacturerId === mfg.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm text-foreground">{mfg.name}</span>
                  </button>
                ))}
              {manufacturers.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No manufacturers yet.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3">
              {partMfgCreating ? (
                <div className="flex gap-2">
                  <input type="text" value={partMfgNewName} onChange={e => setPartMfgNewName(e.target.value)}
                    placeholder="New manufacturer name" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateManufacturer(); } }}
                    className={`flex-1 ${inputCls} text-xs`} />
                  <button onClick={handleCreateManufacturer} disabled={!partMfgNewName.trim()}
                    className="px-3 py-2 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">Save</button>
                  <button onClick={() => { setPartMfgCreating(false); setPartMfgNewName(""); }}
                    className="px-2 py-2 text-xs text-muted hover:text-secondary">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setPartMfgCreating(true)}
                  className="w-full py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                  + Create Manufacturer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Part Category Picker Modal ── */}
      {partCatPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPartCatPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Select Part Category</h3>
              <button onClick={() => setPartCatPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={partCatPickerFilter} onChange={e => setPartCatPickerFilter(e.target.value)}
                  placeholder="Search categories..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {partCategories
                .filter(c => c.name.toLowerCase().includes(partCatPickerFilter.toLowerCase()))
                .map(cat => (
                  <button key={cat.id} onClick={() => {
                    setPartForm(p => ({ ...p, categoryId: cat.id, categoryName: cat.name }));
                    setPartCatPickerOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 hover:bg-hover`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${partForm.categoryId === cat.id ? "border-primary" : "border-edge"}`}>
                      {partForm.categoryId === cat.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <span className="text-sm text-foreground">{cat.name}</span>
                  </button>
                ))}
              {partCategories.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No part categories yet.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3">
              {partCatCreating ? (
                <div className="flex gap-2">
                  <input type="text" value={partCatNewName} onChange={e => setPartCatNewName(e.target.value)}
                    placeholder="New category name" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreatePartCategory(); } }}
                    className={`flex-1 ${inputCls} text-xs`} />
                  <button onClick={handleCreatePartCategory} disabled={!partCatNewName.trim()}
                    className="px-3 py-2 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">Save</button>
                  <button onClick={() => { setPartCatCreating(false); setPartCatNewName(""); }}
                    className="px-2 py-2 text-xs text-muted hover:text-secondary">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setPartCatCreating(true)}
                  className="w-full py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                  + Create Category
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Part GST Tax Profile Picker Modal ── */}
      {partTaxPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPartTaxPickerOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
              <h3 className="text-base font-semibold text-foreground">Select GST Tax Category</h3>
              <button onClick={() => setPartTaxPickerOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 border-b border-edge-light">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={partTaxPickerFilter} onChange={e => setPartTaxPickerFilter(e.target.value)}
                  placeholder="Search tax profiles..." autoFocus
                  className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              {goodsTaxProfiles
                .filter(tp => tp.name.toLowerCase().includes(partTaxPickerFilter.toLowerCase()))
                .map(tp => (
                  <button key={tp.id} onClick={() => {
                    setPartForm(p => ({
                      ...p, taxProfileId: tp.id,
                      hsnCode: tp.sacNumber || p.hsnCode,
                      gstRate: String(tp.taxPercent),
                    }));
                    setPartTaxPickerOpen(false);
                  }}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-b border-edge-light last:border-0 hover:bg-hover`}>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${partForm.taxProfileId === tp.id ? "border-primary" : "border-edge"}`}>
                      {partForm.taxProfileId === tp.id && <span className="w-2 h-2 rounded-full bg-primary" />}
                    </span>
                    <div>
                      <p className="text-sm text-foreground">{tp.name}</p>
                      <p className="text-xs text-muted">{tp.taxPercent}%{tp.sacNumber ? ` · HSN: ${tp.sacNumber}` : ""}</p>
                    </div>
                  </button>
                ))}
              {goodsTaxProfiles.length === 0 && (
                <p className="text-sm text-muted text-center py-8">No goods tax profiles yet.</p>
              )}
            </div>
            <div className="border-t border-edge px-4 py-3">
              <button onClick={() => { setPartTaxPickerOpen(false); setTaxForm({ name: "", taxPercent: "", sacNumber: "", taxType: "goods" }); setCreateTaxOpen(true); }}
                className="w-full py-2.5 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary-light transition-colors">
                + Create Tax Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Tax Profile Modal ── */}
      {createTaxOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/30" onClick={() => setCreateTaxOpen(false)} />
          <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Create Tax Profile</h3>
              <button onClick={() => setCreateTaxOpen(false)} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Tax Name <span className="text-bad">*</span></label>
                <input type="text" value={taxForm.name} onChange={e => setTaxForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. GST 18% Service" className={inputCls} autoFocus />
              </div>
              <div>
                <label className={labelCls}>Tax % <span className="text-bad">*</span></label>
                <input type="number" min={0} max={100} value={taxForm.taxPercent} onChange={e => setTaxForm(p => ({ ...p, taxPercent: e.target.value }))} placeholder="18" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{taxForm.taxType === "service" ? "SAC Number" : "HSN Code"}</label>
                <input type="text" value={taxForm.sacNumber} onChange={e => setTaxForm(p => ({ ...p, sacNumber: e.target.value }))} placeholder={taxForm.taxType === "service" ? "e.g. 998714" : "e.g. 8708"} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tax Type</label>
                <div className="flex gap-2">
                  {(["service", "goods"] as const).map(t => (
                    <button key={t} onClick={() => setTaxForm(p => ({ ...p, taxType: t }))}
                      className={`flex-1 py-2 text-xs font-medium rounded-md border transition-colors ${taxForm.taxType === t ? "bg-primary text-white border-primary" : "bg-background text-secondary border-edge hover:bg-hover"}`}>
                      {t === "service" ? "Service" : "Goods"}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCreateTaxProfile} disabled={taxSaving || !taxForm.name.trim() || !taxForm.taxPercent}
                className="w-full py-2.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50">
                {taxSaving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
