// casiguro-app/src/utils/notificationAPI.ts
import { apiRequest } from "./RestAPI";
import type { AppNotification } from "@/types";

export function getNotifications(): Promise<AppNotification[]> {
  return apiRequest("/api/notifications", { method: "GET" });
}

export function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiRequest("/api/notifications/unread-count", { method: "GET" });
}

export function markNotificationRead(id: string): Promise<{ message: string; id: string }> {
  return apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(): Promise<{ message: string }> {
  return apiRequest("/api/notifications/read-all", { method: "PATCH" });
}

