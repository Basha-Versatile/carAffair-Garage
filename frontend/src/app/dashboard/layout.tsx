"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();
  if (!isMobileOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden"
      onClick={toggleMobileSidebar}
    />
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered } = useSidebar();
  const showFull = isExpanded || isHovered;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <Backdrop />
      <div
        className={`flex-1 flex flex-col overflow-hidden min-w-0 transition-all duration-300
          ${showFull ? "xl:ml-[240px]" : "xl:ml-[72px]"}`}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
    else setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
