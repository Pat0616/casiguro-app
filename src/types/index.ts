export type OrderType = "custom" | "stock";
export type OrderStatus = "pending" | "in_production" | "ready" | "completed" | "cancelled";
export type PaymentStatusKey = "unpaid" | "partial" | "paid";
/** down_payment / payment, or EWT: tax the client withholds (BIR 2307); it settles the balance but isn't cash */
export type PaymentType = "down_payment" | "payment" | "ewt";
export type PaymentMethod = "cash" | "gcash" | "check" | "bank_transfer";
export type NotificationType = "new_order" | "status_update" | "detail_update" | "quotation_update";
export type PageKey =
  | "dashboard"
  | "orders"
  | "production"
  | "completed"
  | "customers"
  | "statistics"
  | "notifications"
  | "products-services"
  | "accounts";

export type AccountStatus = "pending" | "active" | "rejected" | "deactivated";
export type AuditCategory = "auth" | "account" | "order" | "payment" | "quotation" | "catalog";

export interface Account {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  role: "admin" | "employee";
  status: AccountStatus;
  registeredAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  statusReason: string | null;
  lastLoginAt: string | null;
  auditCount: number;
}

export interface AccountDetail extends Account {
  activitySummary: {
    byCategory: Partial<Record<AuditCategory, number>>;
    lastActivityAt: string | null;
    failedLogins30d: number;
  };
}

export interface AuditLogEntry {
  id: number;
  action: string;
  category: AuditCategory;
  entityType: string | null;
  entityId: string | null;
  entityLabel: string | null;
  description: string;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export type CustomerPaymentFilter = "all" | "unpaid" | "partial" | "paid";
export type CatalogItemType = "product" | "service";
export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface CatalogItemVariant {
  name: string;
  price: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  type: CatalogItemType;
  basePrice: number;
  defaultUnitPrice?: number;
  variants?: CatalogItemVariant[];
  description: string;
  imageUrl?: string | null;
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
  selectedVariant?: string | null;
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
  selectedVariant?: string | null;
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

/** Optional reference documents attached to an order. Dates are YYYY-MM-DD. */
export interface OrderDocuments {
  prNo: string | null; // Customer's Purchase Request No
  poNo: string | null; // Customer's Purchase Order No
  joNo: string | null; // Job Order No
  siOrNo: string | null; // Sales Invoice / Official Receipt No
  siOrDate: string | null;
  drNo: string | null; // Delivery Receipt No
  drDate: string | null;
}

/**
 * Enterprise Canonical Order record with nested OrderItem[] and overall quantity-weighted progress.
 */
export interface Order extends OrderDocuments {
  id: string;
  soaNo: string; // Statement of Account No, YYYY-MM-N (system-assigned)
  soaDate: string; // Date the order was created (system-assigned)
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
  cancelledAt?: string | null;
  cancelReason?: string | null;
  cancelledByName?: string;
  items?: OrderItem[];
  /** Every payment entry, voided ones included (oldest first). amountPaid/balance/paymentStatus are derived from these. */
  payments?: Payment[];
}

export interface Payment {
  id: string;
  orderId: string;
  paymentType: PaymentType;
  method: PaymentMethod | null; // null for EWT and for payments recorded before the payment log existed
  amount: number;
  receivedOn: string; // YYYY-MM-DD
  referenceNo: string | null; // GCash/bank ref, check no., or 2307 certificate no.
  checkBank: string | null;
  checkDate: string | null;
  orNo: string | null;
  note: string | null;
  voidedAt: string | null;
  voidedByName: string;
  voidReason: string | null;
  createdByName: string;
  createdAt: string;
}

/** Body of POST /api/orders/:id/payments (and the optional down payment when creating an order) */
export interface PaymentInput {
  paymentType?: PaymentType;
  method?: PaymentMethod;
  amount: number;
  receivedOn?: string;
  referenceNo?: string;
  checkBank?: string;
  checkDate?: string;
  orNo?: string;
  note?: string;
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

export interface NewOrderFormData extends Partial<OrderDocuments> {
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
  /** Custom orders: optional down payment taken when the order is placed */
  downPayment?: PaymentInput;
  /** Stock orders are paid in full on the spot; the amount is always the order total */
  stockPayment?: Omit<PaymentInput, "amount" | "paymentType">;
}

/** PUT /api/orders/:id: production fields only; money is changed through payments */
export interface OrderUpdatePayload {
  quantityCompleted?: number;
  status?: Exclude<OrderStatus, "cancelled">;
}
