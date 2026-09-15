import {
  LayoutDashboard, ClipboardList, Factory, CheckCircle2, Users, BarChart3, Bell, PackageCheck,
} from "lucide-react";
import type { OrderStatus, PageKey, PaymentStatusKey } from "@/types";

/**
 * Design tokens derived from the CASIGURO Enterprises login screen.
 * pink -> pink-600/500 | blue -> sky-500 | yellow -> yellow-400
 * purple (gradient bridge) -> fuchsia-600/violet-600 | ink -> slate-900/500
 */
export const GRADIENT = "bg-gradient-to-r from-pink-600 via-fuchsia-600 to-sky-500";
export const GRADIENT_TEXT = "bg-gradient-to-r from-pink-600 via-fuchsia-600 to-sky-500 bg-clip-text text-transparent";

export const NAV_ITEMS: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products-services", label: "Catalog & Pricing", icon: PackageCheck },
  { key: "orders", label: "Order Management", icon: ClipboardList },
  { key: "production", label: "Production Monitoring", icon: Factory },
  { key: "completed", label: "Completed Transactions", icon: CheckCircle2 },
  { key: "customers", label: "Customer Overview", icon: Users },
  { key: "statistics", label: "Statistics", icon: BarChart3 },
  { key: "notifications", label: "Notifications", icon: Bell },
];

export const CATEGORIES = [
  "Apparel",
  "Signage",
  "Stickers & Labels",
  "Accessories",
  "School Supplies",
  "Merchandise",
];

export const ORDER_STATUS: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: "Pending", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  in_production: { label: "In Production", badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  ready: { label: "Ready for Pickup", badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  completed: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
};

export const PAYMENT_STATUS: Record<PaymentStatusKey, { label: string; badge: string }> = {
  unpaid: { label: "Unpaid", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  partial: { label: "Partially Paid", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  paid: { label: "Paid", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const PIE_COLORS = ["#db2777", "#0ea5e9", "#facc15", "#7c3aed", "#10b981", "#f97316"];

export const NOW = new Date();
