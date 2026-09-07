// casiguro-app/src/utils/orderAPI.ts
import { apiRequest } from "./RestAPI";
import type { NewOrderFormData, Order, OrderUpdatePayload } from "@/types";

export function getOrders(): Promise<Order[]> {
  return apiRequest("/api/orders", { method: "GET" });
}

export function getOrderById(id: string): Promise<Order> {
  return apiRequest(`/api/orders/${id}`, { method: "GET" });
}

export function createOrder(data: NewOrderFormData): Promise<Order> {
  return apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOrder(id: string, payload: OrderUpdatePayload): Promise<Order> {
  return apiRequest(`/api/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

