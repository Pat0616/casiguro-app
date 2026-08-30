import type { AppNotification, NotificationType, Order, OrderStatus, OrderType } from "@/types";
import { NOW } from "@/lib/constants";

type RawOrder = {
  customerName: string;
  contactNumber: string;
  product: string;
  category: string;
  orderType: OrderType;
  quantity: number;
  quantityCompleted: number;
  unitPrice: number;
  amountPaid: number;
  status: OrderStatus;
  notes: string;
  dateOrdered: string;
  dueDate: string;
  dateCompleted?: string;
};

const RAW_ORDERS: RawOrder[] = [
  // ---- Active custom orders (production monitoring) ----
  { customerName: "Marites Villanueva", contactNumber: "0917 220 4471", product: "Custom T-Shirts", category: "Apparel", orderType: "custom", quantity: 150, quantityCompleted: 40, unitPrice: 220, amountPaid: 15000, status: "in_production", notes: "Barangay fun-run shirts, neon yellow print.", dateOrdered: "2026-08-05", dueDate: "2026-08-22" },
  { customerName: "Rico Fernandez", contactNumber: "0928 551 0092", product: "Large Format Tarpaulin", category: "Signage", orderType: "custom", quantity: 4, quantityCompleted: 4, unitPrice: 850, amountPaid: 3400, status: "ready", notes: "Store opening banner, 10x5ft.", dateOrdered: "2026-08-10", dueDate: "2026-08-19" },
  { customerName: "Angeline Bautista", contactNumber: "0995 402 7788", product: "Vinyl Stickers", category: "Stickers & Labels", orderType: "custom", quantity: 500, quantityCompleted: 500, unitPrice: 12, amountPaid: 6000, status: "ready", notes: "Die-cut logo stickers, glossy.", dateOrdered: "2026-08-08", dueDate: "2026-08-18" },
  { customerName: "Joseph Manalo", contactNumber: "0917 330 2214", product: "Event Lanyards", category: "Accessories", orderType: "custom", quantity: 300, quantityCompleted: 120, unitPrice: 35, amountPaid: 5000, status: "in_production", notes: "Conference lanyards with badge holder.", dateOrdered: "2026-08-12", dueDate: "2026-08-24" },
  { customerName: "Cristina Ramos", contactNumber: "0908 774 1120", product: "Personalized Notebooks", category: "School Supplies", orderType: "custom", quantity: 80, quantityCompleted: 0, unitPrice: 95, amountPaid: 0, status: "pending", notes: "For a school's foundation day giveaways.", dateOrdered: "2026-08-17", dueDate: "2026-08-20" },
  { customerName: "Danilo Cruz", contactNumber: "0919 664 9021", product: "Custom Mugs", category: "Merchandise", orderType: "custom", quantity: 60, quantityCompleted: 60, unitPrice: 180, amountPaid: 10800, status: "ready", notes: "Wedding souvenirs, gold rim.", dateOrdered: "2026-08-01", dueDate: "2026-08-17" },
  { customerName: "Kristine Aquino", contactNumber: "0927 118 5543", product: "Custom T-Shirts", category: "Apparel", orderType: "custom", quantity: 200, quantityCompleted: 0, unitPrice: 210, amountPaid: 8000, status: "pending", notes: "Company uniform, embroidered logo.", dateOrdered: "2026-08-18", dueDate: "2026-09-02" },
  { customerName: "Paolo Reyes", contactNumber: "0916 220 8890", product: "Rollup Banner Stand", category: "Signage", orderType: "custom", quantity: 3, quantityCompleted: 1, unitPrice: 1450, amountPaid: 2000, status: "in_production", notes: "Trade show booth banners.", dateOrdered: "2026-08-14", dueDate: "2026-08-21" },
  { customerName: "Ella Mendoza", contactNumber: "0933 401 7765", product: "ID Lace & Holder", category: "Accessories", orderType: "custom", quantity: 400, quantityCompleted: 400, unitPrice: 28, amountPaid: 11200, status: "ready", notes: "University org membership IDs.", dateOrdered: "2026-08-06", dueDate: "2026-08-16" },
  { customerName: "Vincent Torres", contactNumber: "0945 810 3392", product: "Sintra Board Signage", category: "Signage", orderType: "custom", quantity: 6, quantityCompleted: 2, unitPrice: 620, amountPaid: 1500, status: "in_production", notes: "Directional signs for clinic.", dateOrdered: "2026-08-15", dueDate: "2026-08-27" },
  { customerName: "Grace Lim", contactNumber: "0906 552 4471", product: "Custom Tumblers", category: "Merchandise", orderType: "custom", quantity: 120, quantityCompleted: 0, unitPrice: 165, amountPaid: 6000, status: "pending", notes: "Corporate giveaway, laser engraved.", dateOrdered: "2026-08-19", dueDate: "2026-08-30" },
  { customerName: "Noel Santiago", contactNumber: "0917 902 6631", product: "Sticker Labels (Roll)", category: "Stickers & Labels", orderType: "custom", quantity: 1000, quantityCompleted: 650, unitPrice: 5, amountPaid: 3000, status: "in_production", notes: "Product packaging labels.", dateOrdered: "2026-08-09", dueDate: "2026-08-20" },
  { customerName: "Beatriz Ocampo", contactNumber: "0921 774 5510", product: "Custom Tote Bags", category: "Merchandise", orderType: "custom", quantity: 100, quantityCompleted: 20, unitPrice: 145, amountPaid: 5000, status: "in_production", notes: "Eco bags for product launch.", dateOrdered: "2026-08-16", dueDate: "2026-08-25" },
  { customerName: "Michael Domingo", contactNumber: "0930 118 2247", product: "Class Jackets", category: "Apparel", orderType: "custom", quantity: 45, quantityCompleted: 5, unitPrice: 780, amountPaid: 10000, status: "in_production", notes: "Senior high batch jackets.", dateOrdered: "2026-08-04", dueDate: "2026-08-19" },

  // ---- Completed transactions (custom + stock, spread across months/years) ----
  { customerName: "Josephine Garcia", contactNumber: "0917 552 8810", product: "Bond Paper (Reams)", category: "School Supplies", orderType: "stock", quantity: 25, quantityCompleted: 25, unitPrice: 220, amountPaid: 5500, status: "completed", notes: "Walk-in stock purchase.", dateOrdered: "2026-08-18", dueDate: "2026-08-18", dateCompleted: "2026-08-18" },
  { customerName: "Ramon Castillo", contactNumber: "0928 664 2210", product: "Ballpens (Box)", category: "School Supplies", orderType: "stock", quantity: 10, quantityCompleted: 10, unitPrice: 180, amountPaid: 1800, status: "completed", notes: "Office restock.", dateOrdered: "2026-08-14", dueDate: "2026-08-14", dateCompleted: "2026-08-14" },
  { customerName: "Luisa Fernandez", contactNumber: "0995 220 4471", product: "Custom T-Shirts", category: "Apparel", orderType: "custom", quantity: 100, quantityCompleted: 100, unitPrice: 215, amountPaid: 21500, status: "completed", notes: "Fun run finisher shirts.", dateOrdered: "2026-07-28", dueDate: "2026-08-10", dateCompleted: "2026-08-09" },
  { customerName: "Edgar Villareal", contactNumber: "0917 330 9981", product: "Tarpaulin", category: "Signage", orderType: "custom", quantity: 2, quantityCompleted: 2, unitPrice: 900, amountPaid: 1800, status: "completed", notes: "Sale promo tarp.", dateOrdered: "2026-08-01", dueDate: "2026-08-05", dateCompleted: "2026-08-06" },
  { customerName: "Patricia Navarro", contactNumber: "0908 118 7743", product: "Bond Paper (Reams)", category: "School Supplies", orderType: "stock", quantity: 15, quantityCompleted: 15, unitPrice: 220, amountPaid: 3300, status: "completed", notes: "Walk-in.", dateOrdered: "2026-07-22", dueDate: "2026-07-22", dateCompleted: "2026-07-22" },
  { customerName: "Francis Ilagan", contactNumber: "0919 220 6631", product: "Custom Tumblers", category: "Merchandise", orderType: "custom", quantity: 50, quantityCompleted: 50, unitPrice: 160, amountPaid: 8000, status: "completed", notes: "Team building giveaways.", dateOrdered: "2026-07-10", dueDate: "2026-07-25", dateCompleted: "2026-07-24" },
  { customerName: "Adrian Salazar", contactNumber: "0916 774 3392", product: "Sticker Labels (Roll)", category: "Stickers & Labels", orderType: "custom", quantity: 800, quantityCompleted: 800, unitPrice: 5, amountPaid: 4000, status: "completed", notes: "Packaging run.", dateOrdered: "2026-07-05", dueDate: "2026-07-18", dateCompleted: "2026-07-20" },
  { customerName: "Charlene Del Rosario", contactNumber: "0933 552 8810", product: "Event Lanyards", category: "Accessories", orderType: "custom", quantity: 250, quantityCompleted: 250, unitPrice: 32, amountPaid: 8000, status: "completed", notes: "Seminar lanyards.", dateOrdered: "2026-06-20", dueDate: "2026-07-02", dateCompleted: "2026-07-01" },
  { customerName: "Oliver Pascual", contactNumber: "0945 118 4471", product: "Bond Paper (Reams)", category: "School Supplies", orderType: "stock", quantity: 30, quantityCompleted: 30, unitPrice: 215, amountPaid: 6450, status: "completed", notes: "Bulk stock order.", dateOrdered: "2026-06-15", dueDate: "2026-06-15", dateCompleted: "2026-06-15" },
  { customerName: "Camille Rivera", contactNumber: "0906 220 9981", product: "Class Jackets", category: "Apparel", orderType: "custom", quantity: 60, quantityCompleted: 60, unitPrice: 760, amountPaid: 45600, status: "completed", notes: "Graduating batch jackets.", dateOrdered: "2026-05-20", dueDate: "2026-06-05", dateCompleted: "2026-06-04" },
  { customerName: "Bryan Espiritu", contactNumber: "0917 664 5510", product: "Custom Mugs", category: "Merchandise", orderType: "custom", quantity: 40, quantityCompleted: 40, unitPrice: 175, amountPaid: 7000, status: "completed", notes: "Anniversary giveaway.", dateOrdered: "2026-05-02", dueDate: "2026-05-15", dateCompleted: "2026-05-14" },
  { customerName: "Nicole Guevarra", contactNumber: "0928 220 3392", product: "Rollup Banner Stand", category: "Signage", orderType: "custom", quantity: 2, quantityCompleted: 2, unitPrice: 1400, amountPaid: 2800, status: "completed", notes: "Franchise expo booth.", dateOrdered: "2026-04-10", dueDate: "2026-04-22", dateCompleted: "2026-04-21" },
  { customerName: "Marites Villanueva", contactNumber: "0917 220 4471", product: "Sticker Labels (Roll)", category: "Stickers & Labels", orderType: "custom", quantity: 600, quantityCompleted: 600, unitPrice: 5, amountPaid: 3000, status: "completed", notes: "Repeat client.", dateOrdered: "2026-03-08", dueDate: "2026-03-20", dateCompleted: "2026-03-19" },
  { customerName: "Rico Fernandez", contactNumber: "0928 551 0092", product: "Custom Tote Bags", category: "Merchandise", orderType: "custom", quantity: 80, quantityCompleted: 80, unitPrice: 140, amountPaid: 11200, status: "completed", notes: "Eco-bag campaign.", dateOrdered: "2026-02-14", dueDate: "2026-02-28", dateCompleted: "2026-03-01" },
  { customerName: "Josephine Garcia", contactNumber: "0917 552 8810", product: "Custom T-Shirts", category: "Apparel", orderType: "custom", quantity: 90, quantityCompleted: 90, unitPrice: 200, amountPaid: 18000, status: "completed", notes: "Fiesta committee shirts.", dateOrdered: "2025-12-02", dueDate: "2025-12-15", dateCompleted: "2025-12-14" },
  { customerName: "Danilo Cruz", contactNumber: "0919 664 9021", product: "Tarpaulin", category: "Signage", orderType: "custom", quantity: 3, quantityCompleted: 3, unitPrice: 880, amountPaid: 2640, status: "completed", notes: "Year-end sale tarp.", dateOrdered: "2025-11-18", dueDate: "2025-12-01", dateCompleted: "2025-11-30" },
  { customerName: "Josephine Garcia", contactNumber: "0917 552 8810", product: "Custom T-Shirts School", category: "Apparel", orderType: "custom", quantity: 90, quantityCompleted: 90, unitPrice: 200, amountPaid: 18000, status: "completed", notes: "Fiesta committee shirts.", dateOrdered: "2025-11-15", dueDate: "2025-12-01", dateCompleted: "2025-11-28" },
];

export const MOCK_ORDERS: Order[] = RAW_ORDERS.map((o, i) => {
  const totalPrice = o.quantity * o.unitPrice;
  const balance = Math.max(totalPrice - o.amountPaid, 0);
  const paymentStatus = o.amountPaid <= 0 ? "unpaid" : balance <= 0 ? "paid" : "partial";
  return {
    id: `ord-${i + 1}`,
    refNo: `TXN-${o.dateOrdered.slice(0, 4)}-${String(i + 1).padStart(4, "0")}`,
    ...o,
    totalPrice,
    balance,
    paymentStatus,
  };
});

type RawNotification = {
  type: NotificationType;
  user: string;
  orderRef: string;
  customerName: string;
  detail: string;
  minutesAgo: number;
};

const RAW_NOTIFICATIONS: RawNotification[] = [
  { type: "detail_update", user: "John Aguilar", orderRef: "TXN-2026-0012", customerName: "Noel Santiago", detail: "Quantity Completed changed from 500 → 650", minutesAgo: 10 },
  { type: "status_update", user: "Maria Santos", orderRef: "TXN-2026-0002", customerName: "Rico Fernandez", detail: "Order Status changed from In Production → Ready for Pickup", minutesAgo: 45 },
  { type: "new_order", user: "John Aguilar", orderRef: "TXN-2026-0011", customerName: "Grace Lim", detail: "New Custom Order created — Custom Tumblers × 120", minutesAgo: 95 },
  { type: "detail_update", user: "Maria Santos", orderRef: "TXN-2026-0001", customerName: "Marites Villanueva", detail: "Amount Paid increased from ₱10,000.00 → ₱15,000.00", minutesAgo: 160 },
  { type: "new_order", user: "Admin", orderRef: "TXN-2026-0015", customerName: "Josephine Garcia", detail: "New Stock Order created — Bond Paper (Reams) × 25", minutesAgo: 300 },
  { type: "status_update", user: "John Aguilar", orderRef: "TXN-2026-0006", customerName: "Danilo Cruz", detail: "Order Status changed from In Production → Ready for Pickup", minutesAgo: 480 },
  { type: "detail_update", user: "Maria Santos", orderRef: "TXN-2026-0004", customerName: "Joseph Manalo", detail: "Unit Price changed from ₱30.00 → ₱35.00", minutesAgo: 620 },
  { type: "status_update", user: "Admin", orderRef: "TXN-2026-0018", customerName: "Luisa Fernandez", detail: "Order Status changed from Ready for Pickup → Completed", minutesAgo: 1500 },
  { type: "new_order", user: "John Aguilar", orderRef: "TXN-2026-0009", customerName: "Ella Mendoza", detail: "New Custom Order created — ID Lace & Holder × 400", minutesAgo: 2100 },
  { type: "detail_update", user: "Maria Santos", orderRef: "TXN-2026-0013", customerName: "Michael Domingo", detail: "Quantity Completed changed from 0 → 5", minutesAgo: 2600 },
];

export const MOCK_NOTIFICATIONS: AppNotification[] = RAW_NOTIFICATIONS.map((n, i) => ({
  id: `note-${i + 1}`,
  ...n,
  timestamp: new Date(NOW.getTime() - n.minutesAgo * 60000),
}));
