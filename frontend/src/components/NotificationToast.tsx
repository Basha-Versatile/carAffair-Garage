"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";

export default function NotificationToast() {
  const { latestNotification } = useNotifications();
  const [visible, setVisible] = useState(false);
  const [currentNotif, setCurrentNotif] = useState(latestNotification);
  const router = useRouter();

  useEffect(() => {
    if (latestNotification) {
      setCurrentNotif(latestNotification);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  if (!visible || !currentNotif) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div
        className="flex items-start gap-3 p-4 max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        onClick={() => {
          if (currentNotif.actionUrl) {
            router.push(currentNotif.actionUrl);
          }
          setVisible(false);
        }}
      >
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${getPriorityColor(currentNotif.priority)}`}
        >
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentNotif.title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
            {currentNotif.message}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400";
    case "high":
      return "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400";
    case "normal":
      return "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
  }
}
