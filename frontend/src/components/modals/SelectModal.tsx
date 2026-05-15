"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";

interface SelectModalProps {
  open: boolean;
  title: string;
  items: { id: string; label: string; sublabel?: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  actionButton?: { label: string; onClick: () => void };
}

export default function SelectModal({ open, title, items, selectedId, onSelect, onClose, actionButton }: SelectModalProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setSearch(""); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);

  if (!open) return null;

  const filtered = items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-secondary hover:bg-hover rounded-sm transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-edge-light">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-9 pr-4 py-2 bg-dim border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted">No results found</div>
          ) : (
            filtered.map((item) => {
              const active = selectedId === item.id;
              return (
                <button key={item.id} onClick={() => onSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${active ? "bg-primary-light" : "hover:bg-hover"}`}>
                  <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? "border-primary" : "border-edge"}`}>
                    {active && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    {item.sublabel && <p className="text-xs text-muted">{item.sublabel}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Action */}
        {actionButton && (
          <div className="border-t border-edge px-4 py-3">
            <button onClick={actionButton.onClick}
              className="w-full text-center text-sm font-medium text-primary hover:bg-primary-light py-2 rounded-md transition-colors">
              + {actionButton.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
