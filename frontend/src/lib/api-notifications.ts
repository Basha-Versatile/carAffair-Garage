import { api, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

export interface Notification {
  id: string;
  garageId: string | null;
  recipientUserId: string;
  recipientRole: string | null;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface NotificationPreference {
  id?: string;
  userId?: string;
  garageId?: string;
  inventoryEnabled: boolean;
  appointmentsEnabled: boolean;
  paymentsEnabled: boolean;
  staffEnabled: boolean;
  systemEnabled: boolean;
  pushEnabled: boolean;
}

export function getNotifications(
  page = 0,
  size = 20
): Promise<NotificationPage> {
  return api.get<NotificationPage>(
    `/api/notifications?page=${page}&size=${size}`
  );
}

export function getUnreadCount(): Promise<number> {
  return api.get<number>("/api/notifications/unread-count");
}

export function markAsRead(id: string): Promise<void> {
  return apiFetch<void>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAsRead(): Promise<void> {
  return apiFetch<void>("/api/notifications/read-all", { method: "PATCH" });
}

export function getPreferences(): Promise<NotificationPreference> {
  return api.get<NotificationPreference>("/api/notifications/preferences");
}

export function updatePreferences(
  prefs: NotificationPreference
): Promise<NotificationPreference> {
  return api.put<NotificationPreference>(
    "/api/notifications/preferences",
    prefs
  );
}

export function subscribePush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
}): Promise<void> {
  return api.post<void>("/api/notifications/push-subscribe", subscription);
}

export function unsubscribePush(endpoint: string): Promise<void> {
  return apiFetch<void>("/api/notifications/push-subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}

/**
 * Get VAPID public key for push subscription.
 */
export async function getVapidPublicKey(): Promise<string> {
  const res = await api.get<{ publicKey: string }>(
    "/api/notifications/vapid-public-key"
  );
  return res.publicKey;
}

/**
 * Create an SSE EventSource for real-time notifications.
 * Token is passed as query param since EventSource doesn't support headers.
 */
export function createNotificationStream(): EventSource | null {
  const token = getAccessToken();
  if (!token) return null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  return new EventSource(`${baseUrl}/api/notifications/stream?token=${token}`);
}

/**
 * Convert a Base64 URL-safe string to a Uint8Array (for applicationServerKey).
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register service worker and subscribe to browser push notifications.
 * Returns true if successfully subscribed, false otherwise.
 */
export async function registerPushSubscription(): Promise<boolean> {
  try {
    // Check browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported in this browser");
      return false;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return false;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Get VAPID public key from backend
    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Always unsubscribe old subscription and create fresh one
    // to ensure VAPID key matches (avoids 403 from push service)
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      await existingSub.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    // Extract keys and send to backend
    const key = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    if (!key || !auth) {
      console.error("Missing push subscription keys");
      return false;
    }

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await subscribePush({
      endpoint: subscription.endpoint,
      p256dh,
      auth: authStr,
      userAgent: navigator.userAgent,
    });

    console.log("Push notification subscription registered successfully");
    return true;
  } catch (error) {
    console.error("Failed to register push subscription:", error);
    return false;
  }
}
