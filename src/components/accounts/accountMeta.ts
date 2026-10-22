import { Boxes, CreditCard, FileText, LogIn, ShoppingBag, UserCog, type LucideIcon } from "lucide-react";
import type { AccountStatus, AuditCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: "Pending approval", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  active: { label: "Active", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  deactivated: { label: "Deactivated", badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  rejected: { label: "Rejected", badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
};

export const ROLE_BADGE: Record<"admin" | "employee", { label: string; badge: string; dot: string }> = {
  admin: { label: "Admin", badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  employee: { label: "Employee", badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
};

export const AUDIT_CATEGORY: Record<AuditCategory, { label: string; icon: LucideIcon; tint: string }> = {
  auth: { label: "Sign-ins", icon: LogIn, tint: "bg-slate-100 text-slate-600" },
  account: { label: "Accounts", icon: UserCog, tint: "bg-violet-50 text-violet-600" },
  order: { label: "Orders", icon: ShoppingBag, tint: "bg-sky-50 text-sky-600" },
  payment: { label: "Payments", icon: CreditCard, tint: "bg-emerald-50 text-emerald-600" },
  quotation: { label: "Quotations", icon: FileText, tint: "bg-pink-50 text-pink-600" },
  catalog: { label: "Catalog", icon: Boxes, tint: "bg-amber-50 text-amber-600" },
};

// Audit actions that deserve attention when scanning a log
export const FLAGGED_ACTIONS: Record<string, string> = {
  "auth.login_failed": "border-l-rose-400 bg-rose-50/40",
  "auth.login_blocked": "border-l-amber-400 bg-amber-50/40",
  "account.promote_failed": "border-l-rose-400 bg-rose-50/40",
};

// Server timestamps arrive as "YYYY-MM-DD HH:MM:SS" in local time
export function parseServerDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null | undefined): string {
  const date = parseServerDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

const MONEY_FIELDS = new Set(["amountPaid", "balance", "totalPrice", "unitPrice", "basePrice", "totalAmount"]);

// "amountPaid" -> "Amount paid"; labels that already contain spaces (e.g. "PO No") are kept
export function fieldLabel(field: string): string {
  if (/\s/.test(field)) return field;
  const spaced = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function formatChangeValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (MONEY_FIELDS.has(field) && !Number.isNaN(Number(value))) return formatCurrency(Number(value));
  return String(value).replace(/_/g, " ");
}
