// Service Worker for Web Push Notifications - Car Affair

self.addEventListener("push", function (event) {
  console.log("[SW] Push event received!", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log("[SW] Push data:", JSON.stringify(data));
  } catch (e) {
    console.error("[SW] Failed to parse push data:", e);
    data = { title: "Car Affair", message: "You have a new notification" };
  }

  const options = {
    body: data.message || "New notification",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    data: { url: data.actionUrl || "/dashboard" },
    tag: data.id || "notification-" + Date.now(),
    requireInteraction: data.priority === "urgent" || data.priority === "high",
  };

  console.log("[SW] Showing notification:", data.title, options);

  event.waitUntil(
    self.registration
      .showNotification(data.title || "Car Affair", options)
      .then(function () {
        console.log("[SW] showNotification resolved successfully");
      })
      .catch(function (err) {
        console.error("[SW] showNotification FAILED:", err);
      })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        // Focus existing window if available
        for (const client of windowClients) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
