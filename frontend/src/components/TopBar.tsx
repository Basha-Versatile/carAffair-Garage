"use client";

import { useEffect, useState } from "react";
import { getUser, User } from "@/lib/auth";
import { Search, QrCode, Bell } from "lucide-react";

export default function TopBar() {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  return (
    <header className="h-14 bg-background border-b border-edge flex items-center justify-between px-5 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate">
          {user?.garageName || "My Garage"}
        </span>
        <span className="text-edge select-none">/</span>
        <span className="text-sm text-muted truncate">{user?.name || "User"}</span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search name, jobcard, phone, email..."
            className="w-full pl-9 pr-4 py-1.75 bg-dim border border-edge rounded-md text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button className="p-2 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button className="p-2 text-muted hover:text-secondary hover:bg-hover rounded-md transition-colors">
          <QrCode className="w-4.5 h-4.5" />
        </button>
        <div className="ml-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
      </div>
    </header>
  );
}
