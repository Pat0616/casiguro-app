// casiguro-app/src/utils/orderAPI.ts
import { apiRequest } from "./RestAPI";
import type { NewOrderFormData, Order, OrderDocuments, OrderUpdatePayload, PaymentInput } from "@/types";

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

export function updateOrderDocuments(id: string, documents: OrderDocuments): Promise<Order> {
  return apiRequest(`/api/orders/${id}/documents`, {
    method: "PUT",
    body: JSON.stringify(documents),
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

// Payments: each call returns the full updated order (amount paid / balance / status are recomputed server-side)
export function recordPayment(orderId: string, payment: PaymentInput): Promise<Order> {
  return apiRequest(`/api/orders/${orderId}/payments`, {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

// Admin only. The entry stays on record, marked voided, and stops counting toward the balance.
export function voidPayment(orderId: string, paymentId: string, reason: string): Promise<Order> {
  return apiRequest(`/api/orders/${orderId}/payments/${paymentId}/void`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

// Admin only. Rejected while the order still has non-voided payments.
export function cancelOrder(orderId: string, reason: string): Promise<Order> {
  return apiRequest(`/api/orders/${orderId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}
