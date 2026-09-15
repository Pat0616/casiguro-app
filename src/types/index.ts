export type OrderType = "custom" | "stock";
export type OrderStatus = "pending" | "in_production" | "ready" | "completed";
export type PaymentStatusKey = "unpaid" | "partial" | "paid";
export type NotificationType = "new_order" | "status_update" | "detail_update" | "quotation_update";
export type PageKey =
  | "dashboard"
  | "orders"
  | "production"
  | "completed"
  | "customers"
  | "statistics"
  | "notifications"
  | "products-services";

export type CustomerPaymentFilter = "all" | "unpaid" | "partial" | "paid";
export type CatalogItemType = "product" | "service";
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface CatalogItem {
  id: string;
  name: string;
  type: CatalogItemType;
  basePrice: number;
  defaultUnitPrice?: number;
  description: string;
  isStockItem: boolean;
  isActive: boolean;
  categoryId?: string | null;
  categoryName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationItem {
  id?: string;
  quotationId?: string;
  productServiceId?: string | null;
  itemName: string;
  itemDescription?: string;
  category?: string;
  itemType: CatalogItemType;
  isCustom: boolean;
  quantity: number;
  basePrice: number;
  finalUnitPrice: number;
  priceAdjustmentReason?: string | null;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quoteNo: string;
  customerId?: string | null;
  customerName: string;
  contactNumber: string;
  status: QuotationStatus;
  validUntil: string;
  totalAmount: number;
  notes: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  convertedOrderId?: string | null;
  convertedOrderRef?: string | null;
  items: QuotationItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productServiceId?: string | null;
  itemName: string;
  itemDescription?: string;
  category?: string;
  itemType: CatalogItemType;
  isCustom: boolean;
  quantity: number;
  basePrice: number;
  finalUnitPrice: number;
  priceAdjustmentReason?: string | null;
  subtotal: number;
  quantityCompleted: number;
  productionProgress: number; // 0 - 100
  productionStatus: OrderStatus;
}

/**
 * Enterprise Canonical Order record with nested OrderItem[] and overall quantity-weighted progress.
 */
export interface Order {
  id: string;
  refNo: string;
  quotationId?: string | null;
  customerName: string;
  contactNumber: string;
  product: string;
  category: string;
  orderType: OrderType;
  quantity: number;
  quantityCompleted: number;
  overallProgress?: number; // pure quantity-weighted: (sum(qtyCompleted) / sum(qty)) * 100
  unitPrice: number;
  totalPrice: number;
  amountPaid: number;
  balance: number;
  paymentStatus: PaymentStatusKey;
  status: OrderStatus;
  notes: string;
  dateOrdered: string;
  dueDate: string;
  dateCompleted?: string;
  items?: OrderItem[];
}

export interface CustomerSummary {
  name: string;
  contactNumber: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
  totalPaid: number;
  totalBalance: number;
  hasUnpaid: boolean;
  standing: "good" | "unpaid";
  orders: Order[];
  lastOrderDate: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  user: string;
  orderRef: string;
  customerName: string;
  detail: string;
  timestamp: Date | string;
  readAt?: string | null;
}

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
  items?: Partial<OrderItem>[];
}

export interface OrderUpdatePayload {
  unitPrice?: number;
  amountPaid?: number;
  quantity?: number;
  quantityCompleted?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatusKey;
  items?: { id: string; quantityCompleted: number }[];
}
