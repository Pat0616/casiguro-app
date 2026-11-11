import { Boxes, CreditCard, FileText, LogIn, ShoppingBag, UserCog, type LucideIcon } from "lucide-react";
import type { AccountStatus, AuditCategory } from "@/types";
import { formatCurrency, isoDate } from "@/lib/utils";

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
  "account.deactivate_failed": "border-l-rose-400 bg-rose-50/40",
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

export function formatTimeWithSeconds(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

// Pulls the user-typed reason out of an audit description so it can be shown on its own. Descriptions are written
// by the server in a few fixed shapes; anything else is returned unchanged with no reason.
const REASON_PATTERNS: Array<{ actions: string[] | null; pattern: RegExp; text: (m: RegExpMatchArray) => string }> = [
  // "Deadline for SOA … (was …). Reason: X" / "Items on SOA … updated: …. Reason: X"
  { actions: null, pattern: /^([\s\S]*?)\.?\s*Reason: ([\s\S]+)$/, text: (m) => `${m[1]}.` },
  // "Voided Payment ₱300.00 via Cash on SOA 2026-10-7: X. New balance: ₱20,900.00"
  {
    actions: ["payment.void"],
    pattern: /^(Voided .+? on SOA \S+): ([\s\S]+)\. (New balance: .+)$/,
    text: (m) => `${m[1]}. ${m[3]}`,
  },
  // "SOA 2026-10-7 was cancelled: X"
  { actions: ["order.cancel"], pattern: /^(.+? was cancelled): ([\s\S]+)$/, text: (m) => m[1] },
  // "Rejected the registration of Name (email): X" / "Deactivated admin account Name (email): X"
  { actions: ["account.reject", "account.deactivate"], pattern: /^(.+?\)): ([\s\S]+)$/, text: (m) => m[1] },
  // "Marked quotation QTN-… (Customer) as rejected: X"
  { actions: ["quotation.status_change"], pattern: /^(Marked quotation .+? as \w+): ([\s\S]+)$/, text: (m) => m[1] },
];

export function splitReason(entry: { action: string; description: string }): { text: string; reason: string | null } {
  for (const { actions, pattern, text } of REASON_PATTERNS) {
    if (actions && !actions.includes(entry.action)) continue;
    const match = entry.description.match(pattern);
    if (!match) continue;
    const reason = match[2]?.trim(); // every pattern captures the reason as group 2
    if (reason) return { text: text(match).trim(), reason };
  }
  return { text: entry.description, reason: null };
}

// Quick date ranges for the activity log filter (YYYY-MM-DD, local time)
export type DatePreset = "all" | "today" | "7d" | "30d" | "month";
export const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "month", label: "This month" },
];

export function presetRange(preset: DatePreset): { from: string; to: string } {
  if (preset === "all") return { from: "", to: "" };
  const today = new Date();
  const to = isoDate(today);
  if (preset === "today") return { from: to, to };
  if (preset === "month") return { from: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  const start = new Date(today);
  start.setDate(start.getDate() - (preset === "7d" ? 6 : 29));
  return { from: isoDate(start), to };
}

const MONEY_FIELDS =new Set(["amountPaid", "balance", "totalPrice", "unitPrice", "basePrice", "totalAmount"]);

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
