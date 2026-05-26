"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  Calendar,
  CreditCard,
  Users,
  Settings,
  Loader2,
} from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import type { Notification } from "@/lib/api-notifications";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button with badge */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[480px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 dark:border-gray-750 transition-colors ${
                      n.read
                        ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                        : "bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    }`}
                  >
                    {/* Category icon */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${getCategoryStyle(n.category)}`}
                    >
                      {getCategoryIcon(n.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm leading-snug ${
                            n.read
                              ? "text-gray-600 dark:text-gray-400"
                              : "text-gray-900 dark:text-white font-medium"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-brand-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Load more */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-3 text-xs text-brand-500 hover:text-brand-600 font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "INVENTORY":
      return <Package className="w-4 h-4" />;
    case "APPOINTMENTS":
      return <Calendar className="w-4 h-4" />;
    case "PAYMENTS":
      return <CreditCard className="w-4 h-4" />;
    case "STAFF":
      return <Users className="w-4 h-4" />;
    case "SYSTEM":
      return <Settings className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
}

function getCategoryStyle(category: string): string {
  switch (category) {
    case "INVENTORY":
      return "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400";
    case "APPOINTMENTS":
      return "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400";
    case "PAYMENTS":
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400";
    case "STAFF":
      return "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
    case "SYSTEM":
      return "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
