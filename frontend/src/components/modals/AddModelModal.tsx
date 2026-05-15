"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { FUEL_TYPES, VEHICLE_CATEGORIES, FuelType, VehicleCategory } from "@/lib/vehicle-data";

interface AddModelModalProps {
  open: boolean;
  brandName: string;
  onSave: (data: { name: string; fuelType: FuelType; category: VehicleCategory }) => void;
  onClose: () => void;
}

export default function AddModelModal({ open, brandName, onSave, onClose }: AddModelModalProps) {
  const [name, setName] = useState("");
  const [fuelType, setFuelType] = useState<FuelType | "">("");
  const [category, setCategory] = useState<VehicleCategory | "">("");
  const [fuelOpen, setFuelOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) { setName(""); setFuelType(""); setCategory(""); setErrors({}); setFuelOpen(false); setCatOpen(false); }
  }, [open]);

  function handleSave() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Model name is required";
    if (!fuelType) e.fuelType = "Select fuel type";
    if (!category) e.category = "Select category";
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSave({ name: name.trim(), fuelType: fuelType as FuelType, category: category as VehicleCategory });
  }

  if (!open) return null;

  const inputCls = "w-full px-3.5 py-2.5 border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
  const dropBtnCls = "w-full flex items-center justify-between px-3.5 py-2.5 border border-edge rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
          <div>
            <h3 className="text-base font-semibold text-foreground">Create Model</h3>
            <p className="text-xs text-muted mt-0.5">Brand: {brandName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1.5">Model Name <span className="text-bad">*</span></label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }} placeholder="Enter model name" className={inputCls} />
            {errors.name && <p className="text-xs text-bad mt-1">{errors.name}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-secondary mb-1.5">Fuel Type <span className="text-bad">*</span></label>
            <button type="button" onClick={() => { setFuelOpen(!fuelOpen); setCatOpen(false); }} className={dropBtnCls}>
              <span className={fuelType ? "text-foreground" : "text-muted"}>{fuelType || "Select fuel type"}</span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </button>
            {fuelOpen && (
              <div className="absolute z-10 mt-1 w-full bg-background border border-edge rounded-md shadow-lg py-1">
                {FUEL_TYPES.map((ft) => (
                  <button key={ft} onClick={() => { setFuelType(ft); setFuelOpen(false); setErrors((p) => ({ ...p, fuelType: "" })); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${fuelType === ft ? "bg-primary-light text-primary font-medium" : "text-secondary hover:bg-hover"}`}>
                    {ft}
                  </button>
                ))}
              </div>
            )}
            {errors.fuelType && <p className="text-xs text-bad mt-1">{errors.fuelType}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-secondary mb-1.5">Category <span className="text-bad">*</span></label>
            <button type="button" onClick={() => { setCatOpen(!catOpen); setFuelOpen(false); }} className={dropBtnCls}>
              <span className={category ? "text-foreground" : "text-muted"}>{category || "Select category"}</span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </button>
            {catOpen && (
              <div className="absolute z-10 mt-1 w-full bg-background border border-edge rounded-md shadow-lg py-1">
                {VEHICLE_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => { setCategory(cat); setCatOpen(false); setErrors((p) => ({ ...p, category: "" })); }}
                    className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${category === cat ? "bg-primary-light text-primary font-medium" : "text-secondary hover:bg-hover"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {errors.category && <p className="text-xs text-bad mt-1">{errors.category}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-edge text-primary focus:ring-primary" />
            Link parts and services of existing model
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-edge">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-secondary hover:bg-hover rounded-md transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}
