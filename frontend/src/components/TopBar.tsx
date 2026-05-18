"use client";

import { useEffect, useState } from "react";
import { getUser, User } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/context/ThemeContext";
import { Search, QrCode, Bell, Menu, X, Sun, Moon } from "lucide-react";

export default function TopBar() {
  const [user, setUserState] = useState<User | null>(null);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setUserState(getUser());
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1280) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-9999 flex w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between w-full px-4 py-3 xl:px-6">
        {/* Left — hamburger + info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 xl:border xl:border-gray-200 xl:dark:border-gray-800"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.garageName || "My Garage"}
            </span>
            <span className="text-gray-300 dark:text-gray-600 select-none">/</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user?.name || "User"}
            </span>
          </div>
        </div>

        {/* Center — search (desktop only) */}
        <div className="hidden xl:block flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search name, jobcard, phone, email..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-800 dark:text-white/90 placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300 dark:focus:border-brand-800 transition-shadow"
            />
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          <button className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
            <QrCode className="w-5 h-5" />
          </button>

          <div className="ml-1 w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center">
            <span className="text-xs font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
