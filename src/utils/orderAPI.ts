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

/** Open orders only; dueDate is YYYY-MM-DD (today or later), reason is required */
export function updateOrderDueDate(id: string, payload: { dueDate: string; reason: string }): Promise<Order> {
  return apiRequest(`/api/orders/${id}/due-date`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** One line of an order items edit: existing lines carry `id` + `previous` (for the conflict check), new lines don't */
export interface OrderItemEditLine {
  id?: string;
  productServiceId?: string | null;
  itemName?: string;
  selectedVariant?: string | null;
  itemDescription?: string;
  category?: string;
  itemType?: "product" | "service";
  isCustom?: boolean;
  quantity: number;
  finalUnitPrice: number;
  priceAdjustmentReason?: string | null;
  previous?: { quantity: number; finalUnitPrice: number; quantityCompleted: number };
}

/**
 * Open orders only (any employee). Add / remove lines, change quantity or unit price; reason required.
 * 409 (`conflict`) if the order changed since it was loaded; 400 if the new total is below what's already paid.
 */
export function updateOrderItems(
  id: string,
  payload: { reason: string; expectedTotal: number; items: OrderItemEditLine[]; removedItemIds: string[] }
): Promise<Order> {
  return apiRequest(`/api/orders/${id}/items`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateItemProduction(
  orderId: string,
  payload: {
    /** previousQuantityCompleted = the value the user started from; the server answers 409 if it changed meanwhile */
    items?: { id: string; quantityCompleted: number; previousQuantityCompleted?: number }[];
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
