// casiguro-app/src/utils/socket.ts
import { io, Socket } from "socket.io-client";
import type { AppNotification, Order } from "@/types";

const SOCKET_URL = "http://localhost:5000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] Disconnected from server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("[WebSocket] Connection error:", error.message);
    });
  }

  return socket;
}

export function subscribeToOrders(
  onCreated: (order: Order) => void,
  onUpdated: (order: Order) => void
) {
  const s = getSocket();

  const handleCreated = (order: Order) => onCreated(order);
  const handleUpdated = (order: Order) => onUpdated(order);

  s.on("order:created", handleCreated);
  s.on("order:updated", handleUpdated);

  return () => {
    s.off("order:created", handleCreated);
    s.off("order:updated", handleUpdated);
  };
}

export function subscribeToNotifications(
  onNotification: (notification: AppNotification) => void
) {
  const s = getSocket();

  const handleNotif = (notif: AppNotification) => onNotification(notif);

  s.on("notification:new", handleNotif);

  return () => {
    s.off("notification:new", handleNotif);
  };
}

