"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  createNotificationStream,
  type Notification,
  type NotificationPage,
} from "@/lib/api-notifications";
import { isLoggedIn } from "@/lib/auth";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  latestNotification: Notification | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail — don't disrupt UI
    }
  }, []);

  const fetchNotifications = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setLoading(true);
        const data: NotificationPage = await getNotifications(pageNum, 20);
        if (append) {
          setNotifications((prev) => [...prev, ...data.content]);
        } else {
          setNotifications(data.content);
        }
        setHasMore(!data.last);
        setPage(pageNum);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchNotifications(page + 1, true);
  }, [loading, hasMore, page, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await apiMarkAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently fail
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(0), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // SSE connection with auto-reconnect
  const connectSSE = useCallback(() => {
    if (!isLoggedIn()) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = createNotificationStream();
    if (!es) return;

    eventSourceRef.current = es;

    es.addEventListener("notification", (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        setLatestNotification(notification);

        // Show OS-level desktop notification
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          window.Notification.permission === "granted"
        ) {
          try {
            const osNotif = new window.Notification(
              notification.title || "Car Affair",
              {
                body: notification.message || "New notification",
                icon: "/icon-192.png",
                tag: notification.id || "notif-" + Date.now(),
              }
            );
            osNotif.onclick = () => {
              window.focus();
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
              osNotif.close();
            };
          } catch {
            // Silently fail — OS notification is optional
          }
        }

        // Clear the toast after 5 seconds
        setTimeout(() => setLatestNotification(null), 5000);
      } catch {
        // Silently fail on parse error
      }
    });

    es.addEventListener("connected", () => {
      reconnectAttemptsRef.current = 0;
    });

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptsRef.current),
        30000
      );
      reconnectAttemptsRef.current++;

      reconnectTimeoutRef.current = setTimeout(() => {
        if (isLoggedIn()) {
          connectSSE();
        }
      }, delay);
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isLoggedIn()) return;

    fetchUnreadCount();
    fetchNotifications(0);
    connectSSE();

    // Request notification permission for OS-level desktop alerts
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      window.Notification.permission === "default"
    ) {
      window.Notification.requestPermission();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchUnreadCount, fetchNotifications, connectSSE]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
        refresh,
        latestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
