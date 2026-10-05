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

export function updateItemProduction(
  orderId: string,
  payload: {
    items?: { id: string; quantityCompleted: number }[];
    itemId?: string;
    quantityCompleted?: number;
    allowIncompletePaymentCompletion?: boolean;
  }
): Promise<{ message: string; order: Order }> {
  return apiRequest(`/api/orders/${orderId}/production`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function recordPayment(
  orderId: string,
  payload: { amount: number; paymentMethod?: string; note?: string }
): Promise<{ message: string; payment: any; order: Order }> {
  return apiRequest(`/api/orders/${orderId}/payment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
