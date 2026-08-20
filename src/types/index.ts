export type OrderType = "custom" | "stock";
export type OrderStatus = "pending" | "in_production" | "ready" | "completed";
export type PaymentStatusKey = "unpaid" | "partial" | "paid";
export type NotificationType = "new_order" | "status_update" | "detail_update";
export type PageKey = "dashboard" | "orders" | "production" | "completed" | "statistics" | "notifications";

/**
 * Canonical Order record. This shape is intentionally flat so it can be
 * dropped straight into API/DB-backed state later without reshaping the UI.
 */
export interface Order {
  id: string;
  refNo: string;
  customerName: string;
  contactNumber: string;
  product: string;
  category: string;
  orderType: OrderType;
  quantity: number;
  quantityCompleted: number;
  unitPrice: number;
  totalPrice: number; // auto-computed: quantity * unitPrice
  amountPaid: number;
  balance: number; // auto-computed: totalPrice - amountPaid
  paymentStatus: PaymentStatusKey;
  status: OrderStatus;
  notes: string;
  dateOrdered: string; // ISO date "YYYY-MM-DD"
  dueDate: string; // ISO date "YYYY-MM-DD"
  dateCompleted?: string; // ISO date "YYYY-MM-DD", set when status === "completed"
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  user: string;
  orderRef: string;
  customerName: string;
  detail: string;
  timestamp: Date;
}

/** Payload collected from the "New Order" modal, before computed fields are added. */
export interface NewOrderFormData {
  customerName: string;
  contactNumber: string;
  product: string;
  category: string;
  quantity: number;
  unitPrice: number;
  notes: string;
  dateOrdered: string;
  dueDate: string;
  orderType: OrderType;
}

/** Payload from the Production Monitoring "Update Order" modal. */
export interface OrderUpdatePayload {
  unitPrice: number;
  amountPaid: number;
  quantity: number;
  quantityCompleted: number;
  status: OrderStatus;
  paymentStatus: PaymentStatusKey;
}
